import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import { FormField } from '../components/FormField';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/dataService';
import { Fulfilment } from '../types';

export default function CheckoutScreen({ route, navigation }: any) {
  const { storeId } = route.params || {};
  const { groupFor, clearStore } = useCart();
  const { user } = useAuth();
  const group = groupFor(storeId);

  const [fulfilment, setFulfilment] = useState<Fulfilment>(
    group?.pickupAvailable !== false ? 'pickup' : 'delivery'
  );
  const [address, setAddress] = useState(user?.businessLocation?.label || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  if (!group) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Checkout" />
        <Text style={styles.empty}>This store's cart is empty.</Text>
      </View>
    );
  }

  const deliveryFee = fulfilment === 'delivery' ? group.deliveryFee : 0;
  const total = group.subtotal + deliveryFee;

  const place = async () => {
    if (!phone.trim()) return Alert.alert('Missing info', 'Enter a contact phone number.');
    if (fulfilment === 'delivery' && !address.trim()) {
      return Alert.alert('Missing info', 'Enter a delivery address.');
    }
    setBusy(true);
    try {
      const res: any = await orderService.place([
        {
          storeId: group.storeId,
          fulfilment,
          items: group.lines.map((l) => ({ productId: l.productId, qty: l.qty })),
          deliveryAddress: fulfilment === 'delivery' ? { label: address.trim() } : undefined,
          contactPhone: phone.trim(),
          notes: notes.trim() || undefined,
        },
      ]);
      const order = res.data?.[0];
      clearStore(group.storeId);
      navigation.replace('OrderTracking', { id: order._id });
    } catch (e: any) {
      Alert.alert('Could not place order', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.safe}>
      <AppHeader title="Checkout" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.storeName}>{group.storeName}</Text>

          <View style={styles.tabs}>
            {group.pickupAvailable && (
              <TouchableOpacity
                style={[styles.tab, fulfilment === 'pickup' && styles.tabActive]}
                onPress={() => setFulfilment('pickup')}
              >
                <Ionicons name="walk-outline" size={16} color={fulfilment === 'pickup' ? colors.white : colors.textSecondary} />
                <Text style={[styles.tabText, fulfilment === 'pickup' && styles.tabTextActive]}>Pickup</Text>
              </TouchableOpacity>
            )}
            {group.deliveryAvailable && (
              <TouchableOpacity
                style={[styles.tab, fulfilment === 'delivery' && styles.tabActive]}
                onPress={() => setFulfilment('delivery')}
              >
                <Ionicons name="bicycle-outline" size={16} color={fulfilment === 'delivery' ? colors.white : colors.textSecondary} />
                <Text style={[styles.tabText, fulfilment === 'delivery' && styles.tabTextActive]}>Delivery</Text>
              </TouchableOpacity>
            )}
          </View>

          {fulfilment === 'delivery' && (
            <FormField
              label="Delivery address"
              value={address}
              onChangeText={setAddress}
              placeholder="Address to deliver to"
              multiline
            />
          )}
          <FormField label="Contact phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="01x-xxx xxxx" />
          <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="e.g. leave at guard house" multiline />

          <View style={styles.payRow}>
            <Ionicons name="cash-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.payText}>
              {fulfilment === 'delivery' ? 'Cash on Delivery' : 'Pay at Pickup'}
            </Text>
          </View>

          <View style={styles.summary}>
            <Row label="Items subtotal" value={`RM${group.subtotal.toFixed(2)}`} />
            <Row label={fulfilment === 'delivery' ? 'Delivery fee' : 'Delivery'} value={fulfilment === 'delivery' ? `RM${deliveryFee.toFixed(2)}` : 'Not applicable'} />
            <View style={styles.divider} />
            <Row label="Total to pay" value={`RM${total.toFixed(2)}`} bold />
          </View>

          <TouchableOpacity
            style={[commonStyles.primaryButton, styles.placeBtn, busy && { opacity: 0.7 }]}
            onPress={place}
            disabled={busy}
          >
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={commonStyles.primaryButtonText}>Place Order</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl },
  storeName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  payText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  rowLabelBold: { fontWeight: '800', color: colors.text, fontSize: fontSize.md },
  rowValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  rowValueBold: { fontWeight: '800', color: colors.primary, fontSize: fontSize.lg },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  placeBtn: { marginTop: spacing.sm },
});
