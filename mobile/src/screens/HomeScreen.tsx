import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useCart } from '../context/CartContext';
import { promotionService, storeService } from '../services/dataService';
import { DEFAULT_MAX_NEARBY_KM } from '../constants';
import SearchBar from '../components/SearchBar';
import CategoryGrid from '../components/CategoryGrid';
import StoreCard from '../components/StoreCard';
import DistanceBadge from '../components/DistanceBadge';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { origin } = useLocation();
  const { count } = useCart();
  const first = user?.fullName?.split(' ')[0] || 'there';

  const [deals, setDeals] = useState<any[]>([]);
  const [nearby, setNearby] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const dealsRes: any = await promotionService.getBestDeals(
        user?.preferredState ? { state: user.preferredState } : {}
      );
      setDeals((dealsRes?.data || dealsRes || []).slice(0, 8));
    } catch {}
    if (origin) {
      try {
        const res: any = await storeService.getNearby({
          lat: origin.lat,
          lng: origin.lng,
          maxKm: DEFAULT_MAX_NEARBY_KM,
          limit: 6,
        });
        setNearby(res?.data || res || []);
      } catch {}
    } else {
      setNearby([]);
    }
  }, [user?.preferredState, origin?.lat, origin?.lng]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openCategory = (slug: string, label: string) =>
    navigation.navigate('CategoryBrowse', { group: slug, label });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Hello, {first}</Text>
            <Text style={styles.subHello}>What are you buying today?</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartIconBtn}>
            <Ionicons name="cart-outline" size={22} color={colors.text} />
            {count > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{count}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatar}>
            <Ionicons name="person-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <SearchBar
            editable={false}
            placeholder="Search products across stores..."
            onPress={() => navigation.navigate('Search')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <CategoryGrid onPick={openCategory} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeadRow}>
            <Text style={styles.sectionTitle}>Best Deals Near You</Text>
          </View>
          {deals.length === 0 ? (
            <Text style={styles.empty}>No active deals right now.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
              {deals.map((d) => (
                <TouchableOpacity
                  key={d._id}
                  style={styles.dealCard}
                  onPress={() =>
                    d.productId?._id &&
                    navigation.navigate('ProductDetail', { id: d.productId._id })
                  }
                >
                  <View style={styles.dealTop}>
                    <Text style={styles.dealOff}>{d.discountPercentage || 0}% OFF</Text>
                    <Text style={styles.dealStore} numberOfLines={1}>
                      {d.storeId?.storeName || 'Store'}
                    </Text>
                  </View>
                  <Text style={styles.dealName} numberOfLines={2}>
                    {d.productId?.productName || d.promotionTitle}
                  </Text>
                  <Text style={styles.dealPrice}>RM{Number(d.promotionPrice).toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeadRow}>
            <Text style={styles.sectionTitle}>Stores Near You</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Nearby')}>
              <Text style={styles.link}>See map</Text>
            </TouchableOpacity>
          </View>
          {!origin ? (
            <TouchableOpacity
              style={styles.prompt}
              onPress={() => navigation.navigate('Nearby')}
            >
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={styles.promptText}>Turn on location to see nearby stores</Text>
            </TouchableOpacity>
          ) : nearby.length === 0 ? (
            <Text style={styles.empty}>No stores found nearby.</Text>
          ) : (
            nearby.map((s, i) => (
              <StoreCard
                key={s._id}
                store={s}
                rank={i + 1}
                onPress={() => navigation.navigate('StoreProfile', { id: s._id })}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  hello: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  subHello: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.discount,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: colors.white, fontSize: 9, fontWeight: '800' },
  searchWrap: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  link: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm, marginBottom: spacing.md },
  empty: { color: colors.textMuted, fontStyle: 'italic', fontSize: fontSize.sm },
  dealCard: {
    width: 150,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  dealTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dealOff: { color: colors.accent, fontWeight: '800', fontSize: fontSize.xs },
  dealStore: { color: 'rgba(255,255,255,0.8)', fontSize: 10, flexShrink: 1, textAlign: 'right' },
  dealName: { color: colors.white, fontSize: fontSize.sm, fontWeight: '600', minHeight: 34 },
  dealPrice: { color: colors.white, fontSize: fontSize.md, fontWeight: '800' },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  promptText: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
});
