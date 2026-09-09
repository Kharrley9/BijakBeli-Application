// ShoppingListScreen.js
// Page 7: Shopping List & Budget — budget summary, item list with checkboxes/qty, compare total

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, TextInput, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fontSize, spacing, radius, commonStyles } from '../theme/theme';
import BottomNav from '../components/BottomNav';
import { shoppingListService, budgetService, priceService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

export default function ShoppingListScreen({ navigation }) {
  const { user } = useAuth();
  const { originParams } = useLocation();
  const [lists, setLists] = useState([]);
  const [activeList, setActiveList] = useState(null);
  const [items, setItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [itemPrices, setItemPrices] = useState({});
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareResult, setCompareResult] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [modalMode, setModalMode] = useState('budget'); // 'budget' or 'spent'
  const [budgetInput, setBudgetInput] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [listsRes, budgetRes] = await Promise.all([
        shoppingListService.getAll(),
        budgetService.getCurrent(),
      ]);

      const listsData = listsRes?.data || listsRes || [];
      const listArr = Array.isArray(listsData) ? listsData : [];
      setLists(listArr);

      if (listArr.length > 0) {
        const firstList = listArr[0];
        setActiveList(firstList);
        // Fetch full list with items
        const fullListRes = await shoppingListService.getById(firstList._id);
        const fullList = fullListRes?.data || fullListRes;
        const listItems = fullList?.items || [];
        setItems(listItems);

        // Initialize checked state (all checked by default)
        const checked = {};
        listItems.forEach(item => { checked[item._id] = true; });
        setCheckedItems(checked);

        // Fetch prices for items
        await fetchItemPrices(listItems);
      }

      const budgetData = budgetRes?.data || budgetRes || null;
      setBudget(budgetData);
    } catch (error) {
      console.log('Error fetching shopping list data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemPrices = async (listItems) => {
    const prices = {};
    for (const item of listItems) {
      try {
        const productId = item.productId?._id || item.productId;
        const res = await priceService.compare(productId, user?.preferredStores);
        const data = res?.data || res;
        if (data?.comparisons?.length > 0) {
          const cheapest = data.comparisons[0]; // Already sorted cheapest first
          prices[item._id] = {
            price: cheapest.effectivePrice || cheapest.currentPrice,
            store: cheapest.store?.storeName || 'Store',
          };
        }
      } catch (e) {}
    }
    setItemPrices(prices);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const toggleItem = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const changeQty = async (item, delta) => {
    const newQty = Math.max(1, item.quantity + delta);
    try {
      await shoppingListService.updateItem(activeList._id, item._id, newQty);
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, quantity: newQty } : i));
    } catch (error) {
      console.log('Error updating quantity:', error);
    }
  };

  const removeItem = async (item) => {
    try {
      await shoppingListService.removeItem(activeList._id, item._id);
      setItems(prev => prev.filter(i => i._id !== item._id));
    } catch (error) {
      Alert.alert('Error', 'Could not remove item.');
    }
  };

  const clearAllItems = async () => {
    if (!activeList || items.length === 0) return;
    Alert.alert(
      'Clear List',
      'Are you sure you want to remove all items from your list?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive', 
          onPress: async () => {
            try {
              setLoading(true);
              for (const item of items) {
                await shoppingListService.removeItem(activeList._id, item._id);
              }
              setItems([]);
            } catch (error) {
              Alert.alert('Error', 'Could not clear list.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCompareTotal = async () => {
    if (!activeList) return;
    try {
      const res = await shoppingListService.compareStores(activeList._id, originParams());
      const data = res?.data || res;
      setCompareResult(data);

      if (data?.cheapestStore?.store) {
        const cheap = data.cheapestStore;
        const near = data.nearestStore;
        let msg = `Cheapest total: ${cheap.store.storeName} — RM${cheap.total?.toFixed(2)}\nYou can save: RM${data.estimatedSaving?.toFixed(2) || '0.00'}`;
        if (near && near.store && near.store._id !== cheap.store._id) {
          msg += `\n\nNearest store: ${near.store.storeName}`;
          if (near.store.distanceKm != null) msg += ` (${near.store.distanceKm} km)`;
          msg += ` — RM${near.total?.toFixed(2)} total`;
        }
        Alert.alert('Store Comparison', msg);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not compare stores.');
    }
  };

  const handleSaveBudget = async () => {
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    try {
      const now = new Date();
      if (modalMode === 'budget') {
        const res = await budgetService.setCurrent({
          monthlyBudget: amount,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        });
        setBudget(res?.data || res);
      } else if (modalMode === 'spent') {
        const currentSpent = budget?.spentAmount || 0;
        const diff = amount - currentSpent;
        const res = await budgetService.addExpense({
          amount: diff,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        });
        setBudget(res?.data || res);
      }
      setShowBudgetModal(false);
      setBudgetInput('');
    } catch (error) {
      Alert.alert('Error', 'Could not save budget data.');
    }
  };

  // Calculate estimated total from checked items
  const estimatedTotal = items
    .filter((item) => checkedItems[item._id])
    .reduce((sum, item) => {
      const priceInfo = itemPrices[item._id];
      return sum + (priceInfo ? priceInfo.price * item.quantity : 0);
    }, 0);

  const budgetAmount = budget?.monthlyBudget || 0;
  const spentAmount = estimatedTotal; // Auto-calculated from checked items
  const remainingAmount = budgetAmount - spentAmount;
  const progress = budgetAmount > 0 ? Math.min(spentAmount / budgetAmount, 1) : 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
        <BottomNav active="Budget" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My List</Text>
          <View style={{ width: 24 }} /> {/* Spacer to center title */}
        </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Budget summary card */}
        <View style={[commonStyles.card, styles.budgetCard]}>
          {budget ? (
            <>
              <View style={styles.budgetRow}>
                <TouchableOpacity 
                  onPress={() => { setModalMode('budget'); setBudgetInput(budgetAmount.toString()); setShowBudgetModal(true); }}
                >
                  <Text style={styles.budgetLabel}>Budget <Ionicons name="pencil" size={12} /></Text>
                  <Text style={styles.budgetValue}>RM{budgetAmount.toFixed(2)}</Text>
                </TouchableOpacity>
                <View>
                  <Text style={styles.budgetLabel}>Spent</Text>
                  <Text style={styles.budgetValue}>RM{spentAmount.toFixed(2)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.budgetLabel}>Remaining</Text>
                  <Text style={[styles.budgetValue, { color: colors.primary }]}>
                    RM{remainingAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            </>
          ) : (
            <TouchableOpacity onPress={() => setShowBudgetModal(true)} style={styles.setBudgetButton}>
              <Ionicons name="wallet-outline" size={20} color={colors.primary} />
              <Text style={styles.setBudgetText}>Set Monthly Budget</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Items */}
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Your shopping list is empty.</Text>
            <Text style={styles.emptySubtext}>Search for products to add items.</Text>
            <TouchableOpacity
              style={[commonStyles.primaryButton, { marginTop: spacing.lg, paddingHorizontal: spacing.xl }]}
              onPress={() => navigation?.navigate?.('SearchGrocery')}
            >
              <Text style={commonStyles.primaryButtonText}>Search Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {items.map((item) => {
              const product = item.productId || {};
              const productName = product.productName || 'Product';
              const priceInfo = itemPrices[item._id];
              const storeName = priceInfo?.store || '';
              const price = priceInfo?.price || 0;

              const renderRightActions = (progress, dragX) => {
                const trans = dragX.interpolate({
                  inputRange: [-80, 0],
                  outputRange: [1, 0],
                  extrapolate: 'clamp',
                });
                return (
                  <TouchableOpacity
                    style={styles.swipeDeleteButton}
                    onPress={() => {
                      Alert.alert(
                        'Remove Item',
                        `Remove ${productName} from your list?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => removeItem(item) }
                        ]
                      );
                    }}
                  >
                    <Animated.View style={{ transform: [{ scale: trans }] }}>
                      <Ionicons name="trash" size={24} color={colors.white} />
                    </Animated.View>
                  </TouchableOpacity>
                );
              };

              return (
                <Swipeable key={item._id} renderRightActions={renderRightActions} overshootRight={false}>
                  <View style={styles.itemRow}>
                    <TouchableOpacity onPress={() => toggleItem(item._id)} style={styles.checkbox}>
                      <Ionicons
                        name={checkedItems[item._id] ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={checkedItems[item._id] ? colors.primary : colors.textMuted}
                      />
                    </TouchableOpacity>

                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>{productName}</Text>
                      <Text style={styles.itemStore}>{storeName}</Text>
                    </View>

                    <View style={styles.itemRight}>
                      <Text style={styles.itemPrice}>RM{(price * item.quantity).toFixed(2)}</Text>
                      <View style={styles.qtyControls}>
                        <TouchableOpacity
                          style={styles.qtyButton}
                          onPress={() => changeQty(item, -1)}
                        >
                          <Ionicons name="remove" size={14} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyButton}
                          onPress={() => changeQty(item, 1)}
                        >
                          <Ionicons name="add" size={14} color={colors.text} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Swipeable>
              );
            })}

            {/* Estimated Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Estimated Total:</Text>
              <Text style={styles.totalValue}>RM{estimatedTotal.toFixed(2)}</Text>
            </View>

            {/* Store comparison result: cheapest vs nearest */}
            {compareResult?.cheapestStore?.store && (
              <View style={styles.compareCard}>
                <View style={styles.compareCol}>
                  <View style={styles.compareTag}>
                    <Ionicons name="pricetag" size={12} color={colors.white} />
                    <Text style={styles.compareTagText}>CHEAPEST</Text>
                  </View>
                  <Text style={styles.compareStore} numberOfLines={1}>
                    {compareResult.cheapestStore.store.storeName}
                  </Text>
                  <Text style={styles.compareTotal}>
                    RM{compareResult.cheapestStore.total?.toFixed(2)}
                  </Text>
                  {compareResult.cheapestStore.store.distanceKm != null && (
                    <Text style={styles.compareMeta}>
                      {compareResult.cheapestStore.store.distanceKm} km
                    </Text>
                  )}
                </View>
                <View style={styles.compareDivider} />
                <View style={styles.compareCol}>
                  <View style={[styles.compareTag, styles.compareTagNear]}>
                    <Ionicons name="location" size={12} color={colors.white} />
                    <Text style={styles.compareTagText}>NEAREST</Text>
                  </View>
                  <Text style={styles.compareStore} numberOfLines={1}>
                    {(compareResult.nearestStore?.store || compareResult.cheapestStore.store).storeName}
                  </Text>
                  <Text style={styles.compareTotal}>
                    RM{(compareResult.nearestStore || compareResult.cheapestStore).total?.toFixed(2)}
                  </Text>
                  {(compareResult.nearestStore?.store || compareResult.cheapestStore.store).distanceKm != null && (
                    <Text style={styles.compareMeta}>
                      {(compareResult.nearestStore?.store || compareResult.cheapestStore.store).distanceKm} km
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Compare Total & Clear All Buttons */}
            <View style={styles.listActionsRow}>
              <TouchableOpacity
                style={[commonStyles.primaryButton, { flex: 1 }]}
                onPress={handleCompareTotal}
              >
                <Text style={commonStyles.primaryButtonText}>Compare Total</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={clearAllItems}
              >
                <Ionicons name="trash-outline" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Budget Modal */}
      <Modal visible={showBudgetModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Monthly Budget</Text>
            <Text style={styles.modalSubtitle}>Enter your grocery budget for this month</Text>
            <View style={styles.modalInputWrap}>
              <Text style={styles.modalCurrency}>RM</Text>
              <TextInput
                style={styles.modalInput}
                value={budgetInput}
                onChangeText={setBudgetInput}
                keyboardType="numeric"
                placeholder="300.00"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowBudgetModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[commonStyles.primaryButton, styles.modalConfirm]}
                onPress={handleSaveBudget}
              >
                <Text style={commonStyles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNav active="Budget" />
    </SafeAreaView>
    </GestureHandlerRootView>
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
  editText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  budgetCard: {
    marginBottom: spacing.lg,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  budgetLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  budgetValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
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
  setBudgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  setBudgetText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
    minHeight: 64,
    backgroundColor: colors.white,
  },
  checkbox: {
    paddingRight: spacing.xs,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  itemStore: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  itemPrice: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  qtyButton: {
    padding: 2,
  },
  qtyText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.primary,
  },
  compareCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  compareCol: { flex: 1, alignItems: 'center', gap: 2 },
  compareDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  compareTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: 2,
  },
  compareTagNear: { backgroundColor: colors.primaryDark },
  compareTagText: { fontSize: 9, fontWeight: '800', color: colors.white },
  compareStore: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  compareTotal: { fontSize: fontSize.md, fontWeight: '800', color: colors.primary },
  compareMeta: { fontSize: fontSize.xs, color: colors.textMuted },
  removeButton: {
    paddingLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteButton: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  listActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  clearAllButton: {
    backgroundColor: '#FF3B30',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
    minHeight: 56,
  },
  modalCurrency: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginRight: spacing.sm,
  },
  modalInput: {
    fontSize: fontSize.xl,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 120,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalConfirm: {
    flex: 1,
  },
});
