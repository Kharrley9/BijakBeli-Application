import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { storeService } from '../services/dataService';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';

export default function AdminStoresScreen({ route, navigation }) {
  const { state } = route.params || { state: 'Johor' }; // fallback
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await storeService.getAll({ state, admin: true });
      setStores(res?.data?.data || res?.data || []);
    } catch (e) {
      console.log('Error fetching stores:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStores();
    }, [])
  );

  const toggleActive = async (store) => {
    const originalValue = store.isActive;
    const newValue = !originalValue;
    
    // Optimistic UI update
    setStores(prev => prev.map(s => 
      s._id === store._id ? { ...s, isActive: newValue } : s
    ));

    try {
      await storeService.update(store._id, { isActive: newValue });
    } catch (error) {
      // Revert if API fails
      Alert.alert('Error', 'Failed to update store status');
      setStores(prev => prev.map(s => 
        s._id === store._id ? { ...s, isActive: originalValue } : s
      ));
    }
  };

  if (loading && stores.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{state} Supermarkets</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Select a store in {state} to manage its products and pricing.</Text>
        
        {stores.length === 0 && !loading && (
          <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textMuted }}>No supermarkets found in {state}.</Text>
        )}
        
        <View style={styles.gridContainer}>
          {stores.map(store => (
            <View key={store._id} style={[commonStyles.card, styles.storeCard, !store.isActive && styles.storeCardInactive]}>
              
              {/* Edit Button */}
              <TouchableOpacity 
                style={styles.editBtn} 
                onPress={() => navigation.navigate('AddEditStore', { store, state })}
              >
                <Ionicons name="pencil" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Store Icon */}
              <TouchableOpacity 
                style={styles.cardContent}
                onPress={() => navigation.navigate('AdminProductList', { storeId: store._id, storeName: store.storeName })}
              >
                <View style={[styles.storeIconWrap, !store.isActive && { backgroundColor: colors.border }]}>
                  {store.logo ? (
                    <Ionicons name="image-outline" size={28} color={!store.isActive ? colors.textMuted : colors.primary} />
                  ) : (
                    <Ionicons name="storefront" size={28} color={!store.isActive ? colors.textMuted : colors.primary} />
                  )}
                </View>
                <View style={styles.storeDetails}>
                  <Text style={[styles.storeName, !store.isActive && styles.textInactive]} numberOfLines={2}>
                    {store.storeName}
                  </Text>
                  <Text style={[styles.storeMall, !store.isActive && styles.textInactive]} numberOfLines={1}>
                    {store.mallName || store.address}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Status Toggle Area */}
              <View style={styles.statusRow}>
                <View style={[styles.badge, store.isActive ? styles.badgeActive : styles.badgeInactive]}>
                  <Text style={styles.badgeText}>{store.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleActive(store)} style={styles.toggleBtn}>
                  <Ionicons 
                    name={store.isActive ? "toggle" : "toggle-outline"} 
                    size={28} 
                    color={store.isActive ? colors.primary : colors.textMuted} 
                  />
                </TouchableOpacity>
              </View>

            </View>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditStore', { state })}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.primary },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { color: colors.white, fontSize: fontSize.lg, fontWeight: '700' },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 3 },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.lg },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  storeCard: {
    width: '48%',
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 180,
    position: 'relative'
  },
  storeCardInactive: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0'
  },
  editBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: spacing.xs,
    zIndex: 10
  },
  cardContent: {
    alignItems: 'center',
    flex: 1,
    marginTop: spacing.md
  },
  storeIconWrap: {
    width: 48, height: 48,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  storeDetails: { alignItems: 'center', width: '100%', flex: 1 },
  storeName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: 4, textAlign: 'center' },
  storeMall: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
  textInactive: {
    color: colors.textMuted
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeActive: {
    backgroundColor: colors.primary,
  },
  badgeInactive: {
    backgroundColor: colors.textMuted,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700'
  },
  toggleBtn: {
    padding: 2
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl * 2,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
});
