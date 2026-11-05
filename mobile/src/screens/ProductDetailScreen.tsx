import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { useLocation } from '../context/LocationContext';
import { productService, priceService } from '../services/dataService';
import { ProductDetail } from '../types';
import AppHeader from '../components/AppHeader';
import DistanceBadge from '../components/DistanceBadge';
import OriginToggle from '../components/OriginToggle';
import BrandAvatar from '../components/BrandAvatar';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { id } = route.params || {};
  const { origin, originParams } = useLocation();
  const [data, setData]                 = useState<ProductDetail | null>(null);
  const [loading, setLoading]           = useState(true);
  const [lowestNational, setLowestNational] = useState<any>(null);
  const [priceTrend, setPriceTrend]     = useState<TrendPoint[]>([]);
  const [trendRegion, setTrendRegion]   = useState('Malaysia');
  const [reports, setReports]           = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

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

  // Load supplementary Price Catcher data
  useEffect(() => {
    if (!id) return;
    // Lowest price nationwide
    priceService.getLowest(id).then((res: any) => {
      setLowestNational(res?.data || res);
    }).catch(() => {});
    // Community reports
    setReportsLoading(true);
    priceService.getReports(id, { status: 'verified' }).then((res: any) => {
      setReports((res?.data || res || []).slice(0, 5));
    }).catch(() => {}).finally(() => setReportsLoading(false));
  }, [id]);

  // Price trend (last 30 days) in the buyer's state, i.e. the nearest store's;
  // the server falls back to national figures when the state has too little data.
  const trendState = data?.nearestStore?.state;
  useEffect(() => {
    if (!id) return;
    priceService.getTrend(id, { days: 30, state: trendState }).then((res: any) => {
      const points = Array.isArray(res?.data) ? res.data : [];
      setPriceTrend(points.filter((p: any) => typeof p.price === 'number' && p.min != null));
      setTrendRegion(res?.scope === 'state' && res?.state ? res.state : 'Malaysia');
    }).catch(() => {});
  }, [id, trendState]);

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
  const nearby = data.priceScope === 'nearby' && !!data.nearbyStoreCount;
  const brand = (product as any).brandId?.brandName;
  const rows = [...stores].sort(
    (a, b) => (a.store.distanceKm ?? 1e9) - (b.store.distanceKm ?? 1e9)
  ).slice(0, 8);

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
        <View style={styles.subRow}>
          {brand && <BrandAvatar brandName={brand} size={20} style={{ marginRight: spacing.xs }} />}
          <Text style={styles.sub}>{[brand, product.unit].filter(Boolean).join(' · ')}</Text>
        </View>

        <View style={styles.priceBox}>
          <View>
            <Text style={styles.priceLabel}>
              {nearby ? `Lowest within ${data.nearbyRadiusKm} km` : 'Lowest price'}
            </Text>
            <Text style={styles.priceBig}>
              RM{data.lowestPrice != null ? data.lowestPrice.toFixed(2) : '—'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.priceLabel}>Sold at</Text>
            <Text style={styles.priceStores}>
              {nearby ? `${data.nearbyStoreCount} stores nearby` : `${data.storeCount} stores`}
            </Text>
          </View>
        </View>

        {/* ── Price Catcher: Lowest in Malaysia badge ── */}
        {lowestNational && (
          <View style={styles.nationalBadge}>
            <Ionicons name="trophy-outline" size={14} color="#FFA000" />
            <Text style={styles.nationalText}>
              Lowest in Malaysia: <Text style={styles.nationalPrice}>RM{lowestNational.price?.toFixed(2)}</Text>
              {lowestNational.store?.storeName ? ` at ${lowestNational.store.storeName}` : ''}
              {lowestNational.store?.state ? `, ${lowestNational.store.state}` : ''}
            </Text>
          </View>
        )}

        <OriginToggle />

        <Text style={styles.section}>Prices at Nearby Stores</Text>
        <View style={styles.table}>
          <View style={[styles.tr, styles.trHead]}>
            <Text style={[styles.th, { flex: 2 }]}>Store</Text>
            <Text style={[styles.th, styles.cellRight]}>Price</Text>
            <Text style={[styles.th, styles.cellRight]}>Distance</Text>
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
                  {r.isBestValue && <Badge text="VALUE" color={colors.primaryDark} />}
                </View>
                {!!branchOf(r.store) && (
                  <Text style={styles.branch} numberOfLines={1}>{branchOf(r.store)}</Text>
                )}
              </View>
              <View style={styles.cellRight}>
                {r.hasPromotion && (
                  <Text style={styles.was}>RM{r.price.toFixed(2)}</Text>
                )}
                <Text style={styles.price}>RM{r.effectivePrice.toFixed(2)}</Text>
                {r.travelCost != null && (
                  <Text style={styles.fuel}>+RM{r.travelCost.toFixed(2)} petrol</Text>
                )}
              </View>
              <View style={styles.cellRight}>
                {r.store.distanceKm != null ? (
                  <DistanceBadge distanceKm={r.store.distanceKm} durationMin={r.store.durationMin} compact />
                ) : (
                  <Text style={styles.dash}>—</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <BestValueCard data={data} />

        <PriceTrendSection points={priceTrend} region={trendRegion} />

        <CommunityReportsSection
          reports={reports}
          loading={reportsLoading}
          onAdd={() => navigation.navigate('ReportPrice', {
            productId: id,
            productName: product.productName,
          })}
        />

        <Text style={styles.source}>
          Prices: PriceCatcher, KPDN (data.gov.my)
          {data.dataAsOf ? `, as of ${new Date(data.dataAsOf).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          . Prices may differ in store.
        </Text>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.compareBtn}
          onPress={() => navigation.navigate('PriceComparison', { productId: id })}
        >
          <Ionicons name="swap-vertical-outline" size={18} color={colors.white} />
          <Text style={styles.compareText}>Compare Prices</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reportBtn}
          onPress={() => navigation.navigate('ReportPrice', {
            productId: id,
            productName: data?.product?.productName,
          })}
        >
          <Ionicons name="megaphone-outline" size={18} color={colors.primary} />
          <Text style={styles.reportText}>JOM Kongsi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** "Giant Tampoi" -> "Tampoi"; falls back to the city. */
function branchOf(store: { storeName: string; mallName?: string; city?: string }) {
  const m = store.mallName || '';
  if (m && m.toLowerCase().startsWith(store.storeName.toLowerCase())) {
    const rest = m.slice(store.storeName.length).trim();
    if (rest) return rest;
  }
  return store.city || '';
}

/**
 * "Cheapest once you count petrol" summary. The cheapest shelf price can lose
 * to a nearer store after the round trip, so spell out both when they differ.
 */
function BestValueCard({ data }: { data: ProductDetail }) {
  const best = data.stores.find((s) => s.isBestValue);
  if (!best || best.totalCost == null || best.travelCost == null) return null;

  const cheapest = data.stores.find((s) => s.isLowestPrice);
  // Only when the cheapest shelf price really ends up costing more (it may also
  // be out of stock, which is why it wasn't picked).
  const differs =
    cheapest &&
    cheapest.store._id !== best.store._id &&
    cheapest.totalCost != null &&
    cheapest.totalCost > best.totalCost;
  const fuel = data.fuel;

  return (
    <View style={styles.valueCard}>
      <View style={styles.valueHead}>
        <Ionicons name="car-outline" size={16} color={colors.primaryDark} />
        <Text style={styles.valueTitle}>Best value incl. petrol</Text>
      </View>
      <Text style={styles.valueStore}>
        {best.store.mallName || best.store.storeName} · RM{best.totalCost.toFixed(2)}
      </Text>
      <Text style={styles.valueLine}>
        Item RM{best.effectivePrice.toFixed(2)} + petrol RM{best.travelCost.toFixed(2)}
      </Text>
      {differs && (
        <Text style={styles.valueLine}>
          The cheapest item ({cheapest!.store.mallName || cheapest!.store.storeName}, RM{cheapest!.effectivePrice.toFixed(2)})
          comes to RM{cheapest!.totalCost!.toFixed(2)} after the trip, so you save RM
          {(cheapest!.totalCost! - best.totalCost).toFixed(2)} here.
        </Text>
      )}
      {fuel && (
        <Text style={styles.valueNote}>
          Round trip by {fuel.vehicle}, {fuel.litresPer100Km} L/100 km, RON95 RM
          {fuel.fuelPriceRm.toFixed(2)}/L. Change vehicle in Settings.
        </Text>
      )}
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

interface TrendPoint {
  date: string; // 'YYYY-MM-DD'
  price: number; // median across stores that day
  min: number;
  max: number;
  count: number;
}

const shortDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });

/**
 * Daily median price (real PriceCatcher observations) as a bar chart, with the
 * change over the period. Bars are scaled between the period's min and max so
 * small movements are still visible; the RM range is printed beside it.
 */
function PriceTrendSection({ points, region }: { points: TrendPoint[]; region: string }) {
  if (points.length < 2) return null;
  const medians = points.map((p) => p.price);
  const lo = Math.min(...medians);
  const hi = Math.max(...medians);
  const range = hi - lo || 1;
  const first = points[0].price;
  const last = points[points.length - 1].price;
  const changePct = first ? ((last - first) / first) * 100 : 0;
  const steady = Math.abs(changePct) < 0.5;
  const up = changePct > 0;

  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text style={styles.section}>Price Trend · {region}</Text>
      <View style={styles.trendSummary}>
        <Text style={styles.trendNow}>RM{last.toFixed(2)}</Text>
        <Text
          style={[
            styles.trendChange,
            { color: steady ? colors.textSecondary : up ? colors.discount : colors.primary },
          ]}
        >
          {steady ? 'Steady' : `${up ? '▲' : '▼'} ${Math.abs(changePct).toFixed(1)}%`} since{' '}
          {shortDate(points[0].date)}
        </Text>
      </View>
      <View style={styles.trendChart}>
        {points.map((p) => (
          <View key={p.date} style={styles.trendBarWrap}>
            <View
              style={[
                styles.trendBar,
                { height: 8 + ((p.price - lo) / range) * 52 },
                p === points[points.length - 1] && styles.trendBarLast,
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.trendAxis}>
        <Text style={styles.trendAxisText}>{shortDate(points[0].date)}</Text>
        <Text style={styles.trendAxisText}>
          median RM{lo.toFixed(2)} – RM{hi.toFixed(2)}
        </Text>
        <Text style={styles.trendAxisText}>{shortDate(points[points.length - 1].date)}</Text>
      </View>
    </View>
  );
}

function CommunityReportsSection({
  reports,
  loading,
  onAdd,
}: {
  reports: any[];
  loading: boolean;
  onAdd: () => void;
}) {
    return (
      <View style={{ marginTop: spacing.lg }}>
        <View style={styles.sectionRow}>
          <Text style={styles.section}>Community Reports</Text>
          <TouchableOpacity onPress={onAdd}>
            <Text style={styles.sectionAction}>+ Add Report</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : reports.length === 0 ? (
          <Text style={styles.noReports}>No verified reports yet. Be the first to share a price!</Text>
        ) : (
          reports.map((r: any) => (
            <View key={r._id} style={styles.reportRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportStore}>{r.storeId?.storeName || 'Unknown store'}</Text>
                <Text style={styles.reportMeta}>
                  {r.storeId?.city} · {new Date(r.createdAt).toLocaleDateString()}
                  {r.isPromo ? ' · 🏷️ Promo' : ''}
                </Text>
                {r.promoDescription ? <Text style={styles.reportPromo}>{r.promoDescription}</Text> : null}
              </View>
              <Text style={styles.reportPrice}>RM{r.price?.toFixed(2)}</Text>
              <View style={styles.reportActions}>
                <TouchableOpacity onPress={() => priceService.confirmReport(r._id).catch(() => {})}>
                  <Ionicons name="thumbs-up-outline" size={16} color={colors.primary} />
                  <Text style={styles.voteCount}>{r.confirmations || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => priceService.disputeReport(r._id).catch(() => {})} style={{ marginLeft: 8 }}>
                  <Ionicons name="thumbs-down-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: spacing.md,
  },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary },
  priceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  priceLabel:  { fontSize: fontSize.xs, color: colors.textSecondary },
  priceBig:    { fontSize: fontSize.xl, fontWeight: '800', color: colors.primary },
  priceStores: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },

  // Price Catcher additions
  nationalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFF8E1',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  nationalText:  { flex: 1, fontSize: fontSize.xs, color: '#795548' },
  nationalPrice: { fontWeight: '800', color: '#E65100' },

  trendSummary: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.xs },
  trendNow:     { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  trendChange:  { fontSize: fontSize.xs, fontWeight: '700' },
  trendChart:   { flexDirection: 'row', alignItems: 'flex-end', gap: 2, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, height: 76 },
  trendBarWrap: { alignItems: 'center', justifyContent: 'flex-end', flex: 1, height: '100%' },
  trendBar:     { width: '80%', backgroundColor: colors.primaryLight, borderRadius: 2, borderWidth: 1, borderColor: colors.primary },
  trendBarLast: { backgroundColor: colors.primary },
  trendAxis:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  trendAxisText:{ fontSize: 10, color: colors.textMuted },

  sectionRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.sm },
  sectionAction: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
  noReports:     { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },

  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.white,
  },
  reportStore:   { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  reportMeta:    { fontSize: fontSize.xs, color: colors.textSecondary },
  reportPromo:   { fontSize: fontSize.xs, color: colors.primary, marginTop: 2 },
  reportPrice:   { fontSize: fontSize.md, fontWeight: '800', color: colors.primary, marginHorizontal: spacing.sm },
  reportActions: { flexDirection: 'row', alignItems: 'center' },
  voteCount:     { fontSize: 9, color: colors.primary, textAlign: 'center' },

  section: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  table:   { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' },
  tr: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  trHead:  { backgroundColor: colors.surface },
  trBest:  { backgroundColor: colors.primaryLight },
  th:      { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary },
  cellRight:    { flex: 1, alignItems: 'flex-end' },
  storeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  storeName:    { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, flexShrink: 1 },
  was:          { fontSize: fontSize.xs, color: colors.textMuted, textDecorationLine: 'line-through' },
  price:        { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  dash:         { fontSize: fontSize.sm, color: colors.textMuted },
  fuel:         { fontSize: 10, color: colors.textSecondary, marginTop: 1 },
  branch:       { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  source:       { fontSize: 10, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' },
  valueCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  valueHead:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  valueTitle: { fontSize: fontSize.xs, fontWeight: '800', color: colors.primaryDark, textTransform: 'uppercase' },
  valueStore: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  valueLine:  { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  valueNote:  { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  badge:        { borderRadius: radius.sm, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText:    { fontSize: 8, fontWeight: '800', color: colors.white },
  actions: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  compareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  compareText: { color: colors.white, fontWeight: '700', fontSize: fontSize.md },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  reportText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.sm },
});
