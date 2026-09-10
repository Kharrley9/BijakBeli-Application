const Store = require('../models/Store');
const Product = require('../models/Product');
const Price = require('../models/Price');
const Category = require('../models/Category');
const Promotion = require('../models/Promotion');
const User = require('../models/User');
const promotionService = require('./promotionService');
const {
  STORE_CATEGORY_SLUGS,
  STORE_CATEGORIES,
} = require('../config/constants');

function badRequest(message) {
  const e = new Error(message);
  e.statusCode = 400;
  return e;
}
function notFound(message) {
  const e = new Error(message);
  e.statusCode = 404;
  return e;
}

// Fields a merchant may set on their own store.
const STORE_WRITABLE = [
  'storeName',
  'storeCategory',
  'phone',
  'description',
  'address',
  'city',
  'state',
  'operating_hours',
  'logo',
  'bannerImage',
  'deliveryAvailable',
  'deliveryFee',
  'pickupAvailable',
  'minOrder',
];

function pickStoreFields(src = {}) {
  const out = {};
  for (const key of STORE_WRITABLE) {
    if (src[key] !== undefined) out[key] = src[key];
  }
  return out;
}

function normaliseLocation(loc) {
  const coords = loc && loc.coordinates;
  const valid =
    Array.isArray(coords) &&
    coords.length === 2 &&
    coords.every((n) => typeof n === 'number' && !Number.isNaN(n)) &&
    !(coords[0] === 0 && coords[1] === 0);
  if (!valid) return null;
  return { type: 'Point', coordinates: [coords[0], coords[1]] };
}

class MerchantService {
  /**
   * Register the caller's (one) store. Auto-approved — goes live immediately —
   * and upgrades the account to the `merchant` role.
   */
  async registerStore(user, body = {}) {
    const existing = await Store.findOne({ ownerId: user._id });
    if (existing) {
      const e = new Error('You already have a registered store');
      e.statusCode = 409;
      throw e;
    }

    const fields = pickStoreFields(body);
    if (!fields.storeName) throw badRequest('Store name is required');
    if (!fields.storeCategory || !STORE_CATEGORY_SLUGS.includes(fields.storeCategory)) {
      throw badRequest('A valid store category is required');
    }
    if (!fields.address) throw badRequest('Address is required');
    if (!fields.city) throw badRequest('City is required');
    if (!fields.state) throw badRequest('State is required');

    // Location: explicit body.location, else the user's saved businessLocation.
    let location =
      normaliseLocation(body.location) ||
      normaliseLocation(user.businessLocation);
    if (!location) {
      throw badRequest(
        'Set your store location first (use your saved location or drop a pin)'
      );
    }

    const store = await Store.create({
      ...fields,
      kind: 'merchant',
      ownerId: user._id,
      status: 'active',
      isActive: true,
      type: 'independent',
      location,
    });

    if (user.role === 'customer') {
      await User.findByIdAndUpdate(user._id, { role: 'merchant' });
    }

    return store;
  }

  async getMyStore(store) {
    const obj = store.toObject ? store.toObject() : store;
    const [productCount, activePromoCount] = await Promise.all([
      Product.countDocuments({ ownerId: store.ownerId, status: 'active' }),
      Promotion.countDocuments({
        storeId: store._id,
        endDate: { $gte: new Date() },
      }),
    ]);
    return {
      ...obj,
      stats: {
        productCount,
        activePromoCount,
        views: obj.views || 0,
        rating: obj.rating || 0,
        reviewCount: obj.reviewCount || 0,
      },
    };
  }

  async updateMyStore(store, body = {}) {
    const fields = pickStoreFields(body);
    if (
      fields.storeCategory &&
      !STORE_CATEGORY_SLUGS.includes(fields.storeCategory)
    ) {
      throw badRequest('Invalid store category');
    }
    const location = normaliseLocation(body.location);
    if (location) fields.location = location;

    Object.assign(store, fields);
    await store.save();
    return store;
  }

