import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, Region } from 'react-native-maps';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import { useLocation } from '../context/LocationContext';
import { storeService } from '../services/dataService';
import { DEFAULT_MAX_NEARBY_KM, STORE_CATEGORIES } from '../constants';
import { Store } from '../types';
import StoreCard from '../components/StoreCard';
import EmptyState from '../components/EmptyState';

const FALLBACK: Region = {
  latitude: 1.8548,
  longitude: 102.9358,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

export default function NearbyStoresScreen({ navigation }: any) {
  const { origin, refreshGps, originMode, setOriginMode, gpsLoading } = useLocation();
  const mapRef = useRef<MapView>(null);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [cat, setCat] = useState<string | undefined>(undefined);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const relocate = () => {
    setOriginMode('gps');
    refreshGps();
  };

  const load = useCallback(async () => {
    let o = origin;
    if (!o) o = await refreshGps();
    if (!o) {
      setStores([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res: any = await storeService.getNearby({
        lat: o.lat,
        lng: o.lng,
        maxKm: DEFAULT_MAX_NEARBY_KM,
        limit: 40,
        storeCategory: cat,
      });
      const data: Store[] = res?.data || res || [];
      setStores(data);
      if (data.length && mapRef.current) {
        mapRef.current.animateToRegion({ ...FALLBACK, latitude: o.lat, longitude: o.lng }, 400);
      }
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [origin?.lat, origin?.lng, cat]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const region: Region = useMemo(
    () => (origin ? { ...FALLBACK, latitude: origin.lat, longitude: origin.lng } : FALLBACK),
    [origin]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Stores Near You</Text>
        <TouchableOpacity style={styles.relocateBtn} onPress={relocate} disabled={gpsLoading}>
          {gpsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="locate" size={18} color={colors.primary} />
          )}
        </TouchableOpacity>
        <View style={styles.toggle}>
          {(['list', 'map'] as const).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.toggleBtn, view === v && styles.toggleActive]}
              onPress={() => setView(v)}
            >
              <Ionicons
                name={v === 'list' ? 'list' : 'map'}
                size={16}
                color={view === v ? colors.white : colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats} style={styles.catBar}>
        <Chip label="All" active={!cat} onPress={() => setCat(undefined)} />
        {STORE_CATEGORIES.map((c) => (
          <Chip key={c.slug} label={c.label} active={cat === c.slug} onPress={() => setCat(c.slug)} />
        ))}
      </ScrollView>

      {!origin ? (
        <EmptyState icon="location-outline" title="Location off" body="Enable location to see stores near you.">
          <TouchableOpacity style={[commonStyles.primaryButton, { marginTop: spacing.md, paddingHorizontal: spacing.xl }]} onPress={load}>
            <Text style={commonStyles.primaryButtonText}>Enable</Text>
          </TouchableOpacity>
        </EmptyState>
      ) : loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : view === 'map' ? (
        <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={region} showsUserLocation={originMode === 'gps'}>
          {origin && (
            <Marker coordinate={{ latitude: origin.lat, longitude: origin.lng }} pinColor={colors.primaryDark} title="You" />
          )}
          {stores.map((s) =>
            s.location?.coordinates?.length === 2 ? (
              <Marker
                key={s._id}
                coordinate={{ latitude: s.location.coordinates[1], longitude: s.location.coordinates[0] }}
                title={s.storeName}
                description={`${s.distanceKm ?? ''} km`}
                onCalloutPress={() => navigation.navigate('StoreProfile', { id: s._id })}
              />
            ) : null
          )}
        </MapView>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(s) => s._id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <StoreCard
              store={item}
              rank={index + 1}
              onPress={() => navigation.navigate('StoreProfile', { id: item._id })}
            />
          )}
          ListEmptyComponent={<EmptyState icon="storefront-outline" title="No stores nearby" />}
        />
      )}
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { flex: 1, fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  relocateBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  toggle: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.sm, padding: 3, gap: 3 },
  toggleBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm },
  toggleActive: { backgroundColor: colors.primary },
  catBar: { maxHeight: 50, borderBottomWidth: 1, borderBottomColor: colors.border, flexGrow: 0 },
  cats: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
});
