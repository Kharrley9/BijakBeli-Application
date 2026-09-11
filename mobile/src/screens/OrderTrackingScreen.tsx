import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import OrderStatusStepper from '../components/OrderStatusStepper';
import { orderService } from '../services/dataService';
import { Order, OrderStoreSummary } from '../types';
import { BUYER_CANCELLABLE_STATUSES, ORDER_STATUS_LABELS } from '../constants';

export default function OrderTrackingScreen({ route, navigation }: any) {
  const { id } = route.params || {};
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      const res: any = await orderService.getOrder(id);
      setOrder(res.data);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Order" />
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      </View>
    );
  }
  if (!order) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Order" />
        <Text style={styles.empty}>Order not found.</Text>
      </View>
    );
  }

  const store = order.storeId as OrderStoreSummary;
  const canCancel = BUYER_CANCELLABLE_STATUSES.includes(order.status);

  const cancel = () => {
    Alert.alert('Cancel order', `Cancel order ${order.orderNumber}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await orderService.cancel(order._id);
            load();
          } catch (e: any) {
            Alert.alert('Could not cancel', e?.message || 'Please try again.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const call = () => store?.phone && Linking.openURL(`tel:${store.phone}`);

  return (
    <View style={styles.safe}>
      <AppHeader title={order.orderNumber} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headCard}>
          <TouchableOpacity
            style={styles.storeRow}
            onPress={() => store?._id && navigation.navigate('StoreProfile', { id: store._id })}
          >
            <Ionicons name="storefront" size={18} color={colors.primary} />
            <Text style={styles.storeName}>{store?.storeName || 'Store'}</Text>
            {!!store?.phone && (
              <TouchableOpacity onPress={call} style={styles.callBtn}>
                <Ionicons name="call-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          <Text style={styles.meta}>
            {order.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'} · placed{' '}
            {new Date(order.createdAt).toLocaleString()}
          </Text>
        </View>

        <View style={styles.card}>
          <OrderStatusStepper status={order.status} fulfilment={order.fulfilment} />
        </View>

        {order.fulfilment === 'delivery' && order.deliveryAddress && (
          <View style={styles.card}>
            <Text style={styles.section}>Delivering to</Text>
            <Text style={styles.addr}>{order.deliveryAddress.line || order.deliveryAddress.label}</Text>
            <Text style={styles.addr}>{order.contactPhone}</Text>
          </View>
        )}
        {order.fulfilment === 'pickup' && (
          <View style={styles.card}>
            <Text style={styles.section}>Pickup contact</Text>
            <Text style={styles.addr}>{order.contactPhone}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.section}>Items</Text>
          {order.items.map((it, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={2}>
                {it.qty} × {it.name}
              </Text>
              <Text style={styles.itemTotal}>RM{it.lineTotal.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <Row label="Subtotal" value={`RM${order.subtotal.toFixed(2)}`} />
          <Row
            label={order.fulfilment === 'delivery' ? 'Delivery fee' : 'Delivery'}
            value={order.fulfilment === 'delivery' ? `RM${order.deliveryFee.toFixed(2)}` : 'Not applicable'}
          />
          <Row label="Total" value={`RM${order.total.toFixed(2)}`} bold />
          <Text style={styles.payMethod}>
            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pay at Pickup'}
          </Text>
        </View>

        {!!order.notes && (
          <View style={styles.card}>
            <Text style={styles.section}>Notes</Text>
            <Text style={styles.addr}>{order.notes}</Text>
          </View>
        )}

        {order.status === 'cancelled' && order.cancelledBy && (
          <Text style={styles.cancelNote}>
            Cancelled by {order.cancelledBy === 'buyer' ? 'you' : 'the trader'}
          </Text>
        )}

        {canCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={cancel} disabled={cancelling}>
            {cancelling ? (
              <ActivityIndicator color={colors.discount} />
            ) : (
              <Text style={styles.cancelText}>Cancel Order</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowLabelBold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl },
  headCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  storeName: { flex: 1, fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  callBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  section: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  addr: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemName: { flex: 1, fontSize: fontSize.sm, color: colors.text, marginRight: spacing.sm },
  itemTotal: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  rowLabelBold: { fontWeight: '800', color: colors.text, fontSize: fontSize.md },
  rowValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  rowValueBold: { fontWeight: '800', color: colors.primary, fontSize: fontSize.lg },
  payMethod: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
  cancelNote: { textAlign: 'center', color: colors.discount, fontWeight: '600', marginBottom: spacing.md },
  cancelBtn: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.discount,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  cancelText: { color: colors.discount, fontWeight: '800' },
});
