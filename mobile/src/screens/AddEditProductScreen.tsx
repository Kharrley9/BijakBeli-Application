import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, commonStyles, fontSize, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import { FormField, FormSwitch, ChipSelect } from '../components/FormField';
import { PRODUCT_UNITS } from '../constants';
import { merchantService } from '../services/dataService';
import { MerchantProduct } from '../types';

const UNIT_OPTIONS = PRODUCT_UNITS.map((u) => ({ value: u, label: u }));

export default function AddEditProductScreen({ navigation, route }: any) {
  const editing: MerchantProduct | undefined = route.params?.product;
  const isEdit = !!editing;

  const [cats, setCats] = useState<{ value: string; label: string }[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [name, setName] = useState(editing?.productName || '');
  const [categoryId, setCategoryId] = useState<string | null>(editing?.categoryId || null);
  const [unit, setUnit] = useState<string>(editing?.unit || 'pcs');
  const [price, setPrice] = useState(editing?.price != null ? String(editing.price) : '');
  const [previousPrice, setPreviousPrice] = useState(
    editing?.previousPrice != null ? String(editing.previousPrice) : ''
  );
  const [stock, setStock] = useState(editing?.stock != null ? String(editing.stock) : '');
  const [sku, setSku] = useState(editing?.sku || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [inStock, setInStock] = useState(editing?.inStock !== false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    merchantService
      .getCategories()
      .then((res: any) => {
        const opts = (res.data || []).map((c: any) => ({ value: c._id, label: c.categoryName }));
        setCats(opts);
        if (!categoryId && opts.length) setCategoryId(opts[0].value);
      })
      .catch(() => {})
      .finally(() => setLoadingCats(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!name.trim()) return Alert.alert('Missing info', 'Enter the product name.');
    if (!categoryId) return Alert.alert('Missing info', 'Pick a category.');
    if (!unit.trim()) return Alert.alert('Missing info', 'Enter a unit.');
    const p = Number(price);
    if (!Number.isFinite(p) || p < 0) return Alert.alert('Missing info', 'Enter a valid price.');

    const payload: Record<string, unknown> = {
      productName: name.trim(),
      categoryId,
      unit: unit.trim(),
      price: p,
      previousPrice: previousPrice === '' ? null : Number(previousPrice),
      stock: stock === '' ? null : Number(stock),
      sku: sku.trim() || undefined,
      description: description.trim(),
      inStock,
    };

    setBusy(true);
    try {
      if (isEdit) {
        await merchantService.updateProduct(editing!._id, payload);
      } else {
        await merchantService.createProduct(payload);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    Alert.alert('Delete product', `Remove "${editing?.productName}" from your store?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await merchantService.deleteProduct(editing!._id);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Could not delete', e?.message || 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.safe}>
      <AppHeader title={isEdit ? 'Edit Product' : 'Add Product'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <FormField label="Product name" value={name} onChangeText={setName} placeholder="e.g. Castrol GTX 15W-40 4L" />

          {loadingCats ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : (
            <ChipSelect label="Category" options={cats} value={categoryId} onChange={setCategoryId} />
          )}

          <ChipSelect label="Unit" options={UNIT_OPTIONS} value={unit} onChange={setUnit} />
          <FormField label="Unit (custom)" value={unit} onChangeText={setUnit} placeholder="pcs / set / metre" />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormField label="Price (RM)" value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label="Was (RM, optional)"
                value={previousPrice}
                onChangeText={setPreviousPrice}
                placeholder="—"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormField label="Stock qty" value={stock} onChangeText={setStock} placeholder="e.g. 20" keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="SKU (optional)" value={sku} onChangeText={setSku} placeholder="Your code" autoCapitalize="characters" />
            </View>
          </View>

          <FormSwitch label="In stock / available to buy" value={inStock} onValueChange={setInStock} />

          <FormField
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Details buyers should know"
            multiline
          />

          <TouchableOpacity
            style={[commonStyles.primaryButton, styles.btn, busy && { opacity: 0.7 }]}
            onPress={save}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={commonStyles.primaryButtonText}>{isEdit ? 'Save Changes' : 'Add Product'}</Text>
            )}
          </TouchableOpacity>

          {isEdit && (
            <TouchableOpacity style={styles.delete} onPress={remove}>
              <Text style={styles.deleteText}>Delete product</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', gap: spacing.md },
  btn: { marginTop: spacing.lg },
  delete: { alignItems: 'center', paddingVertical: spacing.lg },
  deleteText: { color: colors.discount, fontWeight: '700' },
});
