import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import OsmMap from '../components/OsmMap';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { authService } from '../services/authService';
import { locationService, pointToLatLng } from '../services/locationService';

// Default view: Batu Pahat, Johor
const FALLBACK = { lat: 1.8548, lng: 102.9358 };

export default function BusinessLocationScreen({ navigation }: any) {
  const { user, refreshUser } = useAuth();
  const { setOriginMode } = useLocation();
  const existing = pointToLatLng(user?.businessLocation);

  const [center, setCenter] = useState({
    lat: existing?.lat ?? FALLBACK.lat,
    lng: existing?.lng ?? FALLBACK.lng,
  });
  // Bump to make the map fly to `center` (e.g. after "use my location").
  const [flyKey, setFlyKey] = useState(0);
  const [address, setAddress] = useState(user?.businessLocation?.label || '');
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) {
      // First time: try to centre on the device location
      handleUseCurrent(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    setResolving(true);
    const label = await locationService.reverseGeocode({ lat, lng });
    setAddress(label);
    setResolving(false);
  };

  const onMoveEnd = async (c: { lat: number; lng: number }) => {
    setCenter(c);
    reverseGeocode(c.lat, c.lng);
  };

  const handleUseCurrent = async (silent = false) => {
    setLocating(true);
    try {
      const pos = await locationService.getCurrentPosition();
      // The map's moveend handler then updates the address.
      setCenter({ lat: pos.lat, lng: pos.lng });
      setFlyKey((k) => k + 1);
    } catch (e: any) {
      if (!silent) {
        Alert.alert('Location', e?.message || 'Could not get your location.');
      }
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authService.updateProfile({
        businessLocation: {
          type: 'Point',
          coordinates: [center.lng, center.lat],
          label: address || undefined,
        },
      });
      await refreshUser();
      // Make the newly-saved location the active origin immediately — otherwise
      // if the app was showing GPS, this save has no visible effect anywhere.
      setOriginMode('business');
      Alert.alert('Saved', 'Your saved location has been updated.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save your location.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Location</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.mapWrap}>
        <OsmMap
          style={StyleSheet.absoluteFill}
          center={center}
          flyKey={flyKey}
          onMoveEnd={onMoveEnd}
        />
        {/* Fixed centre pin — the map pans underneath it */}
        <View style={styles.pinContainer} pointerEvents="none">
          <Ionicons name="location" size={40} color={colors.primary} />
        </View>

        <TouchableOpacity
          style={styles.currentBtn}
          onPress={() => handleUseCurrent(false)}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="navigate" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.sheetLabel}>Selected address</Text>
        <View style={styles.addressRow}>
          <Ionicons name="storefront-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.addressText} numberOfLines={2}>
            {resolving ? 'Finding address…' : address || 'Move the map to place the pin'}
          </Text>
        </View>
        <Text style={styles.coordText}>
          {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
        </Text>

        <TouchableOpacity
          style={[commonStyles.primaryButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={commonStyles.primaryButtonText}>Save Location</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  mapWrap: { flex: 1, position: 'relative' },
  pinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40, // anchor the tip of the pin at the centre
  },
  currentBtn: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sheet: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  sheetLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  addressText: { flex: 1, fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  coordText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});
