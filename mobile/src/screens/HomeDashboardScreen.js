// HomeDashboardScreen.js
// Page 3: Home Dashboard — Greeting, search, preferred stores, deals, budget, quick actions

import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import UserPreferencesModal from '../components/UserPreferencesModal';
import DistanceBadge from '../components/DistanceBadge';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { storeService, promotionService, budgetService, shoppingListService, priceService } from '../services/dataService';
import { DEFAULT_MAX_NEARBY_KM } from '../constants';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';

const QUICK_ACTIONS = [
  { key: 'Search', label: 'Search', icon: 'search-outline', route: 'SearchGrocery' },
  { key: 'Nearby', label: 'Nearby', icon: 'map-outline', route: 'NearbyStores' },
  { key: 'MyList', label: 'My List', icon: 'list-outline', route: 'ShoppingList' },
  { key: 'Promotions', label: 'Promotions', icon: 'pricetags-outline', route: 'WeeklyPromotions' },
];

const STORE_IMAGES = {
  "lotus's": require('../../assets/deals/lotuss.png'),
  "mydin": require('../../assets/deals/mydin.png'),
  "econsave": require('../../assets/deals/econsave.png'),
  "tf value-mart": require('../../assets/deals/tf-value.png'),
  "aeon big": require('../../assets/deals/aeon.png'),
  "default": require('../../assets/deals/default.png'),
};

