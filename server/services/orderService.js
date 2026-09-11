const orderRepository = require('../repositories/orderRepository');
const Store = require('../models/Store');
const Price = require('../models/Price');
const budgetService = require('./budgetService');
const notificationService = require('./notificationService');
const {
  ORDER_FLOW,
  BUYER_CANCELLABLE,
  ORDER_STATUS_LABELS,
} = require('../config/constants');

function bad(message, code = 400) {
  const e = new Error(message);
  e.statusCode = code;
  return e;
}
const money = (n) => Math.round(n * 100) / 100;

class OrderService {
  /**
   * Place one order per store from the buyer's cart.
   * @param {object} user  the authenticated user document
   * @param {Array}  carts [{ storeId, items:[{productId, qty}], fulfilment,
   *                          deliveryAddress?, contactPhone?, notes? }]
   * @returns {Promise<Array>} the created orders
   */
  async placeOrders(user, carts) {
    if (!Array.isArray(carts) || carts.length === 0) {
      throw bad('Your cart is empty');
    }

    const created = [];
    for (const cart of carts) {
      created.push(await this._placeOne(user, cart));
    }

    // Best-effort: roll the total into this month's budget.
    try {
      const now = new Date();
      const grand = created.reduce((s, o) => s + o.total, 0);
      await budgetService.addExpense(user._id, grand, now.getMonth() + 1, now.getFullYear());
    } catch (_) {
      /* no budget set — fine */
    }

    return created;
  }

  async _placeOne(user, cart) {
    const { storeId, items, fulfilment } = cart;
    if (!storeId) throw bad('Missing store');
    if (!['pickup', 'delivery'].includes(fulfilment)) throw bad('Choose pickup or delivery');
    if (!Array.isArray(items) || items.length === 0) throw bad('No items for this store');

    const store = await Store.findById(storeId);
    if (!store || store.isActive === false) throw bad('Store not available', 404);
    if (store.kind !== 'merchant') throw bad('This store does not take orders');
    if (fulfilment === 'delivery' && !store.deliveryAvailable) {
      throw bad(`${store.storeName} does not offer delivery`);
    }
    if (fulfilment === 'pickup' && store.pickupAvailable === false) {
      throw bad(`${store.storeName} does not offer pickup`);
    }

    const productIds = items.map((i) => i.productId);
    const priceRows = await Price.find({ storeId, productId: { $in: productIds } }).populate(
      'productId',
      'productName unit'
    );
    const byProduct = new Map(priceRows.map((r) => [String(r.productId._id), r]));

    const orderItems = [];
    for (const line of items) {
      const qty = Math.max(1, parseInt(line.qty) || 1);
      const row = byProduct.get(String(line.productId));
      if (!row) throw bad('An item is no longer sold at this store');
      if (row.inStock === false) throw bad(`${row.productId.productName} is out of stock`);
      if (row.stock != null && row.stock < qty) {
        throw bad(`Only ${row.stock} of ${row.productId.productName} left`);
      }
      const lineTotal = money(row.price * qty);
      orderItems.push({
        productId: row.productId._id,
        name: row.productId.productName,
        unit: row.productId.unit,
        unitPrice: row.price,
        qty,
        lineTotal,
      });
    }

    const subtotal = money(orderItems.reduce((s, i) => s + i.lineTotal, 0));
    if (store.minOrder && subtotal < store.minOrder) {
      throw bad(`Minimum order for ${store.storeName} is RM${store.minOrder.toFixed(2)}`);
    }
    const deliveryFee = fulfilment === 'delivery' ? money(store.deliveryFee || 0) : 0;
    const total = money(subtotal + deliveryFee);

    const contactPhone = (cart.contactPhone || user.phone || '').trim();
    const addr = cart.deliveryAddress || {};

    const order = await orderRepository.create({
      userId: user._id,
      storeId: store._id,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      fulfilment,
      deliveryAddress:
        fulfilment === 'delivery'
          ? {
              label: addr.label,
              line: addr.line || addr.label,
              city: addr.city || store.city,
              state: addr.state || store.state,
            }
          : undefined,
      contactPhone,
      paymentMethod: fulfilment === 'delivery' ? 'cod' : 'pay_at_pickup',
      status: 'pending',
      statusHistory: [{ status: 'pending', at: new Date() }],
      notes: (cart.notes || '').trim() || undefined,
    });

    // Decrement tracked stock.
    await Promise.all(
      orderItems
        .filter((i) => {
          const row = byProduct.get(String(i.productId));
          return row && row.stock != null;
        })
        .map((i) =>
          Price.updateOne(
            { storeId: store._id, productId: i.productId, stock: { $gte: i.qty } },
            { $inc: { stock: -i.qty } }
          )
        )
    );

    if (store.ownerId) {
      notificationService
        .create(
          store.ownerId,
          'New order',
          `Order ${order.orderNumber} · RM${total.toFixed(2)} · ${fulfilment}`
        )
        .catch(() => {});
    }

    return order;
  }

