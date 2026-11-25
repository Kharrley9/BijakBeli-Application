import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import { useLocation } from '../context/LocationContext';
import { productService, priceService } from '../services/dataService';
import { ProductDetail } from '../types';
import AppHeader from '../components/AppHeader';
import DistanceBadge from '../components/DistanceBadge';
import OriginToggle from '../components/OriginToggle';
import BrandAvatar from '../components/BrandAvatar';
import EmptyState from '../components/EmptyState';
import { OutsideRadiusNotice, useRadiusKm } from '../components/RadiusChips';
import { imageSource } from '../utils/imageSource';
import { prettyName, storeCountLabel } from '../utils/format';

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
  const radiusKm = useRadiusKm();

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
  }, [id, origin?.lat, origin?.lng, radiusKm]);

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
        <AppHeader title="Product Details" />
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      </View>
    );
  }
  if (!data) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Product Details" />
        <EmptyState icon="leaf-outline" title="Product not found" body="It may no longer have price data." />
      </View>
    );
  }

  const { product, stores } = data;
  const located = data.priceScope === 'nearby';
  const nearby = located && !!data.nearbyStoreCount;
  const brand = (product as any).brandId?.brandName;
  const rows = [...stores].sort(
    (a, b) => (a.store.distanceKm ?? 1e9) - (b.store.distanceKm ?? 1e9)
  ).slice(0, 8);

  return (
    <View style={styles.safe}>
      <AppHeader title="Product Details" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Photo ── */}
        <View style={styles.hero}>
          {product.image ? (
            <Image source={imageSource(product.image)} style={styles.heroImg} />
          ) : (
            <Ionicons name="leaf-outline" size={52} color={colors.primary} />
          )}
        </View>
        {!!product.image && !!product.imageCredit && (
          <Text
            style={styles.photoCredit}
            numberOfLines={1}
            onPress={() => product.imageCredit?.sourceUrl && Linking.openURL(product.imageCredit.sourceUrl)}
          >
            Photo: {product.imageCredit.author || 'Wikimedia Commons'}
            {product.imageCredit.license ? `, ${product.imageCredit.license}` : ''} · Wikimedia Commons
          </Text>
        )}

        {/* ── Name + lowest price ── */}
        <View style={styles.card}>
          <Text style={styles.name}>{prettyName(product.productName)}</Text>
          <View style={styles.subRow}>
            {brand && <BrandAvatar brandName={brand} size={20} style={{ marginRight: spacing.xs }} />}
            <Text style={styles.sub}>{[brand, product.unit && `per ${product.unit}`].filter(Boolean).join(' · ')}</Text>
          </View>

          <View style={styles.priceBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.priceLabel}>
                {nearby ? `Lowest within ${data.nearbyRadiusKm} km` : 'Lowest price'}
              </Text>
              <Text style={styles.priceBig}>
                RM{data.lowestPrice != null ? data.lowestPrice.toFixed(2) : '—'}
              </Text>
            </View>
            <View style={styles.storesPill}>
              <Ionicons name="storefront" size={14} color={colors.primary} />
              <Text style={styles.storesPillText}>
                {storeCountLabel({ storeCount: data.storeCount, nearbyStoreCount: data.nearbyStoreCount, priceScope: nearby ? 'nearby' : 'all' })}
              </Text>
            </View>
          </View>

          {/* ── Price Catcher: Lowest in Malaysia ── */}
          {lowestNational && (
            <View style={styles.nationalBadge}>
              <View style={styles.trophy}>
                <Ionicons name="trophy" size={14} color={colors.accentDark} />
              </View>
              <Text style={styles.nationalText}>
                Lowest in Malaysia: <Text style={styles.nationalPrice}>RM{lowestNational.price?.toFixed(2)}</Text>
                {lowestNational.store?.storeName ? ` at ${lowestNational.store.storeName}` : ''}
                {lowestNational.store?.state ? `, ${lowestNational.store.state}` : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <OriginToggle />
          <View style={styles.sectionRow}>
            <Text style={styles.section}>
              {located ? `Prices within ${data.nearbyRadiusKm ?? radiusKm} km` : 'Prices at Stores'}
            </Text>
            {rows.length > 0 && <Text style={styles.sectionHint}>Nearest first</Text>}
          </View>
          {located && rows.length === 0 ? (
            <OutsideRadiusNotice radiusKm={data.nearbyRadiusKm ?? radiusKm} nearestBeyond={data.nearestBeyond} />
          ) : (
            rows.map((r, i) => (
              <TouchableOpacity
                key={r.store._id}
                style={[styles.storeRow, i === rows.length - 1 && { borderBottomWidth: 0 }, r.isLowestPrice && styles.storeRowBest]}
                onPress={() => navigation.navigate('StoreProfile', { id: r.store._id })}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeName} numberOfLines={1}>{r.store.storeName}</Text>
                  {!!branchOf(r.store) && (
                    <Text style={styles.branch} numberOfLines={1}>{branchOf(r.store)}</Text>
                  )}
                  <View style={styles.badgeRow}>
                    {r.store.distanceKm != null && (
                      <DistanceBadge distanceKm={r.store.distanceKm} durationMin={r.store.durationMin} compact />
                    )}
                    {r.isLowestPrice && <Badge text="Cheapest" icon="pricetag" />}
                    {r.isNearest && <Badge text="Nearest" icon="navigate" color={colors.info} bg={colors.infoLight} />}
                    {r.isBestValue && <Badge text="Best value" icon="star" color={colors.accentDark} bg={colors.accentLight} />}
                  </View>
                </View>
                <View style={styles.priceCol}>
                  {r.hasPromotion && (
                    <Text style={styles.was}>RM{r.price.toFixed(2)}</Text>
                  )}
                  <Text style={[styles.price, r.isLowestPrice && { color: colors.primary }]}>
                    RM{r.effectivePrice.toFixed(2)}
                  </Text>
                  {r.travelCost != null && (
                    <Text style={styles.fuel}>+RM{r.travelCost.toFixed(2)} petrol</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
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
          style={styles.reportBtn}
          onPress={() => navigation.navigate('ReportPrice', {
            productId: id,
            productName: data?.product?.productName,
          })}
        >
          <Ionicons name="megaphone-outline" size={18} color={colors.primary} />
          <Text style={styles.reportText}>JOM Kongsi</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.compareBtn}
          onPress={() => navigation.navigate('PriceComparison', { productId: id })}
        >
          <Ionicons name="swap-horizontal" size={18} color={colors.white} />
          <Text style={styles.compareText}>Compare Prices</Text>
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
        <View style={styles.valueIcon}>
          <Ionicons name="car-sport" size={16} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.valueTitle}>Best value incl. petrol</Text>
          <Text style={styles.valueStore} numberOfLines={1}>
            {best.store.mallName || best.store.storeName}
          </Text>
        </View>
        <Text style={styles.valueTotal}>RM{best.totalCost.toFixed(2)}</Text>
      </View>
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

function Badge({
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
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {!!icon && <Ionicons name={icon} size={9} color={color} />}
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
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
  const tone = steady ? colors.textSecondary : up ? colors.discount : colors.primary;
  const toneBg = steady ? colors.surface : up ? colors.dangerLight : colors.primaryLight;

  return (
    <View style={styles.card}>
      <View style={styles.sectionRow}>
        <Text style={styles.section}>Price Trend</Text>
        <Text style={styles.sectionHint}>{region} · 30 days</Text>
      </View>
      <View style={styles.trendSummary}>
        <Text style={styles.trendNow}>RM{last.toFixed(2)}</Text>
        <View style={[styles.trendPill, { backgroundColor: toneBg }]}>
          <Text style={[styles.trendChange, { color: tone }]}>
            {steady ? 'Steady' : `${up ? '▲' : '▼'} ${Math.abs(changePct).toFixed(1)}%`}
          </Text>
        </View>
        <Text style={styles.trendSince}>since {shortDate(points[0].date)}</Text>
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
    <View style={styles.card}>
      <View style={styles.sectionRow}>
        <Text style={styles.section}>Community Reports</Text>
        <TouchableOpacity onPress={onAdd} style={styles.addBtn}>
          <Ionicons name="add" size={14} color={colors.primary} />
          <Text style={styles.addBtnText}>Add Report</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : reports.length === 0 ? (
        <View style={styles.noReports}>
          <Ionicons name="chatbubbles-outline" size={22} color={colors.textMuted} />
          <Text style={styles.noReportsText}>No verified reports yet. Be the first to share a price!</Text>
        </View>
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
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  hero: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.sm,
  },
  heroImg: { width: '100%', height: '100%' },
  photoCredit: { fontSize: 10, color: colors.textMuted, marginTop: 6, paddingHorizontal: 2 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadow.sm,
  },
  name: { fontSize: fontSize.xl - 1, fontWeight: '800', color: colors.text, lineHeight: 27 },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  priceLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary },
  priceBig: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.primary, marginTop: 2 },
  storesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  storesPillText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.primary },

  // Price Catcher additions
  nationalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentLight,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginTop: spacing.sm,
  },
  trophy: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nationalText:  { flex: 1, fontSize: fontSize.xs, color: colors.accentDark, lineHeight: 17 },
  nationalPrice: { fontWeight: '900', color: colors.accentDark },

  sectionRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  section:     { fontSize: fontSize.md + 1, fontWeight: '800', color: colors.text },
  sectionHint: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },

  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  storeRowBest: {
    backgroundColor: colors.primarySoft,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderBottomColor: 'transparent',
  },
  storeName: { fontSize: fontSize.sm + 1, fontWeight: '800', color: colors.text },
  branch:    { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  badgeRow:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 5 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '800' },
  priceCol:  { alignItems: 'flex-end', minWidth: 78 },
  was:       { fontSize: fontSize.xs, color: colors.textMuted, textDecorationLine: 'line-through' },
  price:     { fontSize: fontSize.md + 1, fontWeight: '900', color: colors.text },
  fuel:      { fontSize: 10, color: colors.textSecondary, marginTop: 1 },

  valueCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: '#FDE3A7',
  },
  valueHead:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  valueIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueTitle: { fontSize: 10, fontWeight: '900', color: colors.accentDark, textTransform: 'uppercase', letterSpacing: 0.4 },
  valueStore: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  valueTotal: { fontSize: fontSize.lg, fontWeight: '900', color: colors.text },
  valueLine:  { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2, lineHeight: 19 },
  valueNote:  { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },

  trendSummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  trendNow:     { fontSize: fontSize.xl, fontWeight: '900', color: colors.text },
  trendPill:    { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  trendChange:  { fontSize: fontSize.xs, fontWeight: '800' },
  trendSince:   { fontSize: fontSize.xs, color: colors.textMuted },
  trendChart:   { flexDirection: 'row', alignItems: 'flex-end', gap: 2, backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.sm, height: 80 },
  trendBarWrap: { alignItems: 'center', justifyContent: 'flex-end', flex: 1, height: '100%' },
  trendBar:     { width: '78%', backgroundColor: '#BFE3CB', borderRadius: 3 },
  trendBarLast: { backgroundColor: colors.primary },
  trendAxis:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  trendAxisText:{ fontSize: 10, color: colors.textMuted },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  addBtnText:    { fontSize: fontSize.xs, color: colors.primary, fontWeight: '800' },
  noReports:     { alignItems: 'center', gap: 6, paddingVertical: spacing.md },
  noReportsText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },

  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  reportStore:   { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  reportMeta:    { fontSize: fontSize.xs, color: colors.textSecondary },
  reportPromo:   { fontSize: fontSize.xs, color: colors.primary, marginTop: 2 },
  reportPrice:   { fontSize: fontSize.md, fontWeight: '800', color: colors.primary, marginHorizontal: spacing.sm },
  reportActions: { flexDirection: 'row', alignItems: 'center' },
  voteCount:     { fontSize: 9, color: colors.primary, textAlign: 'center' },

  source: { fontSize: 10, color: colors.textMuted, marginTop: spacing.lg, textAlign: 'center', lineHeight: 15 },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md + 4,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    ...shadow.md,
  },
  compareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  compareText: { color: colors.white, fontWeight: '800', fontSize: fontSize.md },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  reportText: { color: colors.primary, fontWeight: '800', fontSize: fontSize.sm },
});
