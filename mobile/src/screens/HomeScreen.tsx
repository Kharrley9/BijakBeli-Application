/**
 * HomeScreen.tsx — green gradient header + soft content area:
 *
 *  ┌────────────────────────────────────┐  (green gradient)
 *  │ (K) Hai, Khalil 👋            [⌖]  │
 *  │     📍 Near … ›                    │
 *  │ [ 🔍 What do you want to buy?  → ] │
 *  ├────────────────────────────────────┤  (rounded sheet)
 *  │ Kategori  (●) (●) (●) …            │
 *  │ Exclusive Offers  [banner] [next…] │
 *  │ Top Picks         [card] [card]    │
 *  │ Malls / Stores Near You            │
 *  └────────────────────────────────────┘
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Circle, Defs, LinearGradient as SvgGradient, Rect, Stop } from 'react-native-svg';
import FillSvg from '../components/FillSvg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { promotionService, productService, storeService, placeService } from '../services/dataService';
import { useRadiusKm } from '../components/RadiusChips';
import CategoryCircles from '../components/CategoryCircles';
import StoreCard from '../components/StoreCard';
import { imageSource } from '../utils/imageSource';
import { prettyName, storeCountLabel } from '../utils/format';

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_W = SCREEN_W - spacing.lg * 2 - 28; // leaves the next banner peeking in
const CARD_W = (SCREEN_W - spacing.lg * 2 - spacing.md) / 2;

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { origin, originMode, refreshGps } = useLocation();
  const focused = useIsFocused();

  const [deals, setDeals]         = useState<any[]>([]);
  const [products, setProducts]   = useState<any[]>([]);
  const [nearby, setNearby]       = useState<any[]>([]);
  const [malls, setMalls]         = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const radiusKm = useRadiusKm();

  const load = useCallback(async () => {
    // Exclusive Offers / promotions
    try {
      const r: any = await promotionService.getBestDeals(
        user?.preferredState ? { state: user.preferredState } : {}
      );
      setDeals((r?.data || r || []).slice(0, 5));
    } catch {}

    // Top Picks — cheapest active products
    try {
      // Cheapest within the buyer's radius when we know where they are
      const r: any = await productService.list({ sort: 'price_asc', limit: 10 }, origin);
      setProducts((r?.data?.products || r?.products || []).slice(0, 10));
    } catch {}

    // Stores near me
    if (origin) {
      try {
        const r: any = await storeService.getNearby({
          lat: origin.lat, lng: origin.lng,
          maxKm: radiusKm, limit: 4,
        });
        setNearby(r?.data || r || []);
      } catch {}
    } else {
      setNearby([]);
    }

    // Nearest malls (Google Places, via our server). Empty when the key isn't configured.
    if (origin) {
      try {
        const r: any = await placeService.getNearbyMalls({ lat: origin.lat, lng: origin.lng, radiusKm, limit: 5 });
        setMalls(r?.data || []);
      } catch { setMalls([]); }
    } else {
      setMalls([]);
    }
  }, [user?.preferredState, origin?.lat, origin?.lng, radiusKm]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    if (originMode === 'gps') await refreshGps();
    await load();
    setRefreshing(false);
  };

  const locationText = malls[0]
    ? `Near ${malls[0].name}`
    : origin ? (user?.preferredState || 'Near you') : 'Add your location first';
  const firstName = (user?.fullName || '').trim().split(/\s+/)[0];
  const initial = (firstName || 'U').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {focused && <StatusBar style="light" />}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.white}
            colors={[colors.primary]}
            progressBackgroundColor={colors.white}
          />
        }
      >
        {/* ── Green header ── */}
        <View style={styles.header}>
          <HeaderBackdrop />

          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => navigation.navigate('Profile')}
              accessibilityLabel="Profile"
            >
              <Text style={styles.avatarText}>{initial}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.hello} numberOfLines={1}>
                Hai{firstName ? `, ${firstName}` : ''} 👋
              </Text>
              <TouchableOpacity style={styles.locationRow} onPress={() => navigation.navigate('Nearby')}>
                <Ionicons name="location" size={13} color={colors.accentLight} />
                <Text style={styles.locationText} numberOfLines={1}>{locationText}</Text>
                <Ionicons name="chevron-down" size={13} color={colors.white} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.roundBtn}
              onPress={() => navigation.navigate('Scan')}
              accessibilityLabel="Scan an item"
            >
              <Ionicons name="scan-outline" size={21} color={colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.headline}>Find the cheapest fresh food near you</Text>

          <TouchableOpacity style={styles.searchPill} activeOpacity={0.9} onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search" size={18} color={colors.primary} />
            <Text style={styles.searchText} numberOfLines={1}>What do you want to buy?</Text>
            <View style={styles.searchGo}>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Content sheet ── */}
        <View style={styles.sheet}>
          <CategoryCircles
            onPick={(id, label) => navigation.navigate('CategoryBrowse', { categoryId: id, label })}
          />

          <SectionHead title="Exclusive Offers for You" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={BANNER_W + spacing.md}
            decelerationRate="fast"
            contentContainerStyle={styles.hScroll}
          >
            {deals.length > 0 ? (
              deals.map((d) => (
                <PromoBanner
                  key={d._id}
                  deal={d}
                  onPress={() => d.productId?._id && navigation.navigate('ProductDetail', { id: d.productId._id })}
                />
              ))
            ) : (
              <PromoBanner onPress={() => navigation.navigate('Search')} />
            )}
          </ScrollView>

          <SectionHead
            title="Top Picks for You"
            sub={origin ? `Cheapest within ${radiusKm} km` : 'Cheapest right now'}
            action="See All"
            onAction={() => navigation.navigate('Search', { sort: 'price_asc' })}
          />
          <View style={styles.grid}>
            {products.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                onPress={() => navigation.navigate('ProductDetail', { id: p._id })}
              />
            ))}
            {products.length === 0 && <Text style={styles.empty}>No products found.</Text>}
          </View>

          {malls.length > 0 && (
            <>
              <SectionHead title="Malls Near You" />
              <View style={styles.mallList}>
                {malls.map((m) => (
                  <View key={m.placeId} style={styles.mallRow}>
                    <View style={styles.mallIcon}>
                      <Ionicons name="business" size={18} color={colors.info} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mallName} numberOfLines={1}>{m.name}</Text>
                      <Text style={styles.mallAddr} numberOfLines={1}>{m.address}</Text>
                    </View>
                    <View style={styles.mallDist}>
                      <Text style={styles.mallDistText}>{m.distanceKm} km</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          <SectionHead
            title="Stores Near You"
            sub={origin ? `Within ${radiusKm} km` : undefined}
            action="See All"
            onAction={() => navigation.navigate('Nearby')}
          />
          {!origin ? (
            <TouchableOpacity style={styles.prompt} onPress={() => navigation.navigate('Nearby')}>
              <View style={styles.promptIcon}>
                <Ionicons name="location" size={18} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.promptTitle}>Turn on location</Text>
                <Text style={styles.promptText}>See how far each store is and where it's cheapest</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          ) : nearby.length === 0 ? (
            <Text style={styles.empty}>No stores within {radiusKm} km. Choose a wider distance in Nearby.</Text>
          ) : (
            <View style={{ paddingHorizontal: spacing.lg }}>
              {nearby.map((s, i) => (
                <StoreCard
                  key={s._id}
                  store={s}
                  rank={i + 1}
                  onPress={() => navigation.navigate('StoreProfile', { id: s._id })}
                />
              ))}
            </View>
          )}

          <Text style={styles.source}>Prices: PriceCatcher, KPDN (data.gov.my)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

/** Gradient + a few soft circles behind the header (react-native-svg, already in the build). */
function HeaderBackdrop() {
  return (
    <FillSvg>
      <Defs>
        {/* Top to bottom, starting from the status-bar green so the two join seamlessly */}
        <SvgGradient id="homeHead" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.primary} />
          <Stop offset="1" stopColor={colors.primaryDark} />
        </SvgGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#homeHead)" />
      {/* Soft circles kept clear of the top edge, so none is cut off under the status bar */}
      <Circle cx="96%" cy="58%" r="78" fill="#FFFFFF" fillOpacity="0.06" />
      <Circle cx="70%" cy="30%" r="26" fill="#FFFFFF" fillOpacity="0.05" />
      <Circle cx="6%" cy="100%" r="58" fill="#FFFFFF" fillOpacity="0.05" />
    </FillSvg>
  );
}

function SectionHead({
  title,
  sub,
  action,
  onAction,
}: {
  title: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!!sub && <Text style={styles.sectionSub}>{sub}</Text>}
      </View>
      {!!action && (
        <TouchableOpacity onPress={onAction} style={styles.seeAllBtn} hitSlop={8}>
          <Text style={styles.seeAll}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Promo card: product photo under a dark-green gradient, headline + CTA on the left. */
function PromoBanner({ deal, onPress }: { deal?: any; onPress: () => void }) {
  const image = deal?.productId?.image;
  const headline = deal ? deal.promotionTitle : 'Fresh Deals, Fresh Groceries!';
  const sub = deal
    ? `${deal.discountPercentage ? `${deal.discountPercentage}% off` : 'Special price'} at ${deal.storeId?.storeName || 'selected stores'}`
    : 'Compare real prices across 11 Malaysian supermarket chains and shop smart.';

  // Gradient drawn with react-native-svg — it's already in the dev client build,
  // unlike expo-linear-gradient, which would need a native rebuild.
  const content = (
    <View style={styles.bannerOverlay}>
      <FillSvg>
        <Defs>
          <SvgGradient id="bannerFade" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#0A3A22" stopOpacity="0.95" />
            <Stop offset="0.6" stopColor="#0A3A22" stopOpacity="0.6" />
            <Stop offset="1" stopColor="#0A3A22" stopOpacity="0.1" />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bannerFade)" />
        {!image && <Circle cx="88%" cy="20%" r="70" fill="#FFFFFF" fillOpacity="0.07" />}
        {!image && <Circle cx="98%" cy="95%" r="50" fill={colors.accent} fillOpacity="0.25" />}
      </FillSvg>
      <View style={styles.bannerTag}>
        <Ionicons name="pricetag" size={10} color={colors.accentDark} />
        <Text style={styles.bannerTagText}>{deal ? 'DEAL' : 'BIJAKBELI'}</Text>
      </View>
      <Text style={styles.bannerTitle} numberOfLines={2}>{headline}</Text>
      <Text style={styles.bannerSub} numberOfLines={2}>{sub}</Text>
      <View style={styles.bannerBtn}>
        <Text style={styles.bannerBtnText}>{deal ? 'See the deal' : 'Start comparing'}</Text>
        <Ionicons name="arrow-forward" size={12} color={colors.primaryDark} />
      </View>
    </View>
  );

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.banner}>
      {image ? (
        <ImageBackground source={imageSource(image)} style={styles.bannerFill} resizeMode="cover">
          {content}
        </ImageBackground>
      ) : (
        <View style={[styles.bannerFill, { backgroundColor: colors.primaryDark }]}>{content}</View>
      )}
    </TouchableOpacity>
  );
}

function ProductCard({ product, onPress }: { product: any; onPress: () => void }) {
  const price = product.lowestPrice;
  const stores = storeCountLabel(product);

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.productImgWrap}>
        {product.image ? (
          <Image source={imageSource(product.image)} style={styles.productImg} resizeMode="cover" />
        ) : (
          <View style={styles.productImgPlaceholder}>
            <Ionicons name="leaf-outline" size={34} color={colors.primary} />
          </View>
        )}
        {!!stores && (
          <View style={styles.storesTag}>
            <Ionicons name="storefront" size={10} color={colors.primary} />
            <Text style={styles.storesTagText}>{stores}</Text>
          </View>
        )}
      </View>

      <View style={styles.productBody}>
        <Text style={styles.productName} numberOfLines={2}>{prettyName(product.productName)}</Text>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.fromText}>from</Text>
            <Text style={styles.priceText}>{price != null ? `RM${price.toFixed(2)}` : '—'}</Text>
          </View>
          <View style={styles.compareBtn}>
            <Ionicons name="swap-horizontal" size={15} color={colors.white} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.primary },
  scrollView: { backgroundColor: colors.background },
  scroll:     { paddingBottom: 0 },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + spacing.lg,
    overflow: 'hidden',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.lg, fontWeight: '900', color: colors.primary },
  hello: { color: colors.white, fontSize: fontSize.lg, fontWeight: '800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, alignSelf: 'flex-start' },
  locationText: { color: 'rgba(255,255,255,0.92)', fontSize: fontSize.sm, fontWeight: '600', maxWidth: SCREEN_W * 0.5 },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: '900',
    lineHeight: 28,
    marginTop: spacing.lg,
    maxWidth: '85%',
  },
  searchPill: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: 6,
    marginTop: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    ...shadow.md,
  },
  searchText: { flex: 1, color: colors.textMuted, fontSize: fontSize.md },
  searchGo: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content sheet (overlaps the header a little)
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    minHeight: 480,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  sectionSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  seeAll: { fontSize: fontSize.xs, fontWeight: '800', color: colors.primary },

  hScroll: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: 4 },

  // Promo banner
  banner: { width: BANNER_W, height: 160, borderRadius: radius.lg, overflow: 'hidden', ...shadow.sm },
  bannerFill: { flex: 1 },
  bannerOverlay: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  bannerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: colors.accentLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  bannerTagText: { fontSize: 9, fontWeight: '900', color: colors.accentDark, letterSpacing: 0.6 },
  bannerTitle: { fontSize: fontSize.lg + 1, fontWeight: '900', color: colors.white, maxWidth: '80%', lineHeight: 24 },
  bannerSub: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.9)', marginTop: spacing.xs, maxWidth: '75%', lineHeight: 16 },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  bannerBtnText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.primaryDark },

  // Product grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  productCard: {
    width: CARD_W,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  productImgWrap: {
    width: '100%',
    height: CARD_W * 0.8,
    backgroundColor: colors.primarySoft,
  },
  productImg: { width: '100%', height: '100%' },
  productImgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  storesTag: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  storesTagText: { fontSize: 10, fontWeight: '800', color: colors.primary },
  productBody: { padding: spacing.md, paddingTop: spacing.sm + 2 },
  productName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, lineHeight: 18, minHeight: 36 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.sm },
  fromText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  priceText: { fontSize: fontSize.lg, fontWeight: '900', color: colors.primary },
  compareBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Malls
  mallList: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  mallRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md,
    ...shadow.sm,
  },
  mallIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.infoLight, alignItems: 'center', justifyContent: 'center',
  },
  mallName: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  mallAddr: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  mallDist: { backgroundColor: colors.background, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  mallDistText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.text },

  // Misc
  empty: { color: colors.textMuted, fontSize: fontSize.sm, paddingHorizontal: spacing.lg },
  prompt: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, marginHorizontal: spacing.lg,
    ...shadow.sm,
  },
  promptIcon: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  promptTitle: { color: colors.text, fontWeight: '800', fontSize: fontSize.sm },
  promptText: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  source: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
