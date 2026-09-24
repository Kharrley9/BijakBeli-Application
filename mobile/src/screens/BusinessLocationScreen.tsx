import React, { useEffect, useRef, useState } from 'react';
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
import MapView, { Region } from 'react-native-maps';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { authService } from '../services/authService';
import { locationService, pointToLatLng } from '../services/locationService';

// Default view: Batu Pahat, Johor
const FALLBACK_REGION: Region = {
  latitude: 1.8548,
  longitude: 102.9358,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function BusinessLocationScreen({ navigation }: any) {
  const { user, refreshUser } = useAuth();
  const { setOriginMode } = useLocation();
  const mapRef = useRef<MapView>(null);
  const existing = pointToLatLng(user?.businessLocation);

  const [center, setCenter] = useState({
    latitude: existing?.lat ?? FALLBACK_REGION.latitude,
    longitude: existing?.lng ?? FALLBACK_REGION.longitude,
  });
  const [address, setAddress] = useState(user?.businessLocation?.label || '');
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialRegion: Region = existing
    ? { ...FALLBACK_REGION, latitude: existing.lat, longitude: existing.lng }
    : FALLBACK_REGION;

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

  const onRegionChangeComplete = (region: Region) => {
    setCenter({ latitude: region.latitude, longitude: region.longitude });
    reverseGeocode(region.latitude, region.longitude);
  };

  const handleUseCurrent = async (silent = false) => {
    setLocating(true);
    try {
      const pos = await locationService.getCurrentPosition();
      const region: Region = {
        ...FALLBACK_REGION,
        latitude: pos.lat,
        longitude: pos.lng,
      };
      mapRef.current?.animateToRegion(region, 400);
      setCenter({ latitude: pos.lat, longitude: pos.lng });
      reverseGeocode(pos.lat, pos.lng);
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
          coordinates: [center.longitude, center.latitude],
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
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={false}
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
          {center.latitude.toFixed(5)}, {center.longitude.toFixed(5)}
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
