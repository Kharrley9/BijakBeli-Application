/**
 * ReportPriceScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────
 * JOM KONGSI — lets users submit a crowdsourced price observation for any
 * product at any store. Equivalent to Price Catcher's "JOM Kongsi" feature.
 *
 * Navigation params: { productId, productName, storeId?, storeName? }
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing, commonStyles } from '../theme/theme';
import { priceService, storeService } from '../services/dataService';
import AppHeader from '../components/AppHeader';

interface Store { _id: string; storeName: string; city: string; state: string; }

export default function ReportPriceScreen({ route, navigation }: any) {
  const { productId, productName, storeId: initStoreId, storeName: initStoreName } = route.params || {};

  const [stores, setStores]           = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(
    initStoreId ? { _id: initStoreId, storeName: initStoreName || '', city: '', state: '' } : null
  );
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');

  const [price, setPrice]             = useState('');
  const [isPromo, setIsPromo]         = useState(false);
  const [promoDesc, setPromoDesc]     = useState('');
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await storeService.list();
        setStores((res?.data || res) ?? []);
      } catch { /* ignore */ } finally {
        setStoresLoading(false);
      }
    })();
  }, []);

  const filteredStores = stores.filter(s =>
    s.storeName.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.city?.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const submit = async () => {
    if (!selectedStore) { Alert.alert('Missing store', 'Please select a store.'); return; }
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) { Alert.alert('Invalid price', 'Please enter a valid price (e.g. 3.50).'); return; }

    setSubmitting(true);
    try {
      await priceService.reportPrice({
        productId,
        storeId: selectedStore._id,
        price: p,
        isPromo,
        promoDescription: isPromo ? promoDesc : undefined,
      });
      Alert.alert(
        '🎉 Thank you!',
        'Your price report has been submitted. It will be reviewed by the community.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Submit failed', e?.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <AppHeader title="Report Price" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Product Info */}
        <View style={styles.productCard}>
          <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.productLabel}>Product</Text>
            <Text style={styles.productName} numberOfLines={2}>{productName}</Text>
          </View>
        </View>

        {/* Store Picker */}
        <Text style={styles.label}>Store *</Text>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => setShowStorePicker(true)}
        >
          <Ionicons name="storefront-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.pickerText, !selectedStore && { color: colors.textMuted }]}>
            {selectedStore ? selectedStore.storeName : 'Select a store…'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Store search modal-like inline list */}
        {showStorePicker && (
          <View style={styles.storeList}>
            <TextInput
              style={styles.storeSearch}
              placeholder="Search stores…"
              placeholderTextColor={colors.textMuted}
              value={storeSearch}
              onChangeText={setStoreSearch}
              autoFocus
            />
            {storesLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ padding: spacing.md }} />
            ) : (
              filteredStores.slice(0, 30).map(s => (
                <TouchableOpacity
                  key={s._id}
                  style={styles.storeRow}
                  onPress={() => { setSelectedStore(s); setShowStorePicker(false); setStoreSearch(''); }}
                >
                  <Text style={styles.storeRowName}>{s.storeName}</Text>
                  <Text style={styles.storeRowSub}>{[s.city, s.state].filter(Boolean).join(', ')}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Price Input */}
        <Text style={styles.label}>Price (RM) *</Text>
        <View style={styles.priceRow}>
          <Text style={styles.rmPrefix}>RM</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Is Promo toggle */}
        <View style={styles.promoRow}>
          <View>
            <Text style={styles.label}>Is this a promotion price?</Text>
            <Text style={styles.sublabel}>Toggle on if this is a sale/discount price</Text>
          </View>
          <Switch
            value={isPromo}
            onValueChange={setIsPromo}
            trackColor={{ true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        {isPromo && (
          <>
            <Text style={styles.label}>Promotion details (optional)</Text>
            <TextInput
              style={styles.promoInput}
              placeholder="e.g. Weekly sale, buy 2 free 1…"
              placeholderTextColor={colors.textMuted}
              value={promoDesc}
              onChangeText={setPromoDesc}
              multiline
              numberOfLines={3}
            />
          </>
        )}

        {/* Info note */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            Your report helps other shoppers save money. Reports with 3+ community confirmations are automatically verified.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[commonStyles.primaryButton, styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color={colors.white} />
            : <>
                <Ionicons name="send-outline" size={18} color={colors.white} style={{ marginRight: 6 }} />
                <Text style={commonStyles.primaryButtonText}>Submit Price Report</Text>
              </>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.background },
  scroll:       { padding: spacing.lg, paddingBottom: 40 },

  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  productLabel: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  productName:  { fontSize: fontSize.md, fontWeight: '700', color: colors.text },

  label:    { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  sublabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },

  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
    backgroundColor: colors.white,
  },
  pickerText: { flex: 1, fontSize: fontSize.md, color: colors.text },

  storeList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    maxHeight: 240,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  storeSearch: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  storeRow:     { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surface },
  storeRowName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  storeRowSub:  { fontSize: fontSize.xs, color: colors.textSecondary },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  rmPrefix: {
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    alignSelf: 'stretch',
    textAlignVertical: 'center',
    paddingVertical: spacing.md,
  },
  priceInput: { flex: 1, fontSize: fontSize.xl, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.md },

  promoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  promoInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text,
    backgroundColor: colors.white,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  infoBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 18 },

  submitBtn: { marginTop: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
