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
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import { FormField, FormSwitch } from '../components/FormField';
import { merchantService } from '../services/dataService';
import { useLocation } from '../context/LocationContext';
import { categoryLabel } from '../constants';
import { MerchantStore } from '../types';

export default function EditStoreScreen({ navigation }: any) {
  const { businessOrigin } = useLocation();
  const [store, setStore] = useState<MerchantStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [hours, setHours] = useState('');
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('');
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [minOrder, setMinOrder] = useState('');

  useEffect(() => {
    merchantService
      .getMyStore()
      .then((res: any) => {
        const s: MerchantStore = res.data;
        setStore(s);
        setStoreName(s.storeName || '');
        setPhone(s.phone || '');
        setDescription(s.description || '');
        setAddress(s.address || '');
        setCity(s.city || '');
        setState(s.state || '');
        setHours(s.operating_hours || '');
        setDeliveryAvailable(!!s.deliveryAvailable);
        setDeliveryFee(s.deliveryFee != null ? String(s.deliveryFee) : '');
        setPickupAvailable(s.pickupAvailable !== false);
        setMinOrder(s.minOrder != null ? String(s.minOrder) : '');
      })
      .catch((e: any) => Alert.alert('Error', e?.message || 'Could not load store'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!storeName.trim()) return Alert.alert('Missing info', 'Store name is required.');
    setBusy(true);
    try {
      await merchantService.updateMyStore({
        storeName: storeName.trim(),
        phone: phone.trim(),
        description: description.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        operating_hours: hours.trim(),
        deliveryAvailable,
        deliveryFee: deliveryAvailable ? Number(deliveryFee) || 0 : 0,
        pickupAvailable,
        minOrder: Number(minOrder) || 0,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Edit Store" />
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <AppHeader title="Edit Store" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.catLine}>
            Category: {categoryLabel(store?.storeCategory)} (fixed)
          </Text>

          <FormField label="Store name" value={storeName} onChangeText={setStoreName} />
          <FormField label="Description" value={description} onChangeText={setDescription} multiline />
          <FormField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <FormField label="Address" value={address} onChangeText={setAddress} multiline />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormField label="City" value={city} onChangeText={setCity} />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="State" value={state} onChangeText={setState} />
            </View>
          </View>
          <FormField label="Opening hours" value={hours} onChangeText={setHours} />

          <TouchableOpacity style={styles.locRow} onPress={() => navigation.navigate('BusinessLocation')}>
            <Ionicons
              name={businessOrigin ? 'checkmark-circle' : 'location-outline'}
              size={20}
              color={businessOrigin ? colors.primary : colors.textMuted}
            />
            <Text style={styles.locText}>Update shop location</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={styles.hint}>
            Saving your location on that screen also updates your store pin.
          </Text>

          <View style={styles.divider} />

          <FormSwitch label="Offer delivery" value={deliveryAvailable} onValueChange={setDeliveryAvailable} />
          {deliveryAvailable && (
            <FormField
              label="Delivery fee (RM)"
              value={deliveryFee}
              onChangeText={setDeliveryFee}
              keyboardType="decimal-pad"
            />
          )}
          <FormSwitch label="Allow pickup" value={pickupAvailable} onValueChange={setPickupAvailable} />
          <FormField
            label="Minimum order (RM)"
            value={minOrder}
            onChangeText={setMinOrder}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            style={[commonStyles.primaryButton, styles.btn, busy && { opacity: 0.7 }]}
            onPress={save}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={commonStyles.primaryButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  catLine: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  locText: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  hint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  btn: { marginTop: spacing.lg },
});
