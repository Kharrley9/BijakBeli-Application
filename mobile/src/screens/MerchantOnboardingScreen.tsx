import React, { useState } from 'react';
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
import { FormField, FormSwitch, ChipSelect } from '../components/FormField';
import { STORE_CATEGORIES } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { merchantService } from '../services/dataService';

const CATEGORY_OPTIONS = STORE_CATEGORIES.map((c) => ({ value: c.slug, label: c.label }));

export default function MerchantOnboardingScreen({ navigation }: any) {
  const { user, refreshUser } = useAuth();
  const { businessOrigin } = useLocation();

  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState<string | null>(null);
  const [phone, setPhone] = useState(user?.phone || '');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(user?.businessLocation?.label || '');
  const [city, setCity] = useState('');
  const [state, setState] = useState(user?.preferredState || '');
  const [hours, setHours] = useState('9:00 AM - 6:00 PM');
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('');
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [minOrder, setMinOrder] = useState('');
  const [busy, setBusy] = useState(false);

  const hasLocation = !!businessOrigin;

  const submit = async () => {
    if (!storeName.trim()) return Alert.alert('Missing info', 'Enter your store name.');
    if (!storeCategory) return Alert.alert('Missing info', 'Pick a store category.');
    if (!address.trim() || !city.trim() || !state.trim()) {
      return Alert.alert('Missing info', 'Enter your address, city and state.');
    }
    if (!hasLocation) {
      return Alert.alert(
        'Set your location',
        'Drop a pin on your shop first so buyers can see the distance.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Set location', onPress: () => navigation.navigate('BusinessLocation') },
        ]
      );
    }

    setBusy(true);
    try {
      await merchantService.registerStore({
        storeName: storeName.trim(),
        storeCategory,
        phone: phone.trim() || undefined,
        description: description.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        operating_hours: hours.trim() || undefined,
        deliveryAvailable,
        deliveryFee: deliveryAvailable ? Number(deliveryFee) || 0 : 0,
        pickupAvailable,
        minOrder: Number(minOrder) || 0,
      });
      await refreshUser();
      Alert.alert('Store is live', 'Buyers can now find your shop on BijakBeli.');
      navigation.replace('MerchantDashboard');
    } catch (e: any) {
      Alert.alert('Could not register', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.safe}>
      <AppHeader title="Register Your Store" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            Your store goes live immediately. You can edit everything later from your dashboard.
          </Text>

          <FormField label="Store name" value={storeName} onChangeText={setStoreName} placeholder="e.g. AutoCare Batu Pahat" />

          <ChipSelect
            label="Store category"
            options={CATEGORY_OPTIONS}
            value={storeCategory as any}
            onChange={(v) => setStoreCategory(v)}
          />

          <FormField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What you sell"
            multiline
          />
          <FormField label="Phone" value={phone} onChangeText={setPhone} placeholder="07-000 0000" keyboardType="phone-pad" />
          <FormField label="Address" value={address} onChangeText={setAddress} placeholder="Street address" multiline />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormField label="City" value={city} onChangeText={setCity} placeholder="Batu Pahat" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="State" value={state} onChangeText={setState} placeholder="Johor" />
            </View>
          </View>
          <FormField label="Opening hours" value={hours} onChangeText={setHours} placeholder="9:00 AM - 6:00 PM" />

          <TouchableOpacity style={styles.locRow} onPress={() => navigation.navigate('BusinessLocation')}>
            <Ionicons
              name={hasLocation ? 'checkmark-circle' : 'location-outline'}
              size={20}
              color={hasLocation ? colors.primary : colors.textMuted}
            />
            <Text style={styles.locText}>
              {hasLocation ? 'Shop location set — tap to adjust' : 'Drop a pin on your shop'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <FormSwitch
            label="Offer delivery"
            hint="A flat fee you set, paid on delivery"
            value={deliveryAvailable}
            onValueChange={setDeliveryAvailable}
          />
          {deliveryAvailable && (
            <FormField
              label="Delivery fee (RM)"
              value={deliveryFee}
              onChangeText={setDeliveryFee}
              placeholder="8"
              keyboardType="decimal-pad"
            />
          )}
          <FormSwitch label="Allow pickup" value={pickupAvailable} onValueChange={setPickupAvailable} />
          <FormField
            label="Minimum order (RM, optional)"
            value={minOrder}
            onChangeText={setMinOrder}
            placeholder="0"
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            style={[commonStyles.primaryButton, styles.btn, busy && { opacity: 0.7 }]}
            onPress={submit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={commonStyles.primaryButtonText}>Publish Store</Text>
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
  intro: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.lg, lineHeight: 20 },
  row: { flexDirection: 'row', gap: spacing.md },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  locText: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  btn: { marginTop: spacing.lg },
});
