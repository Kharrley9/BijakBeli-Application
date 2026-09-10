import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import { useLocation } from '../context/LocationContext';
import { productService } from '../services/dataService';
import { CatalogProduct } from '../types';
import ProductRow from './ProductRow';
import SortChips from './SortChips';
import EmptyState from './EmptyState';

type Filters = {
  priceMax: number | null;
  maxKm: number | null;
  inStockOnly: boolean;
  deliveryOnly: boolean;
};
const EMPTY: Filters = { priceMax: null, maxKm: null, inStockOnly: false, deliveryOnly: false };

export default function CatalogList({
  baseParams,
  showFilters = true,
}: {
  baseParams: { group?: string; q?: string; categoryId?: string; storeId?: string };
  showFilters?: boolean;
}) {
  const navigation = useNavigation<any>();
  const { origin, originParams } = useLocation();
  const [sort, setSort] = useState<string>('price_asc');
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [draft, setDraft] = useState<Filters>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await productService.list(
        { ...baseParams, sort: sort as any, limit: 40 },
        originParams()
      );
      setItems(res?.products || res?.data?.products || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(baseParams), sort, origin?.lat, origin?.lng]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (filters.priceMax != null && (p.lowestPrice == null || p.lowestPrice > filters.priceMax)) return false;
      if (filters.maxKm != null) {
        const d = p.nearestStore?.distanceKm;
        if (d == null || d > filters.maxKm) return false;
      }
      if (filters.deliveryOnly && !p.cheapestStore?.deliveryAvailable && !p.nearestStore?.deliveryAvailable) {
        return false;
      }
      return true;
    });
  }, [items, filters]);

  const activeCount =
    (filters.priceMax != null ? 1 : 0) +
    (filters.maxKm != null ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.deliveryOnly ? 1 : 0);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.chipsWrap}>
        <SortChips
          value={sort}
          onChange={setSort}
          onFilterPress={showFilters ? () => { setDraft(filters); setFilterOpen(true); } : undefined}
          filterCount={activeCount}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProductRow
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { id: item._id })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="basket-outline"
              title="Nothing here yet"
              body="No products match. Try clearing filters or a different search."
            />
          }
        />
      )}

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setFilterOpen(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fLabel}>Max price</Text>
            <View style={styles.optRow}>
              {[null, 10, 25, 50, 100].map((v) => (
                <TouchableOpacity
                  key={String(v)}
                  style={[styles.opt, draft.priceMax === v && styles.optActive]}
                  onPress={() => setDraft((d) => ({ ...d, priceMax: v }))}
                >
                  <Text style={[styles.optText, draft.priceMax === v && styles.optTextActive]}>
                    {v == null ? 'Any' : `RM${v}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fLabel}>Within distance</Text>
            <View style={styles.optRow}>
              {[null, 2, 5, 10, 25].map((v) => (
                <TouchableOpacity
                  key={String(v)}
                  style={[styles.opt, draft.maxKm === v && styles.optActive]}
                  onPress={() => setDraft((d) => ({ ...d, maxKm: v }))}
                >
                  <Text style={[styles.optText, draft.maxKm === v && styles.optTextActive]}>
                    {v == null ? 'Any' : `${v} km`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.fLabel}>Delivery available</Text>
              <Switch
                value={draft.deliveryOnly}
                onValueChange={(v) => setDraft((d) => ({ ...d, deliveryOnly: v }))}
                trackColor={{ true: colors.primaryLight }}
                thumbColor={draft.deliveryOnly ? colors.primary : '#f4f3f4'}
              />
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.reset} onPress={() => setDraft(EMPTY)}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[commonStyles.primaryButton, { flex: 1 }]}
                onPress={() => {
                  setFilters(draft);
                  setFilterOpen(false);
                }}
              >
                <Text style={commonStyles.primaryButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  chipsWrap: { paddingLeft: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sheetTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  fLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.md },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  opt: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  optTextActive: { color: colors.white },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  sheetActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  reset: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: { color: colors.textSecondary, fontWeight: '700' },
});
