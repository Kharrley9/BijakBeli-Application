import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import { useLocation } from '../context/LocationContext';
import { priceService } from '../services/dataService';
import AppHeader from '../components/AppHeader';
import DistanceBadge from '../components/DistanceBadge';
import OriginToggle from '../components/OriginToggle';
import EmptyState from '../components/EmptyState';
import RadiusChips, { OutsideRadiusNotice, useRadiusKm } from '../components/RadiusChips';
import { prettyName } from '../utils/format';

const MAX_CARDS = 30;

export default function PriceComparisonScreen({ route, navigation }: any) {
  const { productId, productName, unit, sort, linkedBarcode } = route.params || {};
  // Coming from the QR scanner the buyer wants "where is it cheapest", so price first.
  const [sortBy, setSortBy] = useState<'price' | 'distance'>(sort === 'price' ? 'price' : 'distance');
  const { origin, originParams } = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const radiusKm = useRadiusKm();

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
  }, [productId, origin?.lat, origin?.lng, radiusKm]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const comparisons: any[] = data?.comparisons || [];
  const cheapest = data?.cheapestStore;
  const nearest = data?.nearestStore;
  const bestValue = comparisons.find((c) => c.isBestValue && c.totalCost != null);
  const title = productName || data?.product?.productName;

  // The answer first: cheapest, best value once petrol is counted, nearest.
  const summaries: SummaryProps[] = [];
  if (cheapest) {
    summaries.push({
      icon: 'pricetag',
      tone: 'green',
      label: 'Cheapest',
      store: cheapest.mallName || cheapest.storeName,
      value: `RM${Number(data.lowestPrice).toFixed(2)}`,
      note: cheapest.distanceKm != null ? `${cheapest.distanceKm} km away` : undefined,
    });
  }
  if (bestValue) {
    summaries.push({
      icon: 'car-sport',
      tone: 'amber',
      label: 'Best value incl. petrol',
      store: bestValue.store.mallName || bestValue.store.storeName,
      value: `RM${bestValue.totalCost.toFixed(2)}`,
      note: data?.fuel ? `by ${data.fuel.vehicle}, round trip` : undefined,
    });
  }
  if (nearest && (!cheapest || nearest._id !== cheapest._id)) {
    summaries.push({
      icon: 'navigate',
      tone: 'blue',
      label: 'Nearest',
      store: nearest.mallName || nearest.storeName,
      value: nearest.distanceKm != null ? `${nearest.distanceKm} km` : '',
      note: 'shorter trip',
    });
  }

  return (
    <View style={styles.safe}>
      <AppHeader title="Compare Prices" />
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {!!title && (
            <View style={styles.productBox}>
              <View style={styles.productIcon}>
                <Ionicons name="basket" size={20} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName} numberOfLines={3}>{prettyName(title)}</Text>
                {!!unit && <Text style={styles.productUnit}>per {unit}</Text>}
                {!!linkedBarcode && (
                  <TouchableOpacity
                    style={styles.wrongItem}
                    // replace, not navigate: after re-linking, back should not return to the wrong item
                    onPress={() =>
                      navigation.replace('LinkBarcode', { ...linkedBarcode, currentProductId: productId })
                    }
                  >
                    <Ionicons name="swap-horizontal" size={14} color={colors.white} />
                    <Text style={styles.wrongItemText}>Wrong item? Change it</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── The answer first ── */}
          {summaries.length > 0 && (
            <View style={styles.summary}>
              {summaries.map((s, i) => (
                <Summary key={s.label} {...s} first={i === 0} />
              ))}
            </View>
          )}

          <View style={styles.card}>
            <OriginToggle />
            {!!origin && <RadiusChips />}
          </View>

          <View style={styles.listHead}>
            <Text style={styles.listTitle}>
              {comparisons.length
                ? `${Math.min(comparisons.length, MAX_CARDS)} ${comparisons.length === 1 ? 'store' : 'stores'}`
                : 'Stores'}
            </Text>
            {!!origin && comparisons.length > 1 && (
              <View style={styles.sortRow}>
                <SortChip label="Cheapest" icon="pricetag-outline" active={sortBy === 'price'} onPress={() => setSortBy('price')} />
                <SortChip label="Nearest" icon="navigate-outline" active={sortBy === 'distance'} onPress={() => setSortBy('distance')} />
              </View>
            )}
          </View>

          {comparisons.length === 0 ? (
            data?.priceScope === 'nearby' ? (
              <OutsideRadiusNotice radiusKm={data.nearbyRadiusKm ?? radiusKm} nearestBeyond={data.nearestBeyond} />
            ) : (
              <EmptyState icon="pricetags-outline" title="No price data" body="No store has reported a price for this item yet." />
            )
          ) : (
            comparisons
              .slice()
              .sort((a, b) =>
                // Without a location there is no distance to sort by.
                sortBy === 'price' || !origin
                  ? a.effectivePrice - b.effectivePrice || (a.store.distanceKm ?? 1e9) - (b.store.distanceKm ?? 1e9)
                  : (a.store.distanceKm ?? 1e9) - (b.store.distanceKm ?? 1e9)
              )
              // ~250 stores nationwide: the nearest 30 are the useful ones
              .slice(0, MAX_CARDS)
              .map((c, i) => (
                <TouchableOpacity
                  key={c.store._id}
                  style={[styles.storeCard, c.isLowestPrice && styles.storeCardBest]}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('StoreProfile', { id: c.store._id })}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.rank, c.isLowestPrice && styles.rankBest]}>
                      <Text style={[styles.rankText, c.isLowestPrice && { color: colors.white }]}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.store} numberOfLines={1}>{c.store.storeName}</Text>
                      <Text style={styles.city} numberOfLines={1}>
                        {[c.store.mallName, c.store.city || c.store.state].filter(Boolean).join(' · ')}
                      </Text>
                      <View style={styles.tagRow}>
                        {c.store.distanceKm != null && (
                          <DistanceBadge
                            distanceKm={c.store.distanceKm}
                            durationMin={c.store.durationMin}
                            highlight={c.isNearest}
                          />
                        )}
                        {c.isLowestPrice && <Tag text="Cheapest" icon="pricetag" />}
                        {c.isNearest && <Tag text="Nearest" icon="navigate" color={colors.info} bg={colors.infoLight} />}
                        {c.isBestValue && <Tag text="Best value" icon="star" color={colors.accentDark} bg={colors.accentLight} />}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      {c.hasPromotion && (
                        <Text style={styles.was}>RM{c.currentPrice.toFixed(2)}</Text>
                      )}
                      <Text style={[styles.price, c.isLowestPrice && { color: colors.primary }]}>
                        RM{c.effectivePrice.toFixed(2)}
                      </Text>
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
                    <Meta
                      icon={c.inStock ? 'checkmark-circle-outline' : 'close-circle-outline'}
                      label={c.inStock ? 'In stock' : 'Out of stock'}
                      color={c.inStock ? colors.primary : colors.discount}
                    />
                  </View>
                </TouchableOpacity>
              ))
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

const TONES = {
  green: { fg: colors.primary, bg: colors.primaryLight },
  amber: { fg: colors.accentDark, bg: colors.accentLight },
  blue: { fg: colors.info, bg: colors.infoLight },
};

interface SummaryProps {
  icon: any;
  tone: keyof typeof TONES;
  label: string;
  store: string;
  value: string;
  note?: string;
}

function Summary({ icon, tone, label, store, value, note, first }: SummaryProps & { first?: boolean }) {
  const t = TONES[tone];
  return (
    <View style={[styles.summaryRow, first && { borderTopWidth: 0 }]}>
      <View style={[styles.summaryIcon, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={18} color={t.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.summaryLabel, { color: t.fg }]}>{label}</Text>
        <Text style={styles.summaryStore} numberOfLines={1}>{store}</Text>
        {!!note && <Text style={styles.summaryNote}>{note}</Text>}
      </View>
      {!!value && <Text style={styles.summaryValue}>{value}</Text>}
    </View>
  );
}

function Tag({
  text,
  icon,
  color = colors.primary,
  bg = colors.primaryLight,
}: {
  text: string;
  icon?: any;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      {!!icon && <Ionicons name={icon} size={9} color={color} />}
      <Text style={[styles.tagText, { color }]}>{text}</Text>
    </View>
  );
}
function SortChip({ label, icon, active, onPress }: { label: string; icon: any; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.sortChip, active && styles.sortChipOn]} onPress={onPress}>
      <Ionicons name={icon} size={13} color={active ? colors.white : colors.textSecondary} />
      <Text style={[styles.sortText, active && styles.sortTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}
function Meta({ icon, label, color = colors.textMuted }: { icon: any; label: string; color?: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  productBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  productIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { fontSize: fontSize.md + 1, fontWeight: '800', color: colors.white, lineHeight: 21 },
  productUnit: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  wrongItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm, alignSelf: 'flex-start' },
  wrongItemText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.white, textDecorationLine: 'underline' },

  summary: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    // a divider between rows (the first row drops it)
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  summaryIcon: { width: 38, height: 38, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 },
  summaryStore: { fontSize: fontSize.sm + 1, fontWeight: '800', color: colors.text, marginTop: 1 },
  summaryNote: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  summaryValue: { fontSize: fontSize.lg, fontWeight: '900', color: colors.text },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    marginTop: spacing.md,
    ...shadow.sm,
  },

  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  listTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  sortRow: { flexDirection: 'row', gap: 6 },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  sortChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textSecondary },
  sortTextOn: { color: colors.white },

  storeCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadow.sm,
  },
  storeCardBest: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  rank: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  rankBest: { backgroundColor: colors.primary },
  rankText: { fontSize: fontSize.xs, fontWeight: '900', color: colors.textSecondary },
  store: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  city: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 6 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: { fontSize: 10, fontWeight: '800' },
  was: { fontSize: fontSize.xs, color: colors.textMuted, textDecorationLine: 'line-through' },
  price: { fontSize: fontSize.lg, fontWeight: '900', color: colors.text },
  fuel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  total: { fontSize: fontSize.sm, fontWeight: '800', color: colors.primaryDark },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  source: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
});
