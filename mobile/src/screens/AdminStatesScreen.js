import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { storeService } from '../services/dataService';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';

const MALAYSIA_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 
  'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 
  'Sarawak', 'Selangor', 'Terengganu', 'W.P. Kuala Lumpur', 
  'W.P. Labuan', 'W.P. Putrajaya'
];

export default function AdminStatesScreen({ navigation }) {
  const [storeCounts, setStoreCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await storeService.getAll();
      const stores = res?.data?.data || res?.data || [];
      
      const counts = {};
      MALAYSIA_STATES.forEach(s => counts[s] = 0);
      stores.forEach(store => {
        if (store.state && counts[store.state] !== undefined) {
          counts[store.state] += 1;
        }
      });
      setStoreCounts(counts);
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

  if (loading && Object.keys(storeCounts).length === 0) {
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
        <Text style={styles.headerTitle}>Select State</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Select a state to manage its supermarkets and products.</Text>
        
        <View style={styles.gridContainer}>
          {MALAYSIA_STATES.map(state => {
            const count = storeCounts[state] || 0;
            return (
              <TouchableOpacity 
                key={state} 
                style={[
                  commonStyles.card, 
                  styles.stateCard,
                  state === 'Johor' && styles.stateCardHighlighted
                ]}
                onPress={() => navigation.navigate('AdminStores', { state })}
              >
                <View style={[styles.stateIconWrap, state === 'Johor' && styles.stateIconWrapHighlighted]}>
                  <Ionicons name="map" size={24} color={state === 'Johor' ? colors.white : colors.primary} />
                </View>
                <View style={styles.stateDetails}>
                  <Text style={styles.stateName} numberOfLines={1}>{state}</Text>
                  <Text style={styles.storeCount}>
                    {count} {count === 1 ? 'Store' : 'Stores'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.primary },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { color: colors.white, fontSize: fontSize.lg, fontWeight: '700' },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.lg },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stateCard: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 120,
  },
  stateIconWrap: {
    width: 48, height: 48,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  stateDetails: { alignItems: 'center', width: '100%' },
  stateName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: 2, textAlign: 'center' },
  storeCount: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
  stateCardHighlighted: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#F0F9FF',
  },
  stateIconWrapHighlighted: {
    backgroundColor: colors.primary,
  }
});
