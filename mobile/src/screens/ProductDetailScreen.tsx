import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import { useLocation } from '../context/LocationContext';
import { useCart } from '../context/CartContext';
import { productService, priceAlertService } from '../services/dataService';
import { ProductDetail } from '../types';
import AppHeader from '../components/AppHeader';
import DistanceBadge from '../components/DistanceBadge';
import RatingStars from '../components/RatingStars';
import OriginToggle from '../components/OriginToggle';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { id } = route.params || {};
  const { origin, originParams } = useLocation();
  const { addItem, count } = useCart();
  const [data, setData] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [alertBusy, setAlertBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await productService.getDetail(id, originParams());
      setData(res?.data || res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id, origin?.lat, origin?.lng]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Product" />
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      </View>
    );
  }
  if (!data) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Product" />
        <Text style={styles.empty}>Product not found.</Text>
      </View>
    );
  }

  const { product, stores } = data;
  const brand = (product as any).brandId?.brandName;
  const rows = [...stores].sort(
    (a, b) => (a.store.distanceKm ?? 1e9) - (b.store.distanceKm ?? 1e9)
  ).slice(0, 8);
  const orderableRow = rows.find((r) => r.store.orderable && (r.inStock ?? true));

  const addToCart = () => {
    if (!orderableRow) return;
    addItem({
      productId: id,
      storeId: orderableRow.store._id,
      storeName: orderableRow.store.storeName,
      storeKind: orderableRow.store.kind,
      name: product.productName,
      unit: product.unit,
      unitPrice: orderableRow.effectivePrice,
      image: product.image,
      stock: orderableRow.stock,
      deliveryAvailable: orderableRow.store.deliveryAvailable,
      deliveryFee: orderableRow.store.deliveryFee,
      pickupAvailable: orderableRow.store.pickupAvailable,
    });
    navigation.navigate('Cart');
  };

  const openAlert = () => {
    setTargetPrice(data.lowestPrice != null ? data.lowestPrice.toFixed(2) : '');
    setAlertOpen(true);
  };
  const saveAlert = async () => {
    const t = Number(targetPrice);
    if (!Number.isFinite(t) || t <= 0) {
      Alert.alert('Invalid price', 'Enter a valid target price.');
      return;
    }
    setAlertBusy(true);
    try {
      await priceAlertService.setAlert(id, t);
      setAlertOpen(false);
      Alert.alert('Alert set', `We'll notify you when the price drops to RM${t.toFixed(2)} or lower.`);
    } catch (e: any) {
      Alert.alert('Could not set alert', e?.message || 'Please try again.');
    } finally {
      setAlertBusy(false);
    }
  };

  return (
    <View style={styles.safe}>
      <AppHeader
        title={product.productName}
        rightIcon="cart-outline"
        onRightPress={() => navigation.navigate('Cart')}
        right={
          count > 0 ? (
            <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartBtn}>
              <Ionicons name="cart-outline" size={20} color={colors.text} />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{count}</Text>
              </View>
            </TouchableOpacity>
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.heroImg} />
          ) : (
            <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
          )}
        </View>
        <Text style={styles.name}>{product.productName}</Text>
        <Text style={styles.sub}>{[brand, product.unit].filter(Boolean).join(' · ')}</Text>

        <View style={styles.priceBox}>
          <View>
            <Text style={styles.priceLabel}>Lowest price</Text>
            <Text style={styles.priceBig}>
              RM{data.lowestPrice != null ? data.lowestPrice.toFixed(2) : '—'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.priceLabel}>Sold at</Text>
            <Text style={styles.priceStores}>{data.storeCount} stores</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.alertRow} onPress={openAlert}>
          <Ionicons name="notifications-outline" size={16} color={colors.primary} />
          <Text style={styles.alertRowText}>Notify me when the price drops</Text>
        </TouchableOpacity>

        <OriginToggle />

        <Text style={styles.section}>Prices at Nearby Stores</Text>
        <View style={styles.table}>
          <View style={[styles.tr, styles.trHead]}>
            <Text style={[styles.th, { flex: 2 }]}>Store</Text>
            <Text style={[styles.th, styles.cellRight]}>Price</Text>
            <Text style={[styles.th, styles.cellRight]}>Delivery</Text>
          </View>
          {rows.map((r) => (
            <TouchableOpacity
              key={r.store._id}
              style={[styles.tr, r.isLowestPrice && styles.trBest]}
              onPress={() => navigation.navigate('StoreProfile', { id: r.store._id })}
            >
              <View style={{ flex: 2 }}>
                <View style={styles.storeNameRow}>
                  <Text style={styles.storeName} numberOfLines={1}>{r.store.storeName}</Text>
                  {r.isLowestPrice && <Badge text="BEST" />}
                  {r.isNearest && <Badge text="NEAR" color={colors.accent} />}
                </View>
                {r.store.distanceKm != null && (
                  <DistanceBadge distanceKm={r.store.distanceKm} durationMin={r.store.durationMin} compact style={{ marginTop: 3 }} />
                )}
                {!!r.store.rating && (
                  <View style={{ marginTop: 3 }}>
                    <RatingStars rating={r.store.rating} count={r.store.reviewCount} size={11} />
                  </View>
                )}
              </View>
              <View style={styles.cellRight}>
                {r.hasPromotion && (
                  <Text style={styles.was}>RM{r.price.toFixed(2)}</Text>
                )}
                <Text style={styles.price}>RM{r.effectivePrice.toFixed(2)}</Text>
                {r.stock != null && <Text style={styles.stock}>{r.stock} left</Text>}
              </View>
              <View style={styles.cellRight}>
                <Text style={styles.delivery}>
                  {r.store.orderable
                    ? r.store.deliveryAvailable
                      ? `RM${(r.store.deliveryFee || 0).toFixed(0)}`
                      : 'Pickup'
                    : '—'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.outlineBtn]}
          onPress={() => navigation.navigate('PriceComparison', { productId: id })}
        >
          <Ionicons name="swap-vertical-outline" size={18} color={colors.primary} />
          <Text style={styles.outlineText}>Compare Prices</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[commonStyles.primaryButton, styles.actionBtn, !orderableRow && { opacity: 0.5 }]}
          disabled={!orderableRow}
          onPress={addToCart}
        >
          <Ionicons name="cart-outline" size={18} color={colors.white} />
          <Text style={commonStyles.primaryButtonText}>
            {orderableRow ? 'Add to Cart' : 'Not orderable'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={alertOpen} transparent animationType="fade" onRequestClose={() => setAlertOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Notify me when price drops</Text>
            <Text style={styles.modalLabel}>Target price (RM)</Text>
            <TextInput
              style={styles.modalInput}
              value={targetPrice}
              onChangeText={setTargetPrice}
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setAlertOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[commonStyles.primaryButton, { flex: 1 }, alertBusy && { opacity: 0.7 }]}
                onPress={saveAlert}
                disabled={alertBusy}
              >
                {alertBusy ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={commonStyles.primaryButtonText}>Set Alert</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Badge({ text, color = colors.primary }: { text: string; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl },
  hero: {
    width: '100%',
    height: 150,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  heroImg: { width: '100%', height: '100%' },
  name: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md },
  priceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  priceLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  priceBig: { fontSize: fontSize.xl, fontWeight: '800', color: colors.primary },
  priceStores: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  section: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' },
  tr: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  trHead: { backgroundColor: colors.surface },
  trBest: { backgroundColor: colors.primaryLight },
  th: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary },
  cellRight: { flex: 1, alignItems: 'flex-end' },
  storeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  storeName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, flexShrink: 1 },
  was: { fontSize: fontSize.xs, color: colors.textMuted, textDecorationLine: 'line-through' },
  price: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  stock: { fontSize: 10, color: colors.textMuted },
  delivery: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  badge: { borderRadius: radius.sm, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { fontSize: 8, fontWeight: '800', color: colors.white },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 46,
  },
  outlineBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md },
  outlineText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.md },
  cartBtn: { padding: 2 },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.discount,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: colors.white, fontSize: 9, fontWeight: '800' },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  alertRowText: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.xl },
  modalSheet: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  modalTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  modalLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 4 },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  modalCancel: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  modalCancelText: { color: colors.textSecondary, fontWeight: '700' },
});
