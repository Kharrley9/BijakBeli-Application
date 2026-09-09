// WeeklyPromotionsScreen.js
// Page 6: Weekly Promotions — store filter tabs, promo cards, view all button

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing, radius, commonStyles } from '../theme/theme';
import BottomNav from '../components/BottomNav';
import { promotionService, storeService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

export default function WeeklyPromotionsScreen({ navigation }) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All');
  const [promotions, setPromotions] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userState = user?.preferredState || 'Johor';
      const [promosRes, storesRes] = await Promise.all([
        promotionService.getActive({ state: userState }),
        storeService.getAll({ state: userState }),
      ]);

      const promosData = promosRes?.data || promosRes || [];
      setPromotions(Array.isArray(promosData) ? promosData : []);

      const storesData = storesRes?.data || storesRes || [];
      setStores(Array.isArray(storesData) ? storesData : []);
    } catch (error) {
      console.log('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filters = ['All', ...stores.map(s => s.storeName)];

  const filteredPromotions = activeFilter === 'All'
    ? promotions
    : promotions.filter(p => {
        const storeName = p.storeId?.storeName || '';
        return storeName === activeFilter;
      });

  const getPromoBadge = (promo) => {
    if (promo.discountPercentage) return `${promo.discountPercentage}% OFF`;
    if (promo.promotionType === 'buy1free1') return 'BUY 1 FREE 1';
    if (promo.promotionType === 'bundle') return 'BUNDLE DEAL';
    if (promo.promotionType === 'clearance') return 'CLEARANCE';
    return promo.promotionType?.toUpperCase() || 'PROMO';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Promotions</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Store filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
        <View style={styles.filterRow}>
          {filters.map((filter) => {
            const isActive = filter === activeFilter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {filteredPromotions.length === 0 ? (
            <Text style={styles.emptyText}>No promotions available.</Text>
          ) : (
            filteredPromotions.map((promo) => {
              const storeName = promo.storeId?.storeName || 'Store';
              const productName = promo.productId?.productName || '';
              return (
                <TouchableOpacity
                  key={promo._id}
                  style={styles.promoCard}
                  onPress={() => {
                    if (promo.productId?._id) {
                      navigation?.navigate?.('PriceComparison', { productId: promo.productId._id });
                    }
                  }}
                >
                  <View style={styles.promoIcon}>
                    <Ionicons name="basket-outline" size={28} color={colors.primary} />
                  </View>
                  <View style={styles.promoInfo}>
                    <Text style={styles.promoStore}>{storeName.toUpperCase()}</Text>
                    <View style={styles.promoBadge}>
                      <Text style={styles.promoBadgeText}>{getPromoBadge(promo)}</Text>
                    </View>
                    <Text style={styles.promoTitle}>{promo.promotionTitle}</Text>
                    <Text style={styles.promoProduct} numberOfLines={1}>{productName}</Text>
                    <View style={styles.promoFooter}>
                      <Text style={styles.promoPrice}>RM{promo.promotionPrice?.toFixed(2)}</Text>
                      {promo.endDate && (
                        <Text style={styles.promoValid}>
                          Till {new Date(promo.endDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity style={[commonStyles.primaryButton, { marginTop: spacing.md }]}>
            <Text style={commonStyles.primaryButtonText}>View All Promotions</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <BottomNav active="Home" />
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
  },
  filterScrollView: {
    maxHeight: 50,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.white,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  promoCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  promoIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoInfo: {
    flex: 1,
  },
  promoStore: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  promoBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  promoBadgeText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '700',
  },
  promoTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  promoProduct: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  promoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  promoPrice: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.primary,
  },
  promoValid: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
