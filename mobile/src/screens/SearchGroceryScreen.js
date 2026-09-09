// SearchGroceryScreen.js
// Page 4: Compare Page — compare multiple stores with a multi-column table, Categories

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontSize, spacing, radius } from '../theme/theme';
import { productService, categoryService, priceService, shoppingListService, userService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import DistanceBadge from '../components/DistanceBadge';

const CATEGORY_ICONS = {
  'Preferred Products': 'heart-outline',
  'All Products': 'grid-outline',
  'Rice & Grains': 'restaurant-outline',
  'Cooking Oil': 'flask-outline',
  'Dairy & Eggs': 'cafe-outline',
  'Beverages': 'beer-outline',
  'Bread & Bakery': 'pizza-outline',
  'Noodles & Pasta': 'fast-food-outline',
  'Sugar & Flour': 'cube-outline',
  'Snacks & Biscuits': 'nutrition-outline',
  'Canned Food': 'archive-outline',
  'Sauces & Condiments': 'color-fill-outline',
  'Personal Care': 'body-outline',
  'Household': 'home-outline',
  'Frozen Food': 'snow-outline',
  'Fruits & Vegetables': 'leaf-outline',
  'Meat & Seafood': 'fish-outline',
  'Baby Products': 'happy-outline',
};

export default function SearchGroceryScreen({ navigation }) {
  const { user } = useAuth();
  const { origin, originParams } = useLocation();
  const [nearestStoreId, setNearestStoreId] = useState(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [tableStores, setTableStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Preferred Products');
  const [preferredProductIds, setPreferredProductIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef(null);

  // Load initial data
  useEffect(() => {
    loadCategories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPreferredProducts();
    }, [user?._id])
  );

  const loadCategories = async () => {
    try {
      const res = await categoryService.getAll();
      const data = res?.data || res || [];
      const cats = Array.isArray(data) ? data : [];
      // We prepend 'Preferred Products' and 'All Products'
      setCategories([
        { _id: 'preferred', categoryName: 'Preferred Products' },
        { _id: 'all', categoryName: 'All Products' },
        ...cats
      ]);
    } catch (e) {
      console.log('Error loading categories:', e);
    }
  };

  const loadPreferredProducts = async () => {
    if (!user?._id) return;
    try {
      const res = await userService.getPreferredProducts(user._id);
      const data = res?.data || res || [];
      const ids = data.map(p => p._id || p);
      setPreferredProductIds(ids);
    } catch (e) {
      console.log('Error loading preferred products:', e);
    }
  };

  const fetchCompareResults = useCallback(async () => {
    const storeIds = user?.preferredStores || [];
    if (storeIds.length === 0) {
      setResults([]);
      setTableStores([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = {};
      if (debouncedQuery.trim()) {
        params.q = debouncedQuery.trim();
      } else if (activeCategory === 'Preferred Products') {
        if (preferredProductIds.length === 0) {
          setResults([]);
          setTableStores([]);
          setLoading(false);
          return;
        }
        params.preferred_ids = preferredProductIds.join(',');
      } else if (activeCategory !== 'All Products') {
        const cat = categories.find(c => c.categoryName === activeCategory);
        if (cat && cat._id !== 'all' && cat._id !== 'preferred') {
          params.categoryId = cat._id;
        }
      }

      const op = originParams();
      if (op.lat != null) { params.lat = op.lat; params.lng = op.lng; }

      const res = await productService.compareStores(storeIds, params);
      const data = res?.data || res;
      setTableStores(data.stores || []);
      setResults(data.products || []);
      setNearestStoreId(data.nearestStoreId || null);
    } catch (error) {
      console.log('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, activeCategory, preferredProductIds, user, categories, origin?.lat, origin?.lng]);

  useEffect(() => {
    if (categories.length > 0) {
      fetchCompareResults();
    }
  }, [fetchCompareResults]);

  const handleQueryChange = (text) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedQuery(text);
    }, 400);
  };

  const handleCategoryPress = (catName) => {
    setActiveCategory(catName);
    setQuery('');
    setDebouncedQuery('');
  };

  const togglePreferred = async (productId) => {
    if (!user?._id) return;
    const isCurrentlyPreferred = preferredProductIds.includes(productId);
    
    // Optimistic update
    if (isCurrentlyPreferred) {
      setPreferredProductIds(prev => prev.filter(id => id !== productId));
    } else {
      setPreferredProductIds(prev => [...prev, productId]);
    }

    try {
      await userService.togglePreferredProduct(user._id, productId);
    } catch (error) {
      // Revert on error
      Alert.alert('Error', 'Could not update preferred status');
      if (isCurrentlyPreferred) {
        setPreferredProductIds(prev => [...prev, productId]);
      } else {
        setPreferredProductIds(prev => prev.filter(id => id !== productId));
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Compare Prices</Text>
      </View>

      {/* Search input */}
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search products to compare..."
            placeholderTextColor={colors.textMuted}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleQueryChange('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      {!debouncedQuery && (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.categoryName;
              return (
                <TouchableOpacity
                  key={cat._id}
                  style={[styles.categoryItem, isActive && styles.categoryItemActive]}
                  onPress={() => handleCategoryPress(cat.categoryName)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.categoryIconWrap, isActive && styles.categoryIconWrapActive]}>
                    <Ionicons
                      name={CATEGORY_ICONS[cat.categoryName] || 'grid-outline'}
                      size={20}
                      color={isActive ? colors.white : colors.primary}
                    />
                  </View>
                  <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]} numberOfLines={1}>
                    {cat.categoryName}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      )}

      {/* Loading */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView style={styles.tableScroll} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          
          {/* Missing Preferred Stores State */}
          {(!user?.preferredStores || user.preferredStores.length === 0) ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Please select preferred stores in your profile to compare prices.</Text>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="basket-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>
                {debouncedQuery 
                  ? `No products found for "${debouncedQuery}"` 
                  : activeCategory === 'Preferred Products' 
                    ? "You haven't marked any products as preferred yet. Tap the heart icon on any product to add it here!"
                    : `No products in ${activeCategory}`}
              </Text>
            </View>
          ) : (
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <View style={[styles.tableCol, styles.tableColProduct, { justifyContent: 'flex-start' }]}>
                  <Text style={styles.tableHeaderText}>Product</Text>
                </View>
                {tableStores.map(store => (
                  <View key={store._id} style={styles.tableCol}>
                    <Text style={styles.tableHeaderStoreText} numberOfLines={2} adjustsFontSizeToFit>
                      {store.storeName}
                      {nearestStoreId === store._id ? ' 📍' : ''}
                    </Text>
                    {store.distanceKm != null && (
                      <DistanceBadge
                        distanceKm={store.distanceKm}
                        durationMin={store.durationMin}
                        highlight={nearestStoreId === store._id}
                        compact
                        style={{ marginTop: 2, alignSelf: 'center' }}
                      />
                    )}
                  </View>
                ))}
              </View>

              {/* Table Rows */}
              {results.map((item) => {
                const product = item.product;
                const isPreferred = preferredProductIds.includes(product._id);

                return (
                  <View key={product._id} style={styles.tableRow}>
                    <View style={[styles.tableCol, styles.tableColProduct]}>
                      <TouchableOpacity onPress={() => navigation?.navigate?.('PriceComparison', { productId: product._id })}>
                         <Text style={styles.productName} numberOfLines={2}>{product.productName}</Text>
                         {product.brandId?.brandName && (
                           <Text style={styles.productBrand} numberOfLines={1}>{product.brandId.brandName}</Text>
                         )}
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.heartButton} onPress={() => togglePreferred(product._id)}>
                        <Ionicons 
                          name={isPreferred ? "heart" : "heart-outline"} 
                          size={20} 
                          color={isPreferred ? colors.primary : colors.textMuted} 
                        />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Prices */}
                    {tableStores.map(store => {
                      const priceData = item.prices[store._id];
                      const isCheapest = item.cheapestStoreId === store._id && priceData;
                      
                      return (
                        <View key={store._id} style={[styles.tableCol, isCheapest && styles.cheapestCell]}>
                          {priceData ? (
                            <Text style={[styles.priceText, isCheapest && styles.cheapestText]} adjustsFontSizeToFit numberOfLines={1}>
                              RM{priceData.price.toFixed(2)}
                            </Text>
                          ) : (
                            <Text style={styles.naText}>N/A</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  categoriesRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  categoryItem: {
    alignItems: 'center',
    width: 72,
    flexShrink: 0,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  categoryIconWrapActive: {
    backgroundColor: colors.primary,
  },
  categoryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryLabelActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  tableScroll: {
    flex: 1,
  },
  tableContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  tableHeaderText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tableHeaderStoreText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 60,
  },
  tableCol: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  tableColProduct: {
    flex: 2,
    alignItems: 'flex-start',
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  productName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  productBrand: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  heartButton: {
    marginTop: spacing.xs,
    padding: 2,
  },
  priceText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  naText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  cheapestCell: {
    backgroundColor: '#E8F5E9',
  },
  cheapestText: {
    color: colors.primary,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
});