  /**
   * Product categories for a store-category group. Guarantees at least one
   * exists (creates a "General <Label>" fallback for groups with none — e.g.
   * telco / other), so the merchant always has something to pick.
   */
  async getGroupCategories(group) {
    if (!STORE_CATEGORY_SLUGS.includes(group)) throw badRequest('Invalid group');
    let cats = await Category.find({ group }).sort({ order: 1, categoryName: 1 });
    if (!cats.length) {
      const label =
        STORE_CATEGORIES.find((c) => c.slug === group)?.label || 'General';
      const created = await Category.create({
        categoryName: `General ${label}`,
        group,
        icon: STORE_CATEGORIES.find((c) => c.slug === group)?.icon || 'pricetag-outline',
        order: 0,
      });
      cats = [created];
    }
    return cats;
  }

  async listProducts(store) {
    const prices = await Price.find({ storeId: store._id })
      .populate({
        path: 'productId',
        select: 'productName image unit storeCategory categoryId status description attributes ownerId',
        populate: { path: 'categoryId', select: 'categoryName group' },
      })
      .sort('-updatedAt')
      .lean();

    return prices
      .filter((r) => r.productId)
      .map((r) => ({
        _id: r.productId._id,
        productName: r.productId.productName,
        description: r.productId.description,
        image: r.productId.image,
        unit: r.productId.unit,
        storeCategory: r.productId.storeCategory,
        categoryId: r.productId.categoryId?._id,
        category: r.productId.categoryId?.categoryName,
        attributes: r.productId.attributes || {},
        status: r.productId.status,
        priceId: r._id,
        price: r.price,
        previousPrice: r.previousPrice,
        stock: r.stock,
        inStock: r.inStock !== false,
        sku: r.sku,
        ownProduct: String(r.productId.ownerId || '') === String(store.ownerId),
      }));
  }

  async _resolveCategory(categoryId, storeCategory) {
    if (!categoryId) throw badRequest('Product category is required');
    const category = await Category.findById(categoryId);
    if (!category) throw notFound('Category not found');
    if (category.group !== storeCategory) {
      throw badRequest(
        `That category belongs to "${category.group}", not your store category "${storeCategory}"`
      );
    }
    return category;
  }

  /**
   * Create a product owned by this merchant and its price row at their store.
   * body: { productName, description, categoryId, unit, image, attributes,
   *         price, previousPrice, stock, inStock, sku }
   */
  async createProduct(store, body = {}) {
    if (!body.productName) throw badRequest('Product name is required');
    if (!body.unit) throw badRequest('Unit is required');
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) throw badRequest('A valid price is required');

    const category = await this._resolveCategory(body.categoryId, store.storeCategory);

    const product = await Product.create({
      productName: body.productName,
      description: body.description || '',
      categoryId: category._id,
      storeCategory: store.storeCategory,
      ownerId: store.ownerId,
      unit: body.unit,
      image: body.image || '',
      attributes: body.attributes || {},
      status: 'active',
    });

    const priceDoc = await Price.create({
      productId: product._id,
      storeId: store._id,
      price,
      previousPrice:
        body.previousPrice != null && body.previousPrice !== ''
          ? Number(body.previousPrice)
          : null,
      stock: body.stock != null && body.stock !== '' ? Number(body.stock) : null,
      inStock: body.inStock !== false,
      sku: body.sku || undefined,
      lastUpdated: new Date(),
    });

