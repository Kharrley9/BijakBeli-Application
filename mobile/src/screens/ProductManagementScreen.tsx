import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import { merchantService } from '../services/dataService';
import { MerchantProduct } from '../types';

export default function ProductManagementScreen({ navigation }: any) {
  const [items, setItems] = useState<MerchantProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [quick, setQuick] = useState<MerchantProduct | null>(null);
  const [qPrice, setQPrice] = useState('');
  const [qStock, setQStock] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res: any = await merchantService.listProducts();
      setItems(res.data || []);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openQuick = (p: MerchantProduct) => {
    setQuick(p);
    setQPrice(String(p.price));
    setQStock(p.stock != null ? String(p.stock) : '');
  };

  const saveQuick = async () => {
    if (!quick) return;
    setSaving(true);
    try {
      await merchantService.quickUpdatePrice(quick._id, {
        price: Number(qPrice),
        stock: qStock === '' ? null : Number(qStock),
      });
      setQuick(null);
      load();
    } catch (e: any) {
      Alert.alert('Could not update', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStock = async (p: MerchantProduct) => {
    try {
      await merchantService.quickUpdatePrice(p._id, { inStock: !(p.inStock !== false) });
      load();
    } catch (e: any) {
      Alert.alert('Could not update', e?.message || 'Please try again.');
    }
  };

  const renderItem = ({ item }: { item: MerchantProduct }) => (
    <View style={styles.row}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => navigation.navigate('AddEditProduct', { product: item })}
      >
        <Text style={styles.name} numberOfLines={1}>
          {item.productName}
        </Text>
        <Text style={styles.meta}>
          {item.category} · {item.unit}
          {item.sku ? ` · ${item.sku}` : ''}
        </Text>
        <View style={styles.tagRow}>
          <Text style={styles.price}>RM{item.price.toFixed(2)}</Text>
          <Text style={styles.stock}>
            {item.stock != null ? `${item.stock} in stock` : 'stock n/a'}
          </Text>
          {item.inStock === false && <Text style={styles.oos}>Hidden</Text>}
        </View>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => openQuick(item)} hitSlop={8} style={styles.iconBtn}>
          <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleStock(item)} hitSlop={8} style={styles.iconBtn}>
          <Ionicons
            name={item.inStock !== false ? 'eye-outline' : 'eye-off-outline'}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.safe}>
      <AppHeader
        title="Manage Products"
        rightIcon="add"
        onRightPress={() => navigation.navigate('AddEditProduct', {})}
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={items.length ? styles.list : styles.emptyWrap}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title="No products yet"
              body="Add your first product so buyers can find and order it."
            >
              <TouchableOpacity
                style={[commonStyles.primaryButton, { marginTop: spacing.md, paddingHorizontal: spacing.xl }]}
                onPress={() => navigation.navigate('AddEditProduct', {})}
              >
                <Text style={commonStyles.primaryButtonText}>Add Product</Text>
              </TouchableOpacity>
            </EmptyState>
          }
        />
      )}

      <Modal visible={!!quick} transparent animationType="fade" onRequestClose={() => setQuick(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {quick?.productName}
            </Text>
            <Text style={styles.sheetLabel}>Price (RM)</Text>
            <TextInput
              style={styles.sheetInput}
              value={qPrice}
              onChangeText={setQPrice}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text style={styles.sheetLabel}>Stock qty</Text>
            <TextInput
              style={styles.sheetInput}
              value={qStock}
              onChangeText={setQStock}
              keyboardType="number-pad"
              placeholder="leave blank for n/a"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.sheetRow}>
              <TouchableOpacity style={styles.cancel} onPress={() => setQuick(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[commonStyles.primaryButton, { flex: 1 }, saving && { opacity: 0.7 }]}
                onPress={saveQuick}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={commonStyles.primaryButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  list: { padding: spacing.lg, gap: spacing.sm },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginVertical: 2 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  price: { fontSize: fontSize.sm, fontWeight: '800', color: colors.primary },
  stock: { fontSize: fontSize.xs, color: colors.textMuted },
  oos: { fontSize: fontSize.xs, color: colors.discount, fontWeight: '700' },
  actions: { gap: spacing.sm },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  sheetTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  sheetLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 4, marginTop: spacing.sm },
  sheetInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  cancel: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  cancelText: { color: colors.textSecondary, fontWeight: '700' },
});
