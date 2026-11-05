import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { useLocation } from '../context/LocationContext';
import { priceService } from '../services/dataService';
import AppHeader from '../components/AppHeader';
import DistanceBadge from '../components/DistanceBadge';
import OriginToggle from '../components/OriginToggle';

const MAX_CARDS = 30;

export default function PriceComparisonScreen({ route }: any) {
  const { productId } = route.params || {};
  const { origin, originParams } = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await priceService.compare(productId, undefined, originParams());
      setData(res?.data || res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [productId, origin?.lat, origin?.lng]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const comparisons: any[] = data?.comparisons || [];
  const cheapest = data?.cheapestStore;
  const nearest = data?.nearestStore;
  const bestValue = comparisons.find((c) => c.isBestValue && c.totalCost != null);

  return (
    <View style={styles.safe}>
      <AppHeader title="Price Comparison" />
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <OriginToggle />

          {comparisons.length === 0 ? (
            <Text style={styles.empty}>No price data for this product.</Text>
          ) : (
            comparisons
              .slice()
              .sort((a, b) => (a.store.distanceKm ?? 1e9) - (b.store.distanceKm ?? 1e9))
              // ~250 stores nationwide: the nearest 30 are the useful ones
              .slice(0, MAX_CARDS)
              .map((c) => (
                <View
                  key={c.store._id}
                  style={[styles.card, c.isLowestPrice && styles.cardBest]}
                >
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.store} numberOfLines={1}>{c.store.storeName}</Text>
                        {c.isLowestPrice && <Tag text="CHEAPEST" />}
                        {c.isNearest && <Tag text="NEAREST" color={colors.primaryDark} />}
                        {c.isBestValue && <Tag text="BEST VALUE" color={colors.accent} />}
                      </View>
                      <Text style={styles.city} numberOfLines={1}>
                        {[c.store.mallName, c.store.city || c.store.state].filter(Boolean).join(' · ')}
                      </Text>
                      {c.store.distanceKm != null && (
                        <DistanceBadge
                          distanceKm={c.store.distanceKm}
                          durationMin={c.store.durationMin}
                          highlight={c.isNearest}
                          style={{ marginTop: 4 }}
                        />
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      {c.hasPromotion && (
                        <Text style={styles.was}>RM{c.currentPrice.toFixed(2)}</Text>
                      )}
                      <Text style={styles.price}>RM{c.effectivePrice.toFixed(2)}</Text>
                      {c.travelCost != null && (
                        <Text style={styles.fuel}>+RM{c.travelCost.toFixed(2)} petrol</Text>
                      )}
                      {c.totalCost != null && (
                        <Text style={styles.total}>= RM{c.totalCost.toFixed(2)}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Meta icon="storefront-outline" label="In-store only" />
                    <Meta icon="cube-outline" label={c.inStock ? 'In stock' : 'Out of stock'} />
                  </View>
                </View>
              ))
          )}

          {bestValue && (
            <View style={[styles.banner, styles.bannerValue]}>
              <Ionicons name="car" size={16} color={colors.text} />
              <Text style={[styles.bannerText, { color: colors.text }]}>
                Best value incl. petrol: {bestValue.store.mallName || bestValue.store.storeName} — RM
                {bestValue.totalCost.toFixed(2)}
                {data?.fuel ? `  ·  by ${data.fuel.vehicle}, round trip` : ''}
              </Text>
            </View>
          )}
          {cheapest && (
            <View style={styles.banner}>
              <Ionicons name="pricetag" size={16} color={colors.white} />
              <Text style={styles.bannerText}>
                Cheapest: {cheapest.mallName || cheapest.storeName} — RM{Number(data.lowestPrice).toFixed(2)}
                {cheapest.distanceKm != null ? `  ·  ${cheapest.distanceKm} km` : ''}
              </Text>
            </View>
          )}
          {nearest && (!cheapest || nearest._id !== cheapest._id) && (
            <View style={[styles.banner, styles.bannerNear]}>
              <Ionicons name="location" size={16} color={colors.white} />
              <Text style={styles.bannerText}>
                Nearest: {nearest.mallName || nearest.storeName}
                {nearest.distanceKm != null ? `  ·  ${nearest.distanceKm} km` : ''} — shorter trip
              </Text>
            </View>
          )}
          {comparisons.length > 0 && (
            <Text style={styles.source}>
              Prices: PriceCatcher, KPDN (data.gov.my). Petrol is an estimate.
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Tag({ text, color = colors.primary }: { text: string; color?: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: color }]}>
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}
function Meta({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardBest: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  store: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  city: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  was: { fontSize: fontSize.xs, color: colors.textMuted, textDecorationLine: 'line-through' },
  price: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: fontSize.xs, color: colors.textSecondary },
  tag: { borderRadius: radius.sm, paddingHorizontal: 5, paddingVertical: 1 },
  tagText: { fontSize: 8, fontWeight: '800', color: colors.white },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  bannerNear: { backgroundColor: colors.primaryDark },
  bannerValue: { backgroundColor: colors.accent },
  source: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  fuel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  total: { fontSize: fontSize.sm, fontWeight: '800', color: colors.primaryDark },
  bannerText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm, flex: 1 },
});
