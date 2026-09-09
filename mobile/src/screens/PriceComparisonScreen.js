// PriceComparisonScreen.js
// Page 5: Price Comparison — compare prices across stores, best price, add to list

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing, radius, commonStyles } from '../theme/theme';
import { priceService, productService, shoppingListService, userService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import OriginToggle from '../components/OriginToggle';
import DistanceBadge from '../components/DistanceBadge';

export default function PriceComparisonScreen({ navigation, route }) {
  const { user } = useAuth();
  const { origin, originParams } = useLocation();
  const productId = route?.params?.productId;
  const [product, setProduct] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPreferred, setIsPreferred] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchComparison();
      checkPreferred();
    }
  }, [productId, user, origin?.lat, origin?.lng]);

  const checkPreferred = async () => {
    if (!user?._id || !productId) return;
    try {
      const res = await userService.getPreferredProducts(user._id);
      const data = res?.data || res || [];
      const ids = data.map(p => p._id || p);
      setIsPreferred(ids.includes(productId));
    } catch(e) {
      console.log('Error checking preferred:', e);
    }
  };

  const handleTogglePreferred = async () => {
    if (!user?._id) return;
    const previous = isPreferred;
    setIsPreferred(!previous);
    try {
      await userService.togglePreferredProduct(user._id, productId);
    } catch(e) {
      setIsPreferred(previous);
      Alert.alert('Error', 'Could not update preferred status');
    }
  };

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const [productRes, priceRes] = await Promise.all([
        productService.getById(productId),
        priceService.compare(productId, user?.preferredStores, originParams()),
      ]);

      const prodData = productRes?.data || productRes;
      setProduct(prodData);

      const compData = priceRes?.data || priceRes;
      setComparison(compData);
    } catch (error) {
      console.log('Error fetching comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async () => {
    try {
      const listsRes = await shoppingListService.getAll();
      const lists = listsRes?.data || listsRes || [];
      let listId;

      if (Array.isArray(lists) && lists.length > 0) {
        listId = lists[0]._id;
      } else {
        const newList = await shoppingListService.create('My Shopping List');
        listId = newList?.data?._id || newList?._id;
      }

      await shoppingListService.addItem(listId, productId, 1);
      Alert.alert('Added!', `${product?.productName || 'Item'} added to your shopping list.`);
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not add item.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const comparisons = comparison?.comparisons || [];
  const cheapestStore = comparison?.cheapestStore;
  const nearestStore = comparison?.nearestStore;
  const lowestPrice = comparison?.lowestPrice || 0;
  const highestPrice = comparison?.highestPrice || 0;
  const savings = comparison?.savings || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product?.productName || 'Product'}
        </Text>
        <TouchableOpacity onPress={handleTogglePreferred}>
          <Ionicons 
            name={isPreferred ? "heart" : "heart-outline"} 
            size={22} 
            color={isPreferred ? colors.primary : colors.text} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Product image + name */}
        <View style={styles.productImage}>
          <Ionicons name="image-outline" size={40} color={colors.textMuted} />
        </View>
        <Text style={styles.productName}>{product?.productName || ''}</Text>
        <Text style={styles.productSubtitle}>
          {product?.brandId?.brandName || ''} · {product?.unit || ''}
        </Text>

        {/* Origin selector for travel distance */}
        <OriginToggle />

        {/* Price Comparison */}
        <Text style={styles.sectionTitle}>Price Comparison</Text>

        {comparisons.length === 0 ? (
          <Text style={styles.emptyText}>No price data available for this product.</Text>
        ) : (
          comparisons.map((comp, index) => (
            <View
              key={comp.store._id}
              style={[styles.storeRow, comp.isLowestPrice && styles.storeRowBest]}
            >
              <View style={styles.storeInfo}>
                <View style={styles.storeNameRow}>
                  <Text style={styles.storeName}>{comp.store.storeName}</Text>
                  {comp.isLowestPrice && (
                    <View style={styles.bestBadge}>
                      <Text style={styles.bestBadgeText}>BEST</Text>
                    </View>
                  )}
                  {comp.isNearest && (
                    <View style={[styles.bestBadge, styles.nearBadge]}>
                      <Text style={styles.bestBadgeText}>NEAR</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.storeNote}>
                  {comp.store.mallName || ''}
                </Text>
                {comp.store.distanceKm != null && (
                  <DistanceBadge
                    distanceKm={comp.store.distanceKm}
                    durationMin={comp.store.durationMin}
                    highlight={comp.isNearest}
                    style={{ marginTop: 4 }}
                  />
                )}
              </View>
              <View style={styles.storePriceInfo}>
                {comp.hasPromotion && comp.promotion ? (
                  <View style={[styles.badge, { backgroundColor: colors.discount }]}>
                    <Text style={styles.badgeText}>
                      {comp.promotion.discountPercentage}% OFF
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: colors.textMuted }]}>
                    <Text style={styles.badgeText}>No Promo</Text>
                  </View>
                )}
                <View style={styles.priceRow}>
                  {comp.previousPrice && comp.previousPrice !== comp.currentPrice && (
                    <Text style={styles.oldPrice}>RM{comp.previousPrice.toFixed(2)}</Text>
                  )}
                  <Text style={styles.price}>RM{comp.effectivePrice.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Best price banner */}
        {cheapestStore && (
          <View style={styles.bestPriceBanner}>
            <Ionicons name="trophy" size={18} color={colors.white} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text style={styles.bestPriceTitle}>
                BEST PRICE: RM{lowestPrice.toFixed(2)} at {cheapestStore.storeName}
              </Text>
              <Text style={styles.bestPriceSubtitle}>
                You save up to RM{savings.toFixed(2)}!
                {cheapestStore.distanceKm != null
                  ? `  ·  ${cheapestStore.distanceKm} km away`
                  : ''}
              </Text>
            </View>
          </View>
        )}

        {/* Nearest store banner */}
        {nearestStore && (!cheapestStore || nearestStore._id !== cheapestStore._id) && (
          <View style={[styles.bestPriceBanner, styles.nearestBanner]}>
            <Ionicons name="location" size={18} color={colors.white} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text style={styles.bestPriceTitle}>
                NEAREST: {nearestStore.storeName}
                {nearestStore.distanceKm != null ? ` · ${nearestStore.distanceKm} km` : ''}
              </Text>
              <Text style={styles.bestPriceSubtitle}>
                Shorter trip — compare against the cheapest price above.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[commonStyles.primaryButton, styles.actionButton]}
          onPress={handleAddToList}
        >
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={commonStyles.primaryButtonText}>Add to List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.alertButton]}>
          <Ionicons name="notifications-outline" size={18} color={colors.primary} />
          <Text style={styles.alertButtonText}>Set Alert</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  productImage: {
    width: '100%',
    height: 140,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  productName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  productSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  storeRowBest: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  storeInfo: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  storeName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  bestBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
  },
  nearBadge: {
    backgroundColor: colors.accent,
  },
  nearestBanner: {
    backgroundColor: colors.primaryDark,
    marginTop: spacing.sm,
  },
  bestBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
  },
  storeNote: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  storePriceInfo: {
    alignItems: 'flex-end',
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  oldPrice: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.text,
  },
  bestPriceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bestPrice,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  bestPriceTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  bestPriceSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  alertButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
  },
  alertButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
