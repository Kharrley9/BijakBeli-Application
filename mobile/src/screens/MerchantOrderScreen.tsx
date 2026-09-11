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
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import OrderStatusStepper from '../components/OrderStatusStepper';
import { merchantService, orderService } from '../services/dataService';
import { Order } from '../types';
import { ORDER_FLOW, ORDER_STATUS_LABELS } from '../constants';

export default function MerchantOrderScreen({ route }: any) {
  const { id } = route.params || {};
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      // Merchant order detail is read via the same buyer-facing endpoint —
      // the server authorises store owners too.
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

  const flow = ORDER_FLOW[order.fulfilment] || ORDER_FLOW.pickup;
  const curIdx = flow.indexOf(order.status);
  const nextStatus = curIdx >= 0 && curIdx < flow.length - 1 ? flow[curIdx + 1] : null;
  const closed = order.status === 'completed' || order.status === 'cancelled';
  const buyer = typeof order.userId === 'object' ? order.userId : null;

  const advance = async (status: string) => {
    setBusy(true);
    try {
      await merchantService.updateOrderStatus(order._id, status);
      load();
    } catch (e: any) {
      Alert.alert('Could not update', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = () => {
    Alert.alert('Cancel order', `Cancel order ${order.orderNumber}? Stock will be restored.`, [
      { text: 'No', style: 'cancel' },
      { text: 'Cancel order', style: 'destructive', onPress: () => advance('cancelled') },
    ]);
  };

  const call = () => buyer?.phone && Linking.openURL(`tel:${buyer.phone}`);

  return (
    <View style={styles.safe}>
      <AppHeader title={order.orderNumber} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.buyerRow}>
            <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
            <Text style={styles.buyerName}>{buyer?.fullName || 'Buyer'}</Text>
            {!!(order.contactPhone || buyer?.phone) && (
              <TouchableOpacity onPress={call} style={styles.callBtn}>
                <Ionicons name="call-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.meta}>
            {order.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'} · {order.contactPhone} ·{' '}
            {new Date(order.createdAt).toLocaleString()}
          </Text>
          {order.fulfilment === 'delivery' && order.deliveryAddress && (
            <Text style={styles.addr}>{order.deliveryAddress.line || order.deliveryAddress.label}</Text>
          )}
          {!!order.notes && <Text style={styles.notes}>Note: {order.notes}</Text>}
        </View>

        <View style={styles.card}>
          <OrderStatusStepper status={order.status} fulfilment={order.fulfilment} />
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Items</Text>
          {order.items.map((it, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={2}>{it.qty} × {it.name}</Text>
              <Text style={styles.itemTotal}>RM{it.lineTotal.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <Row label="Subtotal" value={`RM${order.subtotal.toFixed(2)}`} />
          <Row label="Delivery fee" value={`RM${order.deliveryFee.toFixed(2)}`} />
          <Row label="Total" value={`RM${order.total.toFixed(2)}`} bold />
        </View>

        {!closed && (
          <View style={styles.actionRow}>
            {nextStatus && (
              <TouchableOpacity
                style={[commonStyles.primaryButton, styles.actionBtn, busy && { opacity: 0.7 }]}
                onPress={() => advance(nextStatus)}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={commonStyles.primaryButtonText}>
                    Mark as {ORDER_STATUS_LABELS[nextStatus]}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={confirmCancel} disabled={busy}>
              <Text style={styles.cancelText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
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
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  buyerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  buyerName: { flex: 1, fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  callBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4, textTransform: 'capitalize' },
  addr: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm },
  notes: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, fontStyle: 'italic' },
  section: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemName: { flex: 1, fontSize: fontSize.sm, color: colors.text, marginRight: spacing.sm },
  itemTotal: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  rowLabelBold: { fontWeight: '800', color: colors.text, fontSize: fontSize.md },
  rowValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  rowValueBold: { fontWeight: '800', color: colors.primary, fontSize: fontSize.lg },
  actionRow: { gap: spacing.sm },
  actionBtn: {},
  cancelBtn: { alignItems: 'center', borderWidth: 1, borderColor: colors.discount, borderRadius: radius.md, paddingVertical: spacing.md },
  cancelText: { color: colors.discount, fontWeight: '800' },
});
