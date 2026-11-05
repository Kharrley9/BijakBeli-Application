/**
 * HomeScreen.tsx — green header + white content sheet:
 *
 *  ┌────────────────────────────────────┐  (green)
 *  │ 📍 Location ›                      │
 *  │ [☰] [ Search…            ] 🔔 ♡   │
 *  │  (●) (●) (●) (●) …categories       │
 *  ├────────────────────────────────────┤  (white sheet, rounded top)
 *  │ Exclusive Offers for You           │
 *  │  [Promo banner on photo] [next…]   │
 *  │ Top Picks for You                  │
 *  │  [Product] [Product]               │
 *  │ Stores Near You                    │
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
import Svg, { Defs, LinearGradient as SvgGradient, Rect, Stop } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { promotionService, productService, storeService, placeService } from '../services/dataService';
import { DEFAULT_MAX_NEARBY_KM } from '../constants';
import CategoryCircles from '../components/CategoryCircles';
import StoreCard from '../components/StoreCard';

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
      const r: any = await productService.list({ sort: 'price_asc', limit: 10 }, null);
      setProducts((r?.data?.products || r?.products || []).slice(0, 10));
    } catch {}

    // Stores near me
    if (origin) {
      try {
        const r: any = await storeService.getNearby({
          lat: origin.lat, lng: origin.lng,
          maxKm: DEFAULT_MAX_NEARBY_KM, limit: 4,
        });
        setNearby(r?.data || r || []);
      } catch {}
    } else {
      setNearby([]);
    }

    // Nearest malls (Google Places, via our server). Empty when the key isn't configured.
    if (origin) {
      try {
        const r: any = await placeService.getNearbyMalls({ lat: origin.lat, lng: origin.lng, limit: 5 });
        setMalls(r?.data || []);
      } catch { setMalls([]); }
    } else {
      setMalls([]);
    }
  }, [user?.preferredState, origin?.lat, origin?.lng]);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {focused && <StatusBar style="light" />}
      <ScrollView
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
        <TouchableOpacity style={styles.locationRow} onPress={() => navigation.navigate('Nearby')}>
          <Ionicons name="location" size={16} color={colors.white} />
          <Text style={styles.locationText}>{locationText}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.searchRow}>
          <TouchableOpacity style={styles.roundBtn} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="menu" size={22} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchPill} activeOpacity={0.85} onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search" size={18} color={colors.primary} />
            <Text style={styles.searchText} numberOfLines={1}>What do you want to buy?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundBtn}>
            <Ionicons name="notifications-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* ── White sheet ── */}
        <View style={styles.sheetGap} />
        <View style={styles.sheet}>
          <CategoryCircles
            onPick={(id, label) => navigation.navigate('CategoryBrowse', { categoryId: id, label })}
          />

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Exclusive Offers for You</Text>
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

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Top Picks for You</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search', { sort: 'price_asc' })}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
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
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Malls Near You</Text>
              </View>
              <View style={styles.mallList}>
                {malls.map((m) => (
                  <View key={m.placeId} style={styles.mallRow}>
                    <View style={styles.mallIcon}>
                      <Ionicons name="storefront" size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mallName} numberOfLines={1}>{m.name}</Text>
                      <Text style={styles.mallAddr} numberOfLines={1}>{m.address}</Text>
                    </View>
                    <Text style={styles.mallDist}>{m.distanceKm} km</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Stores Near You</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Nearby')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {!origin ? (
            <TouchableOpacity style={styles.prompt} onPress={() => navigation.navigate('Nearby')}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={styles.promptText}>Turn on location to see nearby stores</Text>
            </TouchableOpacity>
          ) : nearby.length === 0 ? (
            <Text style={styles.empty}>No stores found nearby.</Text>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

/** Promo card: product photo under a dark-green gradient, headline + CTA on the left. */
function PromoBanner({ deal, onPress }: { deal?: any; onPress: () => void }) {
  const image = deal?.productId?.image;
  const headline = deal ? deal.promotionTitle : 'Fresh Deals, Fresh Groceries!';
  const sub = deal
    ? `${deal.discountPercentage ? `${deal.discountPercentage}% off` : 'Special price'} at ${deal.storeId?.storeName || 'selected stores'}`
    : 'Compare prices across 10 Malaysian chains and shop smart.';

  // Gradient drawn with react-native-svg — it's already in the dev client build,
  // unlike expo-linear-gradient, which would need a native rebuild.
  const content = (
    <View style={styles.bannerOverlay}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <SvgGradient id="bannerFade" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#0B3D1C" stopOpacity="0.95" />
            <Stop offset="0.55" stopColor="#0B3D1C" stopOpacity="0.6" />
            <Stop offset="1" stopColor="#0B3D1C" stopOpacity="0.15" />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bannerFade)" />
      </Svg>
      <Text style={styles.bannerTitle} numberOfLines={2}>{headline}</Text>
      <Text style={styles.bannerSub} numberOfLines={2}>{sub}</Text>
      <View style={styles.bannerBtn}>
        <Text style={styles.bannerBtnText}>GRAB THE DEALS</Text>
      </View>
    </View>
  );

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.banner}>
      {image ? (
        <ImageBackground source={{ uri: image }} style={styles.bannerFill} resizeMode="cover">
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
  const count = product.storeCount;

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.productImgWrap}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.productImg} resizeMode="cover" />
        ) : (
          <View style={styles.productImgPlaceholder}>
            <Ionicons name="cube-outline" size={36} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.heartBtn}>
          <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
        </View>
      </View>

      <View style={styles.chipRow}>
        <View style={styles.priceChip}>
          <Text style={styles.priceChipText}>{price != null ? `RM${price.toFixed(2)}` : '—'}</Text>
        </View>
        <View style={styles.compareChip}>
          <Ionicons name="swap-horizontal" size={12} color={colors.primary} />
          <Text style={styles.compareText}>{count ? `Compare · ${count}` : 'Compare'}</Text>
        </View>
      </View>

      <Text style={styles.productName} numberOfLines={2}>{product.productName}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingBottom: 0 },

  // Header
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  locationText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '600' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  roundBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  searchPill: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 21,
    backgroundColor: colors.white,
  },
  searchText: { flex: 1, color: colors.textMuted, fontSize: fontSize.sm },

  sheetGap: { height: spacing.xl },

  // White sheet
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.xl,
    paddingBottom: 40,
    minHeight: 480,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  seeAll: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary, marginBottom: spacing.md },

  hScroll: { paddingHorizontal: spacing.lg, gap: spacing.md },

  // Promo banner
  banner: { width: BANNER_W, height: 150, borderRadius: radius.lg, overflow: 'hidden' },
  bannerFill: { flex: 1 },
  bannerOverlay: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  bannerTitle: { fontSize: fontSize.xl, fontWeight: '900', color: colors.white, maxWidth: '75%' },
  bannerSub: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.9)', marginTop: spacing.xs, maxWidth: '70%', lineHeight: 15 },
  bannerBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  bannerBtnText: { fontSize: 10, fontWeight: '800', color: colors.primaryDark, letterSpacing: 0.5 },

  // Product grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  productCard: { width: CARD_W },
  productImgWrap: {
    width: '100%',
    height: CARD_W * 0.95,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  productImg: { width: '100%', height: '100%' },
  productImgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heartBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  priceChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  priceChipText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.primaryDark },
  compareChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  compareText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  productName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginTop: spacing.xs, lineHeight: 17 },

  // Malls
  mallList: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  mallRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
  },
  mallIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  mallName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  mallAddr: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  mallDist: { fontSize: fontSize.sm, fontWeight: '800', color: colors.primary },

  // Misc
  empty: { color: colors.textMuted, fontStyle: 'italic', fontSize: fontSize.sm, paddingHorizontal: spacing.lg },
  prompt: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    padding: spacing.md, marginHorizontal: spacing.lg,
    borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed',
  },
  promptText: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
});
