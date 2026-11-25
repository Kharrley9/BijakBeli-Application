import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { Defs, LinearGradient as SvgGradient, Rect, Stop } from 'react-native-svg';
import FillSvg from '../components/FillSvg';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import { useLocation } from '../context/LocationContext';
import { storeService } from '../services/dataService';
import { Store, StoreProductListing } from '../types';
import { useLanguage } from '../context/LanguageContext';
import AppHeader from '../components/AppHeader';
import { formatDuration, formatKm } from '../components/DistanceBadge';
import EmptyState from '../components/EmptyState';
import { imageSource } from '../utils/imageSource';
import { prettyName } from '../utils/format';

interface CategoryGroup {
  key: string;
  label: string;
  products: StoreProductListing[];
}

/** The store's listings grouped by category, in the app's category order. */
function groupByCategory(products: StoreProductListing[], lang: string): CategoryGroup[] {
  const sorted = [...products].sort(
    (a, b) =>
      (a.categoryOrder ?? 999) - (b.categoryOrder ?? 999) ||
      (a.category || '').localeCompare(b.category || '') ||
      a.productName.localeCompare(b.productName)
  );
  const groups: CategoryGroup[] = [];
  for (const p of sorted) {
    const key = p.category || 'Other';
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      const label = (lang === 'en' && p.categoryEn) || p.category || (lang === 'en' ? 'Other' : 'Lain-lain');
      g = { key, label, products: [] };
      groups.push(g);
    }
    g.products.push(p);
  }
  return groups;
}

