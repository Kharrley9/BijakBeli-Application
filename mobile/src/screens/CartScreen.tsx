import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import { useCart } from '../context/CartContext';

export default function CartScreen({ navigation }: any) {
  const { groups, count, setQty, removeItem, clearStore } = useCart();

  if (count === 0) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Cart" />
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          body="Add products from a trader's store to order them."
        />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <AppHeader title={`Cart (${count})`} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {groups.map((g) => (
          <View key={g.storeId} style={styles.storeCard}>
            <View style={styles.storeHead}>
              <Ionicons name="storefront" size={16} color={colors.primary} />
              <Text style={styles.storeName} numberOfLines={1}>{g.storeName}</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Remove items', `Remove all items from ${g.storeName}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => clearStore(g.storeId) },
                  ])
                }
              >
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {g.lines.map((l) => (
              <View key={l.productId} style={styles.line}>
                <View style={styles.thumb}>
                  {l.image ? (
                    <Image source={{ uri: l.image }} style={{ width: 44, height: 44 }} />
                  ) : (
                    <Ionicons name="cube-outline" size={18} color={colors.textMuted} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineName} numberOfLines={2}>{l.name}</Text>
                  <Text style={styles.linePrice}>RM{l.unitPrice.toFixed(2)}{l.unit ? ` / ${l.unit}` : ''}</Text>
                </View>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setQty(l.productId, l.qty - 1)}
                  >
                    <Ionicons name="remove" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qty}>{l.qty}</Text>
                  <TouchableOpacity
                    style={[styles.stepBtn, l.stock != null && l.qty >= l.stock && { opacity: 0.4 }]}
                    disabled={l.stock != null && l.qty >= l.stock}
                    onPress={() => setQty(l.productId, l.qty + 1)}
                  >
                    <Ionicons name="add" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeItem(l.productId)} hitSlop={8} style={{ marginLeft: spacing.sm }}>
                  <Ionicons name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.storeFooter}>
              <View>
                <Text style={styles.subLabel}>Subtotal</Text>
                <Text style={styles.subValue}>RM{g.subtotal.toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                style={[commonStyles.primaryButton, styles.checkoutBtn]}
                onPress={() => navigation.navigate('Checkout', { storeId: g.storeId })}
              >
                <Text style={commonStyles.primaryButtonText}>Checkout</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <Text style={styles.note}>Each trader's items checkout as a separate order.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  storeCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  storeHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  storeName: { flex: 1, fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lineName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  linePrice: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { minWidth: 20, textAlign: 'center', fontWeight: '700', color: colors.text },
  storeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  subValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primary },
  checkoutBtn: { paddingHorizontal: spacing.xl, minHeight: 40 },
  note: { textAlign: 'center', color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.sm },
});
