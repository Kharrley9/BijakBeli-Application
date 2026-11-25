import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { productService } from '../services/dataService';
import AppHeader from '../components/AppHeader';
import SearchBar from '../components/SearchBar';
import { prettyName } from '../utils/format';

type Item = { _id: string; productName: string; unit: string; categoryId?: { categoryName?: string } | string };

/**
 * A scanned store barcode that is not linked to any item yet (or that the buyer says
 * is linked to the wrong one). The buyer picks the item once; the server stores the
 * link, and from then on everyone's scan of this barcode opens that item's prices.
 */
export default function LinkBarcodeScreen({ route, navigation }: any) {
  const { code, kind, currentProductId } = route.params || {};
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search as the buyer types (debounced); no location, so every priced item is listed.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res: any = await productService.list({ q: q.trim() || undefined, limit: 50, sort: 'price_asc' });
        if (!cancelled) setItems(res?.products || res?.data?.products || []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  const link = (item: Item) => {
    Alert.alert('Link this barcode?', `${item.productName} (${item.unit})`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Link',
        onPress: async () => {
          setSaving(true);
          try {
            await productService.linkBarcode(code, item._id);
            navigation.replace('PriceComparison', {
              productId: item._id,
              productName: item.productName,
              unit: item.unit,
              sort: 'price',
              linkedBarcode: { code, kind },
            });
          } catch (e: any) {
            setSaving(false);
            Alert.alert('Could not link', e?.message || 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.safe}>
      <AppHeader title={currentProductId ? 'Change item' : 'New barcode'} />
      <View style={styles.intro}>
        <View style={styles.codeRow}>
          <Ionicons name="barcode-outline" size={22} color={colors.primaryDark} />
          <Text style={styles.code} numberOfLines={1}>{code}</Text>
        </View>
        <Text style={styles.introText}>
          {currentProductId
            ? 'Pick the item this barcode really belongs to.'
            : "This barcode isn't in BijakBeli yet. Pick the item it belongs to — after that, anyone who scans it sees the prices straight away."}
        </Text>
        {kind === 'weighed' && (
          <Text style={styles.note}>
            Store scale label: only the item part is saved, so other packs with a different weight or price still match.
          </Text>
        )}
      </View>

      <SearchBar value={q} onChangeText={setQ} placeholder="Search item, e.g. tomato, ayam" style={styles.search} />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p._id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const current = item._id === currentProductId;
            const category = typeof item.categoryId === 'object' ? item.categoryId?.categoryName : undefined;
            return (
              <TouchableOpacity
                style={[styles.row, current && styles.rowCurrent]}
                onPress={() => link(item)}
                disabled={saving}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={2}>{prettyName(item.productName)}</Text>
                  <Text style={styles.sub}>{[item.unit, category].filter(Boolean).join(' · ')}</Text>
                </View>
                {current ? (
                  <Text style={styles.currentTag}>linked now</Text>
                ) : (
                  <Ionicons name="link-outline" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No item matches "{q}".</Text>}
        />
      )}
      {saving && (
        <View style={styles.saving}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  intro: { padding: spacing.lg, backgroundColor: colors.primaryLight },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  code: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, letterSpacing: 1, flex: 1 },
  introText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 19 },
  note: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
  search: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowCurrent: { backgroundColor: colors.primaryLight, borderRadius: radius.sm, paddingHorizontal: spacing.sm },
  name: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  sub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  currentTag: { fontSize: fontSize.xs, fontWeight: '800', color: colors.primaryDark },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  saving: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