export default function HomeDashboardScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const { origin, businessOrigin } = useLocation();
  const firstName = user?.fullName?.split(' ')[0] || 'User';

  const [nearbyStores, setNearbyStores] = useState([]);
  const [stores, setStores] = useState([]);
  const [deals, setDeals] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [itemPrices, setItemPrices] = useState({});
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  const fetchData = async () => {
    // Determine if we need to show preferences modal
    if (!user?.preferredState || !user?.preferredStores || user.preferredStores.length === 0) {
      setShowPreferencesModal(true);
      setLoading(false); // Stop loading so it doesn't spin underneath
      return; // Don't fetch until preferences are set
    }

    try {
      setLoading(true);
      const userState = user?.preferredState || 'Johor';
      const [storesRes, dealsRes, budgetRes] = await Promise.allSettled([
        storeService.getAll({ state: userState }),
        promotionService.getBestDeals({ state: userState }),
        budgetService.getCurrent(),
      ]);

      if (storesRes.status === 'fulfilled') {
        let storesData = storesRes.value?.data || storesRes.value || [];
        storesData = Array.isArray(storesData) ? storesData : [];
        // Filter by preferred stores if available
        if (user?.preferredStores && user.preferredStores.length > 0) {
          storesData = storesData.filter(s => 
            user.preferredStores.some(pref => String(pref) === String(s._id))
          );
        }
        setStores(storesData);
      }

      if (dealsRes.status === 'fulfilled') {
        let dealsData = dealsRes.value?.data || dealsRes.value || [];
        dealsData = Array.isArray(dealsData) ? dealsData : [];
        // Filter deals to only show deals from preferred stores
        if (user?.preferredStores && user.preferredStores.length > 0) {
          dealsData = dealsData.filter(d => {
            const sId = d.storeId?._id || d.storeId;
            return user.preferredStores.some(pref => String(pref) === String(sId));
          });
        }
        setDeals(dealsData);
      }

      if (budgetRes.status === 'fulfilled') {
        const budgetData = budgetRes.value?.data || budgetRes.value || null;
        setBudget(budgetData);
      }

      // Fetch shopping list for estimated total
      try {
        const listsRes = await shoppingListService.getAll();
        const listsData = listsRes?.data || listsRes || [];
        const listArr = Array.isArray(listsData) ? listsData : [];
        if (listArr.length > 0) {
          const firstList = listArr[0];
          const fullListRes = await shoppingListService.getById(firstList._id);
          const fullList = fullListRes?.data || fullListRes;
          const listItems = fullList?.items || [];
          setItems(listItems);
          
          const prices = {};
          for (const item of listItems) {
            try {
              const productId = item.productId?._id || item.productId;
              const res = await priceService.compare(productId, user?.preferredStores);
              const data = res?.data || res;
              if (data?.comparisons?.length > 0) {
                const cheapest = data.comparisons[0];
                prices[item._id] = { price: cheapest.effectivePrice || cheapest.currentPrice };
              }
            } catch (e) {}
          }
          setItemPrices(prices);
        }
      } catch (error) {
        console.log('Error fetching list data for budget overview', error);
      }
    } catch (error) {
      console.log('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user?.preferredState, user?.preferredStores])
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!origin) { setNearbyStores([]); return; }
      try {
        const res = await storeService.getNearby({
          lat: origin.lat,
          lng: origin.lng,
          maxKm: DEFAULT_MAX_NEARBY_KM,
          limit: 5,
        });
        const data = res?.data || res || [];
        if (!cancelled) setNearbyStores(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setNearbyStores([]);
      }
    })();
    return () => { cancelled = true; };
  }, [origin?.lat, origin?.lng]);

  const handlePreferencesSaved = async () => {
    setShowPreferencesModal(false);
    if (refreshUser) {
      await refreshUser();
    }
  };

  const estimatedTotal = items.reduce((sum, item) => {
    const priceInfo = itemPrices[item._id];
    return sum + (priceInfo ? priceInfo.price * item.quantity : 0);
  }, 0);

  const budgetAmount = budget?.monthlyBudget || 0;
  const spentAmount = estimatedTotal; // Auto-calculated from list items
  const remainingAmount = budgetAmount - spentAmount;
  const progress = budgetAmount > 0 ? Math.min(spentAmount / budgetAmount, 1) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header Section (Green) */}
          <View style={styles.headerSection}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={styles.greeting} numberOfLines={1}>Hello, {firstName}</Text>
                <Text style={styles.subGreeting}>Let's find the best prices today!</Text>
              </View>
              <TouchableOpacity style={styles.cartIconWrap}>
                <Ionicons name="notifications-outline" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => navigation?.navigate?.('SearchGrocery')}
            >
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <Text style={styles.searchPlaceholder}>Search grocery items...</Text>
              <View style={styles.searchIconsWrap}>
                <Ionicons name="mic-outline" size={18} color={colors.textMuted} style={styles.searchIconMic} />
                <Ionicons name="scan-outline" size={18} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.contentSection}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
            ) : (
              <>
                {/* Preferred Stores */}
                <View style={styles.sectionPadding}>
                  <Text style={styles.sectionLabel}>Preferred Stores</Text>
                  <View style={styles.storesRow}>
                    {stores.length > 0 ? stores.map((store) => (
                      <TouchableOpacity key={store._id} style={styles.storeChip}>
                        <Text style={styles.storeChipText} numberOfLines={1}>{store.storeName}</Text>
                      </TouchableOpacity>
                    )) : (
                      <TouchableOpacity 
                        style={styles.selectStorePrompt}
                        onPress={() => setShowPreferencesModal(true)}
                      >
                        <Ionicons name="location-outline" size={18} color={colors.primary} />
                        <Text style={styles.selectStorePromptText}>Tap here to select your preferred stores</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Stores near you */}
                <View style={styles.sectionPadding}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={commonStyles.sectionTitle}>Stores Near You</Text>
                    <TouchableOpacity onPress={() => navigation?.navigate?.('NearbyStores')}>
                      <Text style={styles.seeAll}>See Map</Text>
                    </TouchableOpacity>
                  </View>
                  {!businessOrigin && !origin ? (
                    <TouchableOpacity
                      style={styles.selectStorePrompt}
                      onPress={() => navigation?.navigate?.('BusinessLocation')}
                    >
                      <Ionicons name="storefront-outline" size={18} color={colors.primary} />
                      <Text style={styles.selectStorePromptText}>
                        Set your business location to see the nearest stores
                      </Text>
                    </TouchableOpacity>
                  ) : nearbyStores.length === 0 ? (
                    <Text style={styles.emptyText}>No stores found nearby.</Text>
                  ) : (
                    <View style={{ marginBottom: spacing.xl }}>
                      {nearbyStores.slice(0, 4).map((s, i) => (
                        <TouchableOpacity
                          key={s._id}
                          style={styles.nearbyRow}
                          onPress={() => navigation?.navigate?.('NearbyStores')}
                        >
                          <Text style={styles.nearbyName} numberOfLines={1}>
                            {i + 1}. {s.storeName}
                          </Text>
                          <DistanceBadge
                            distanceKm={s.distanceKm}
                            durationMin={s.durationMin}
                            highlight={i === 0}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Today's Best Deals */}
                <View style={[styles.sectionHeaderRow, styles.sectionPadding]}>
                  <Text style={commonStyles.sectionTitle}>Today's Best Deals</Text>
                  <TouchableOpacity onPress={() => navigation?.navigate?.('WeeklyPromotions')}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.dealsRow}
                  contentContainerStyle={styles.dealsScrollContent}
                >
                  {deals.length > 0 ? deals.slice(0, 6).map((deal) => {
                    const storeName = deal.storeId?.storeName || deal.store || 'Store';
                    const productName = deal.productId?.productName || deal.product || '';
                    const storeKey = storeName.toLowerCase();
                    const bgImage = STORE_IMAGES[storeKey] || STORE_IMAGES['default'];

                    return (
                      <ImageBackground 
                        key={deal._id} 
                        style={styles.dealCard}
                        source={bgImage}
                        imageStyle={{ borderRadius: radius.md }}
                      >
                        <View style={styles.dealCardOverlay}>
                          <Text style={styles.dealStore}>{storeName.toUpperCase()}</Text>
                          <Text style={styles.dealTitle}>
                            {deal.discountPercentage ? `${deal.discountPercentage}% OFF` : deal.promotionType?.toUpperCase()}
                          </Text>
                          <Text style={styles.dealSubtitle}>{deal.promotionTitle || productName}</Text>
                          {deal.endDate && (
                            <Text style={styles.dealValid}>
                              Valid till {new Date(deal.endDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                            </Text>
                          )}
                        </View>
                      </ImageBackground>
                    );
                  }) : (
                    <View style={styles.dealCard}>
                      <Text style={styles.dealSubtitle}>No deals available right now</Text>
                    </View>
                  )}
                </ScrollView>

                {/* Budget Overview */}
                <View style={styles.sectionPadding}>
                  <View style={[commonStyles.card, styles.budgetCard]}>
                    <Text style={styles.budgetTitle}>Budget Overview</Text>
                    {budget ? (
                      <>
                        <View style={styles.budgetRow}>
                          <View>
                            <Text style={styles.budgetLabel}>Monthly Budget</Text>
                            <Text style={styles.budgetValue}>RM{budgetAmount.toFixed(2)}</Text>
                          </View>
                          <View style={styles.budgetRemaining}>
                            <Text style={styles.budgetLabel}>Remaining</Text>
                            <Text style={[styles.budgetValue, styles.budgetValueRemaining]}>
                              RM{remainingAmount.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                        </View>
                      </>
                    ) : (
                      <Text style={styles.emptyText}>
                        No budget set for this month. Go to My List to set one!
                      </Text>
                    )}
                  </View>

                  {/* Quick Actions */}
                  <Text style={[commonStyles.sectionTitle, styles.quickActionsTitle]}>
                    Quick Actions
                  </Text>
                  <View style={styles.quickActionsRow}>
                    {QUICK_ACTIONS.map((action) => (
                      <TouchableOpacity key={action.key} style={styles.quickAction} onPress={() => navigation.navigate(action.route)}>
                        <View style={styles.quickActionIconWrap}>
                          <Ionicons name={action.icon} size={22} color={colors.primary} />
                        </View>
                        <Text style={styles.quickActionLabel}>{action.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>

        <BottomNav active="Home" />
      </View>
      
      <UserPreferencesModal 
        visible={showPreferencesModal} 
        onClose={() => setShowPreferencesModal(false)}
        onSaveSuccess={handlePreferencesSaved}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    paddingBottom: spacing.xl,
  },

  /* Header */
  headerSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.white,
  },
  subGreeting: {
    fontSize: fontSize.sm,
    color: colors.primaryLight,
    marginTop: spacing.xs,
  },
  cartIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  searchPlaceholder: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  searchIconsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconMic: {
    marginRight: spacing.sm,
  },

  /* Content */
  contentSection: {
    paddingTop: spacing.xl,
  },
  sectionPadding: {
    paddingHorizontal: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  storesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  storeChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  storeChipText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seeAll: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  dealsRow: {
    marginBottom: spacing.xl,
  },
  dealsScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  dealCard: {
    width: 220,
    height: 140,
    borderRadius: radius.md,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  dealCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: spacing.lg,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  dealStore: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  dealTitle: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.white,
  },
  dealSubtitle: {
    fontSize: fontSize.sm,
    color: colors.white,
    marginTop: spacing.xs,
  },
  dealValid: {
    fontSize: fontSize.xs,
    color: colors.white,
    marginTop: spacing.sm,
    opacity: 0.9,
  },
  budgetCard: {
    marginBottom: spacing.xl,
  },
  budgetTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  budgetLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  budgetValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  budgetRemaining: {
    alignItems: 'flex-end',
  },
  budgetValueRemaining: {
    color: colors.primary,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  quickActionsTitle: {
    marginBottom: spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
    minHeight: 64,
  },
  quickActionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  selectStorePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  selectStorePromptText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: fontSize.sm,
    flex: 1,
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  nearbyName: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
});