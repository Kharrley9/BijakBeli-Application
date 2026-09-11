import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { orderService, merchantService } from '../services/dataService';
import { Order, OrderStoreSummary } from '../types';
import { ORDER_STATUS_LABELS } from '../constants';

const FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

const STATUS_COLOR: Record<string, string> = {
  pending: colors.accent,
  confirmed: colors.primary,
  preparing: colors.primary,
  packing: colors.primary,
  ready: colors.primary,
  on_the_way: colors.primary,
  completed: colors.primary,
  cancelled: colors.discount,
};

export default function OrdersScreen({ navigation }: any) {
  const { user } = useAuth();
  const isMerchant = user?.role === 'merchant';
  const [mode, setMode] = useState<'buyer' | 'seller'>('buyer');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res: any =
        mode === 'seller'
          ? await merchantService.listOrders({ status: filter })
          : await orderService.myOrders({ status: filter });
      setOrders(res.data || []);
    } catch (e: any) {
      if (mode === 'seller' && e?.message?.includes('registered')) {
        setOrders([]);
      } else {
        setError(e?.message || 'Could not load orders');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mode, filter]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const renderItem = ({ item }: { item: Order }) => {
    const store = item.storeId as OrderStoreSummary;
    const buyer = typeof item.userId === 'object' ? item.userId : null;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate(mode === 'seller' ? 'MerchantOrder' : 'OrderTracking', { id: item._id })
        }
      >
        <View style={styles.cardTop}>
          <Text style={styles.orderNum}>{item.orderNumber}</Text>
          <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
              {ORDER_STATUS_LABELS[item.status] || item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.cardSub} numberOfLines={1}>
          {mode === 'seller' ? buyer?.fullName || 'Buyer' : store?.storeName || 'Store'}
          {'  ·  '}
          {item.items.length} item{item.items.length > 1 ? 's' : ''} · {item.fulfilment}
        </Text>
        <View style={styles.cardBottom}>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.total}>RM{item.total.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        {isMerchant && (
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'buyer' && styles.modeTabActive]}
              onPress={() => setMode('buyer')}
            >
              <Text style={[styles.modeText, mode === 'buyer' && styles.modeTextActive]}>My Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'seller' && styles.modeTabActive]}
              onPress={() => setMode('seller')}
            >
              <Text style={[styles.modeText, mode === 'seller' && styles.modeTextActive]}>My Sales</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, filter === f.value && styles.chipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o._id}
          renderItem={renderItem}
          contentContainerStyle={orders.length ? styles.list : styles.emptyWrap}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title={mode === 'seller' ? 'No sales here yet' : 'No orders here yet'}
              body={
                mode === 'seller'
                  ? 'Orders placed at your store will show up here.'
                  : 'Order from a trader store and track it here.'
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  modeTabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: 3 },
  modeTab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  modeTabActive: { backgroundColor: colors.primary },
  modeText: { fontWeight: '700', color: colors.textSecondary, fontSize: fontSize.sm },
  modeTextActive: { color: colors.white },
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  list: { padding: spacing.lg, gap: spacing.sm },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  center: { alignItems: 'center', marginTop: spacing.xxl },
  errText: { color: colors.textSecondary },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  statusPill: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusText: { fontSize: fontSize.xs, fontWeight: '800' },
  cardSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4, textTransform: 'capitalize' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  date: { fontSize: fontSize.xs, color: colors.textMuted },
  total: { fontSize: fontSize.md, fontWeight: '800', color: colors.primary },
});
