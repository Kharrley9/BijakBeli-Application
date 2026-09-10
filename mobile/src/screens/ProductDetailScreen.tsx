import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import { useLocation } from '../context/LocationContext';
import { productService } from '../services/dataService';
import { ProductDetail } from '../types';
import AppHeader from '../components/AppHeader';
import DistanceBadge from '../components/DistanceBadge';
import RatingStars from '../components/RatingStars';
import OriginToggle from '../components/OriginToggle';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { id } = route.params || {};
  const { origin, originParams } = useLocation();
  const [data, setData] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <View style={styles.safe}>
      <AppHeader title={product.productName} />
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
          onPress={() =>
            orderableRow &&
            navigation.navigate('StoreProfile', { id: orderableRow.store._id })
          }
        >
          <Ionicons name="cart-outline" size={18} color={colors.white} />
          <Text style={commonStyles.primaryButtonText}>
            {orderableRow ? 'Order from Trader' : 'Not orderable'}
          </Text>
        </TouchableOpacity>
      </View>
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
});