    return { product, price: priceDoc };
  }

  /**
   * Update a merchant-owned product and/or its price row at their store.
   */
  async updateProduct(store, productId, body = {}) {
    const product = await Product.findById(productId);
    if (!product) throw notFound('Product not found');
    if (String(product.ownerId || '') !== String(store.ownerId)) {
      const e = new Error('You can only edit products you created');
      e.statusCode = 403;
      throw e;
    }

    if (body.categoryId) {
      const category = await this._resolveCategory(body.categoryId, store.storeCategory);
      product.categoryId = category._id;
    }
    for (const key of ['productName', 'description', 'unit', 'image']) {
      if (body[key] !== undefined) product[key] = body[key];
    }
    if (body.attributes !== undefined) product.attributes = body.attributes;
    if (body.status && ['active', 'inactive'].includes(body.status)) {
      product.status = body.status;
    }
    await product.save();

    const priceUpdate = {};
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) throw badRequest('Invalid price');
      priceUpdate.price = price;
    }
    if (body.previousPrice !== undefined) {
      priceUpdate.previousPrice =
        body.previousPrice === '' || body.previousPrice == null
          ? null
          : Number(body.previousPrice);
    }
    if (body.stock !== undefined) {
      priceUpdate.stock =
        body.stock === '' || body.stock == null ? null : Number(body.stock);
    }
    if (body.inStock !== undefined) priceUpdate.inStock = !!body.inStock;
    if (body.sku !== undefined) priceUpdate.sku = body.sku || undefined;

    let priceDoc = await Price.findOne({ productId, storeId: store._id });
    if (Object.keys(priceUpdate).length) {
      priceUpdate.lastUpdated = new Date();
      priceDoc = await Price.findOneAndUpdate(
        { productId, storeId: store._id },
        { $set: priceUpdate },
        { new: true, upsert: true, runValidators: true }
      );
    }

    return { product, price: priceDoc };
  }

  /**
   * Quick price / stock / availability update (from the product-management list).
   */
  async quickUpdatePrice(store, productId, body = {}) {
    const priceDoc = await Price.findOne({ productId, storeId: store._id });
    if (!priceDoc) throw notFound('This product is not listed at your store');

    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) throw badRequest('Invalid price');
      if (price !== priceDoc.price) priceDoc.previousPrice = priceDoc.price;
      priceDoc.price = price;
    }
    if (body.stock !== undefined) {
      priceDoc.stock =
        body.stock === '' || body.stock == null ? null : Number(body.stock);
    }
    if (body.inStock !== undefined) priceDoc.inStock = !!body.inStock;
    priceDoc.lastUpdated = new Date();
    await priceDoc.save();
    return priceDoc;
  }

  async deleteProduct(store, productId) {
    const product = await Product.findById(productId);
    if (!product) throw notFound('Product not found');
    if (String(product.ownerId || '') !== String(store.ownerId)) {
      const e = new Error('You can only delete products you created');
      e.statusCode = 403;
      throw e;
    }
    await Price.deleteMany({ productId });
    await Promotion.deleteMany({ productId });
    await Product.findByIdAndDelete(productId);
    return { _id: productId };
  }

  async listPromotions(store) {
    return Promotion.find({ storeId: store._id })
      .populate('productId', 'productName image unit')
      .sort('-createdAt');
  }

  async createPromotion(store, body = {}) {
    if (!body.productId) throw badRequest('Product is required');
    const priceDoc = await Price.findOne({
      productId: body.productId,
      storeId: store._id,
    });
    if (!priceDoc) throw badRequest('That product is not listed at your store');

    const promoPrice = Number(body.promotionPrice);
    if (!Number.isFinite(promoPrice) || promoPrice < 0) {
      throw badRequest('A valid promotion price is required');
    }
    if (promoPrice >= priceDoc.price) {
      throw badRequest('Promotion price must be lower than the current price');
    }

    const start = body.startDate ? new Date(body.startDate) : new Date();
    const end = body.endDate ? new Date(body.endDate) : null;
    if (!end || Number.isNaN(end.getTime())) throw badRequest('A valid end date is required');
    if (end <= start) throw badRequest('End date must be after the start date');

    return promotionService.create({
      productId: body.productId,
      storeId: store._id,
      promotionTitle: body.promotionTitle || 'Special Offer',
      promotionType: body.promotionType || 'discount',
      promotionPrice: promoPrice,
      startDate: start,
      endDate: end,
    });
  }

  async deletePromotion(store, promotionId) {
    const promo = await Promotion.findById(promotionId);
    if (!promo) throw notFound('Promotion not found');
    if (String(promo.storeId) !== String(store._id)) {
      const e = new Error('That promotion belongs to another store');
      e.statusCode = 403;
      throw e;
    }
    await Promotion.findByIdAndDelete(promotionId);
    return { _id: promotionId };
  }
}

module.exports = new MerchantService();
