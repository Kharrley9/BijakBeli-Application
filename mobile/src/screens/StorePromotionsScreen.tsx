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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import { FormField, ChipSelect } from '../components/FormField';
import { merchantService } from '../services/dataService';
import { MerchantProduct, MerchantPromotion } from '../types';

const DURATIONS = [
  { value: '7', label: '1 week' },
  { value: '14', label: '2 weeks' },
  { value: '30', label: '1 month' },
  { value: '60', label: '2 months' },
];

function endDateFromDays(days: string) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days));
  return d.toISOString();
}

export default function StorePromotionsScreen() {
  const [promos, setPromos] = useState<MerchantPromotion[]>([]);
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [productId, setProductId] = useState<string | null>(null);
  const [title, setTitle] = useState('Special Offer');
  const [promoPrice, setPromoPrice] = useState('');
  const [days, setDays] = useState('14');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, pr]: any = await Promise.all([
        merchantService.listPromotions(),
        merchantService.listProducts(),
      ]);
      setPromos(p.data || []);
      setProducts(pr.data || []);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not load promotions');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const selectedProduct = products.find((p) => p._id === productId);

  const create = async () => {
    if (!productId) return Alert.alert('Missing info', 'Pick a product.');
    const price = Number(promoPrice);
    if (!Number.isFinite(price) || price <= 0) return Alert.alert('Missing info', 'Enter a promo price.');
    if (selectedProduct && price >= selectedProduct.price) {
      return Alert.alert('Check price', 'Promo price must be lower than the current price.');
    }
    setSaving(true);
    try {
      await merchantService.createPromotion({
        productId,
        promotionTitle: title.trim() || 'Special Offer',
        promotionPrice: price,
        endDate: endDateFromDays(days),
      });
      setCreating(false);
      setProductId(null);
      setPromoPrice('');
      setTitle('Special Offer');
      load();
    } catch (e: any) {
      Alert.alert('Could not create', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (promo: MerchantPromotion) => {
    Alert.alert('End promotion', 'Remove this promotion now?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          try {
            await merchantService.deletePromotion(promo._id);
            load();
          } catch (e: any) {
            Alert.alert('Could not remove', e?.message || 'Please try again.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: MerchantPromotion }) => {
    const prod = typeof item.productId === 'object' ? item.productId : null;
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pName} numberOfLines={1}>
            {prod?.productName || 'Product'}
          </Text>
          <Text style={styles.pTitle}>{item.promotionTitle}</Text>
          <View style={styles.pRow}>
            <Text style={styles.pPrice}>RM{item.promotionPrice.toFixed(2)}</Text>
            {item.discountPercentage ? (
              <Text style={styles.pDisc}>−{item.discountPercentage}%</Text>
            ) : null}
            <Text style={styles.pEnd}>ends {new Date(item.endDate).toLocaleDateString()}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => remove(item)} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color={colors.discount} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.safe}>
      <AppHeader title="Promotions" rightIcon="add" onRightPress={() => setCreating(true)} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      ) : (
        <FlatList
          data={promos}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={promos.length ? styles.list : styles.emptyWrap}
          ListEmptyComponent={
            <EmptyState
              icon="pricetag-outline"
              title="No active promotions"
              body="Run a limited-time discount to attract buyers."
            >
              <TouchableOpacity
                style={[commonStyles.primaryButton, { marginTop: spacing.md, paddingHorizontal: spacing.xl }]}
                onPress={() => setCreating(true)}
              >
                <Text style={commonStyles.primaryButtonText}>Create Promotion</Text>
              </TouchableOpacity>
            </EmptyState>
          }
        />
      )}

      <Modal visible={creating} transparent animationType="slide" onRequestClose={() => setCreating(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>New Promotion</Text>
            {products.length === 0 ? (
              <Text style={styles.note}>Add a product first.</Text>
            ) : (
              <>
                <ChipSelect
                  label="Product"
                  options={products.map((p) => ({ value: p._id, label: p.productName }))}
                  value={productId}
                  onChange={(v) => {
                    setProductId(v);
                    const prod = products.find((p) => p._id === v);
                    if (prod) setPromoPrice(String((prod.price * 0.9).toFixed(2)));
                  }}
                />
                {selectedProduct && (
                  <Text style={styles.note}>Current price: RM{selectedProduct.price.toFixed(2)}</Text>
                )}
                <FormField label="Title" value={title} onChangeText={setTitle} placeholder="Raya Sale" />
                <FormField
                  label="Promo price (RM)"
                  value={promoPrice}
                  onChangeText={setPromoPrice}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
                <ChipSelect label="Duration" options={DURATIONS} value={days} onChange={setDays} />
              </>
            )}
            <View style={styles.sheetRow}>
              <TouchableOpacity style={styles.cancel} onPress={() => setCreating(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[commonStyles.primaryButton, { flex: 1 }, (saving || !products.length) && { opacity: 0.6 }]}
                onPress={create}
                disabled={saving || !products.length}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={commonStyles.primaryButtonText}>Start Promotion</Text>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  pTitle: { fontSize: fontSize.xs, color: colors.textSecondary, marginVertical: 2 },
  pRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  pPrice: { fontSize: fontSize.sm, fontWeight: '800', color: colors.primary },
  pDisc: { fontSize: fontSize.xs, fontWeight: '800', color: colors.discount },
  pEnd: { fontSize: fontSize.xs, color: colors.textMuted },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sheetTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  note: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.sm },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  cancel: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  cancelText: { color: colors.textSecondary, fontWeight: '700' },
});