  async getUserOrders(userId, { status } = {}) {
    const filter = {};
    if (status === 'active') filter.status = { $nin: ['completed', 'cancelled'] };
    else if (status) filter.status = status;
    return await orderRepository.findByUser(userId, filter);
  }

  async getOrder(id, user) {
    const order = await orderRepository.findById(id);
    if (!order) throw bad('Order not found', 404);
    const isBuyer = String(order.userId._id || order.userId) === String(user._id);
    const isOwner =
      order.storeId &&
      String(order.storeId.ownerId || '') === String(user._id);
    if (!isBuyer && !isOwner && user.role !== 'admin') throw bad('Not your order', 403);
    return order;
  }

  async cancelByBuyer(id, user, note) {
    const order = await orderRepository.findById(id);
    if (!order) throw bad('Order not found', 404);
    if (String(order.userId._id || order.userId) !== String(user._id)) {
      throw bad('Not your order', 403);
    }
    if (!BUYER_CANCELLABLE.includes(order.status)) {
      throw bad(`This order can no longer be cancelled (it is "${ORDER_STATUS_LABELS[order.status]}")`);
    }
    await this._applyStatus(order, 'cancelled', note, 'buyer');
    return order;
  }

  // ---- merchant side ----

  async getStoreOrders(storeId, { status } = {}) {
    const filter = {};
    if (status === 'active') filter.status = { $nin: ['completed', 'cancelled'] };
    else if (status) filter.status = status;
    return await orderRepository.findByStore(storeId, filter);
  }

  async advanceStatus(store, orderId, nextStatus, note) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw bad('Order not found', 404);
    if (String(order.storeId._id || order.storeId) !== String(store._id)) {
      throw bad('That order belongs to another store', 403);
    }
    if (['completed', 'cancelled'].includes(order.status)) {
      throw bad('This order is already closed');
    }

    if (nextStatus === 'cancelled') {
      await this._applyStatus(order, 'cancelled', note, 'merchant');
      return order;
    }

    const flow = ORDER_FLOW[order.fulfilment] || ORDER_FLOW.pickup;
    const curIdx = flow.indexOf(order.status);
    const nextIdx = flow.indexOf(nextStatus);
    if (nextIdx === -1) throw bad(`"${nextStatus}" is not valid for a ${order.fulfilment} order`);
    if (nextIdx <= curIdx) throw bad('Status can only move forward');
    if (nextIdx > curIdx + 1) throw bad(`Advance one step at a time (next: "${flow[curIdx + 1]}")`);

    await this._applyStatus(order, nextStatus, note);
    return order;
  }

  async _applyStatus(order, status, note, cancelledBy) {
    order.status = status;
    order.statusHistory.push({ status, at: new Date(), note: note || undefined });
    if (status === 'cancelled') {
      order.cancelledBy = cancelledBy || null;
      // restore tracked stock
      await Promise.all(
        order.items.map((i) =>
          Price.updateOne(
            { storeId: order.storeId._id || order.storeId, productId: i.productId._id || i.productId, stock: { $ne: null } },
            { $inc: { stock: i.qty } }
          )
        )
      );
    }
    await orderRepository.save(order);

    // notify the other party
    const buyerId = String(order.userId._id || order.userId);
    const label = ORDER_STATUS_LABELS[status] || status;
    if (cancelledBy === 'buyer') {
      const ownerId = order.storeId && order.storeId.ownerId;
      if (ownerId) {
        notificationService
          .create(ownerId, 'Order cancelled', `Order ${order.orderNumber} was cancelled by the buyer`)
          .catch(() => {});
      }
    } else {
      notificationService
        .create(buyerId, `Order ${label.toLowerCase()}`, `Order ${order.orderNumber} is now "${label}"`)
        .catch(() => {});
    }
  }

  async getOrderCount(query = {}) {
    return await orderRepository.count(query);
  }
}

module.exports = new OrderService();
