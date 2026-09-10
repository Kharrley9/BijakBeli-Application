import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import RatingStars from '../components/RatingStars';
import { categoryLabel } from '../constants';
import { merchantService } from '../services/dataService';
import { MerchantStore } from '../types';

export default function MerchantDashboardScreen({ navigation }: any) {
  const [store, setStore] = useState<MerchantStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res: any = await merchantService.getMyStore();
      setStore(res.data);
    } catch (e: any) {
      setError(e?.message || 'Could not load your store');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const stats = store?.stats;

  const actions = [
    { icon: 'add-circle-outline', label: 'Add Product', to: () => navigation.navigate('AddEditProduct', {}) },
    { icon: 'cube-outline', label: 'Manage Products', to: () => navigation.navigate('ProductManagement') },
    { icon: 'pricetag-outline', label: 'Promotions', to: () => navigation.navigate('StorePromotions') },
    { icon: 'create-outline', label: 'Edit Store', to: () => navigation.navigate('EditStore') },
  ];

  return (
    <View style={styles.safe}>
      <AppHeader
        title="My Store"
        back={false}
        rightIcon="storefront-outline"
        onRightPress={() => store && navigation.navigate('StoreProfile', { id: store._id })}
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.err}>{error}</Text>
          <TouchableOpacity onPress={load}>
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
        >
          <View style={styles.storeCard}>
            <View style={styles.storeTop}>
              <View style={styles.logo}>
                <Ionicons name="storefront" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.storeName}>{store?.storeName}</Text>
                <Text style={styles.storeMeta}>
                  {categoryLabel(store?.storeCategory)} · {store?.city}
                </Text>
                <RatingStars rating={store?.rating || 0} count={store?.reviewCount || 0} size={13} />
              </View>
              <View style={styles.liveBadge}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          </View>

          <View style={styles.statGrid}>
            <Stat label="Products" value={stats?.productCount ?? 0} icon="cube-outline" />
            <Stat label="Promotions" value={stats?.activePromoCount ?? 0} icon="pricetag-outline" />
            <Stat label="Profile views" value={stats?.views ?? 0} icon="eye-outline" />
            <Stat
              label="Rating"
              value={stats?.rating ? stats.rating.toFixed(1) : '—'}
              icon="star-outline"
            />
          </View>

          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.actionGrid}>
            {actions.map((a) => (
              <TouchableOpacity key={a.label} style={styles.action} onPress={a.to}>
                <Ionicons name={a.icon as any} size={24} color={colors.primary} />
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.deliveryCard}>
            <Ionicons
              name={store?.deliveryAvailable ? 'bicycle' : 'walk-outline'}
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.deliveryText}>
              {store?.deliveryAvailable
                ? `Delivery on · RM${store?.deliveryFee?.toFixed(2)} flat`
                : 'Delivery off'}
              {store?.pickupAvailable ? ' · Pickup on' : ''}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ label, value, icon }: { label: string; value: React.ReactNode; icon: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon as any} size={18} color={colors.textMuted} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm },
  err: { color: colors.textSecondary },
  retry: { color: colors.primary, fontWeight: '700' },
  storeCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  storeTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  storeMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginVertical: 2 },
  liveBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  liveText: { color: colors.primaryDark, fontWeight: '800', fontSize: 10 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  stat: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  statValue: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  action: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  deliveryText: { fontSize: fontSize.sm, color: colors.textSecondary },
});