export default function StoreProfileScreen({ route, navigation }: any) {
  const { id } = route.params || {};
  const { origin, originParams } = useLocation();
  const { lang } = useLanguage();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  // null = all categories
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const groups = useMemo(() => groupByCategory(store?.products || [], lang), [store?.products, lang]);
  const picked = groups.filter((g) => g.key === activeCat);
  const shownGroups = picked.length ? picked : groups;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await storeService.getById(id, originParams());
      setStore(res?.data || res);
    } catch {
      setStore(null);
    } finally {
      setLoading(false);
    }
  }, [id, origin?.lat, origin?.lng]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Store" />
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      </View>
    );
  }
  if (!store) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Store" />
        <EmptyState icon="storefront-outline" title="Store not found" />
      </View>
    );
  }

  const navigate = () => {
    const c = store.location?.coordinates;
    if (c?.length === 2) Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${c[1]},${c[0]}`);
  };
  const call = () => store.phone && Linking.openURL(`tel:${store.phone}`);

  // "AEON BiG Batu Pahat" -> "Batu Pahat"
  const mall = store.mallName || '';
  const branch = mall.toLowerCase().startsWith(store.storeName.toLowerCase())
    ? mall.slice(store.storeName.length).trim()
    : store.branch || '';
  const place =
    [branch, store.city && store.city !== branch ? store.city : null].filter(Boolean).join(', ') || store.state;

  return (
    <View style={styles.safe}>
      <AppHeader title={store.storeName} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Photo with name ── */}
        <View style={styles.banner}>
          {store.bannerImage || store.logo ? (
            <Image source={imageSource((store.bannerImage || store.logo)!)} style={styles.bannerImg} resizeMode="cover" />
          ) : (
            <Ionicons name="storefront-outline" size={48} color={colors.primary} />
          )}
          <FillSvg>
            <Defs>
              <SvgGradient id="storeFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0.35" stopColor="#000000" stopOpacity="0" />
                <Stop offset="1" stopColor="#000000" stopOpacity="0.72" />
              </SvgGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#storeFade)" />
          </FillSvg>
          {store.photoCredit?.scope === 'chain' && (
            <View style={styles.standIn}>
              <Ionicons name="image-outline" size={11} color="#fff" />
              <Text style={styles.standInText}>Another {store.storeName} store</Text>
            </View>
          )}
          <View style={styles.bannerText}>
            <Text style={styles.name} numberOfLines={1}>{store.storeName}</Text>
            <View style={styles.placeRow}>
              <Ionicons name="location" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.place} numberOfLines={1}>{place}</Text>
            </View>
          </View>
        </View>
        {!!store.bannerImage && !!store.photoCredit && (
          <Text
            style={styles.credit}
            numberOfLines={1}
            onPress={() => store.photoCredit?.sourceUrl && Linking.openURL(store.photoCredit.sourceUrl)}
          >
            Photo: {store.photoCredit.author || 'Wikimedia Commons'}
            {store.photoCredit.license ? `, ${store.photoCredit.license}` : ''} · Wikimedia Commons
          </Text>
        )}

        {/* ── Info + actions ── */}
        <View style={styles.infoCard}>
          <View style={styles.statsRow}>
            <Stat
              icon="navigate"
              value={store.distanceKm != null ? formatKm(store.distanceKm) : '—'}
              label={store.durationMin != null ? `${formatDuration(store.durationMin)} drive` : 'distance'}
            />
            <View style={styles.statDivider} />
            <Stat icon="basket" value={String(store.productCount || 0)} label="fresh items" />
            <View style={styles.statDivider} />
            <Stat icon="grid" value={String(groups.length)} label={groups.length === 1 ? 'category' : 'categories'} />
          </View>
          {!!store.address && (
            <View style={styles.infoLine}>
              <Ionicons name="map-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.infoText}>{store.address}</Text>
            </View>
          )}
          {!!store.operating_hours && (
            <View style={styles.infoLine}>
              <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.infoText}>{store.operating_hours}</Text>
            </View>
          )}
          {!!store.description && <Text style={styles.desc}>{store.description}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionPrimary} onPress={navigate}>
              <Ionicons name="navigate" size={17} color={colors.white} />
              <Text style={styles.actionPrimaryText}>Directions</Text>
            </TouchableOpacity>
            {!!store.phone && (
              <TouchableOpacity style={styles.actionGhost} onPress={call}>
                <Ionicons name="call" size={17} color={colors.primary} />
                <Text style={styles.actionGhostText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Products by category ── */}
        <Text style={styles.section}>
          Products {store.productCount ? `(${store.productCount})` : ''}
        </Text>
        {groups.length === 0 ? (
          <EmptyState icon="basket-outline" title="No products listed" body="This store has no recent price data." />
        ) : (
          <>
            {groups.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                {[
                  { key: null as string | null, label: lang === 'en' ? 'All' : 'Semua', count: store.products?.length || 0 },
                  ...groups.map((g) => ({ key: g.key as string | null, label: g.label, count: g.products.length })),
                ].map((c) => {
                  const on = c.key === null ? !picked.length : activeCat === c.key;
                  return (
                    <TouchableOpacity
                      key={c.key ?? 'all'}
                      style={[styles.chip, on && styles.chipOn]}
                      onPress={() => setActiveCat(c.key)}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
                      <View style={[styles.chipCount, on && styles.chipCountOn]}>
                        <Text style={[styles.chipCountText, on && styles.chipCountTextOn]}>{c.count}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            {shownGroups.map((g) => (
              <View key={g.key} style={styles.groupCard}>
                <View style={styles.groupHead}>
                  <Text style={styles.groupTitle}>{g.label}</Text>
                  <Text style={styles.groupCount}>
                    {g.products.length} {g.products.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>
                {g.products.map((p, i) => (
                  <TouchableOpacity
                    key={p._id}
                    style={[styles.pRow, i === g.products.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => navigation.navigate('ProductDetail', { id: p._id })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pThumb}>
                      {p.image ? (
                        <Image source={imageSource(p.image)} style={{ width: 48, height: 48 }} />
                      ) : (
                        <Ionicons name="leaf-outline" size={20} color={colors.primary} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pName} numberOfLines={2}>{prettyName(p.productName)}</Text>
                      {!!p.unit && <Text style={styles.pSub}>per {p.unit}</Text>}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      {p.previousPrice ? (
                        <Text style={styles.pWas}>RM{Number(p.previousPrice).toFixed(2)}</Text>
                      ) : null}
                      <Text style={styles.pPrice}>RM{Number(p.price).toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </>
        )}
        <Text style={styles.source}>Prices: PriceCatcher, KPDN (data.gov.my)</Text>
      </ScrollView>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={14} color={colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  banner: {
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.sm,
  },
  bannerImg: { width: '100%', height: '100%' },
  standIn: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  standInText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  bannerText: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.md },
  name: { fontSize: fontSize.xl + 2, fontWeight: '900', color: colors.white },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  place: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: 'rgba(255,255,255,0.92)' },
  credit: { fontSize: 10, color: colors.textMuted, paddingHorizontal: 2, paddingTop: 6 },

  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadow.sm,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  stat: { flex: 1, alignItems: 'center' },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: { fontSize: fontSize.md + 1, fontWeight: '900', color: colors.text },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  statDivider: { width: 1, height: 40, backgroundColor: colors.divider },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  infoText: { flex: 1, fontSize: fontSize.xs + 1, color: colors.textSecondary, lineHeight: 18 },
  desc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  actionPrimaryText: { color: colors.white, fontWeight: '800', fontSize: fontSize.sm + 1 },
  actionGhost: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  actionGhostText: { color: colors.primary, fontWeight: '800', fontSize: fontSize.sm + 1 },

  section: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  chips: { paddingBottom: spacing.md, gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: spacing.md,
    paddingRight: 5,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.xs + 1, fontWeight: '700', color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  chipCount: {
    minWidth: 22,
    paddingHorizontal: 5,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCountOn: { backgroundColor: 'rgba(255,255,255,0.22)' },
  chipCountText: { fontSize: 10, fontWeight: '800', color: colors.textSecondary },
  chipCountTextOn: { color: colors.white },
  groupCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.primarySoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight,
  },
  groupTitle: { fontSize: fontSize.sm + 1, fontWeight: '800', color: colors.primaryDark },
  groupCount: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary },
  pRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  pThumb: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, lineHeight: 18 },
  pSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  pWas: { fontSize: fontSize.xs, color: colors.textMuted, textDecorationLine: 'line-through' },
  pPrice: { fontSize: fontSize.md, fontWeight: '900', color: colors.primary },
  source: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});
