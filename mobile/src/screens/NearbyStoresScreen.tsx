import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import OsmMap, { MapMarker } from '../components/OsmMap';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import { useLocation } from '../context/LocationContext';
import { storeService, placeService } from '../services/dataService';
import { openInGoogleMaps } from '../services/locationService';
import { DEFAULT_MAX_NEARBY_KM } from '../constants';
import { Store } from '../types';
import StoreCard from '../components/StoreCard';
import EmptyState from '../components/EmptyState';

const FALLBACK = { lat: 1.8548, lng: 102.9358 };

export default function NearbyStoresScreen({ navigation }: any) {
  const { origin, refreshGps, originMode, setOriginMode, gpsLoading } = useLocation();
  const [flyKey, setFlyKey] = useState(0);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [stores, setStores] = useState<Store[]>([]);
  const [malls, setMalls] = useState<any[]>([]);
  const [selected, setSelected] = useState<{ kind: 'store' | 'mall'; id: string; name: string; sub: string; lat: number; lng: number } | null>(null);
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
      });
      const data: Store[] = res?.data || res || [];
      setStores(data);
      setSelected(null);
      // Malls from OpenStreetMap (via our server)
      placeService.getNearbyMalls({ lat: o.lat, lng: o.lng, limit: 8 })
        .then((r: any) => setMalls(r?.data || []))
        .catch(() => setMalls([]));
      setFlyKey((k) => k + 1);
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [origin?.lat, origin?.lng]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Map pins; ids are prefixed so a tap can be traced back to a store or a mall.
  const markers: MapMarker[] = useMemo(
    () => [
      ...stores
        .filter((s) => s.location?.coordinates?.length === 2)
        .map((s) => ({
          id: `s:${s._id}`,
          lat: s.location!.coordinates[1],
          lng: s.location!.coordinates[0],
          color: colors.primary,
        })),
      ...malls.map((m) => ({ id: `m:${m.placeId}`, lat: m.lat, lng: m.lng, color: '#1976D2' })),
    ],
    [stores, malls]
  );

  const onMarkerPress = async (id: string) => {
    const [kind, key] = [id.slice(0, 1), id.slice(2)];
    if (kind === 's') {
      const st = stores.find((x) => x._id === key);
      if (!st?.location) return;
      setSelected({
        kind: 'store',
        id: st._id,
        name: st.storeName,
        sub: st.distanceKm != null ? `${st.distanceKm} km away` : 'Store',
        lat: st.location.coordinates[1],
        lng: st.location.coordinates[0],
      });
    } else {
      const m = malls.find((x) => x.placeId === key);
      if (!m) return;
      setSelected({
        kind: 'mall',
        id: m.placeId,
        name: m.name,
        sub: `Mall · ${m.distanceKm} km away`,
        lat: m.lat,
        lng: m.lng,
      });
    }
  };

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

      {!origin ? (
        <EmptyState icon="location-outline" title="Location off" body="Enable location to see stores near you.">
          <TouchableOpacity style={[commonStyles.primaryButton, { marginTop: spacing.md, paddingHorizontal: spacing.xl }]} onPress={load}>
            <Text style={commonStyles.primaryButtonText}>Enable</Text>
          </TouchableOpacity>
        </EmptyState>
      ) : loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : view === 'map' ? (
        <View style={{ flex: 1 }}>
        <OsmMap
          style={{ flex: 1 }}
          center={origin ?? FALLBACK}
          flyKey={flyKey}
          markers={markers}
          user={originMode === 'gps' ? origin : null}
          onMarkerPress={onMarkerPress}
          onMapPress={async () => setSelected(null)}
        />
        {selected && (
          <View style={styles.sheet}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle} numberOfLines={1}>{selected.name}</Text>
              <Text style={styles.sheetSub}>{selected.sub}</Text>
            </View>
            {selected.kind === 'store' && (
              <TouchableOpacity
                style={styles.sheetBtnGhost}
                onPress={() => navigation.navigate('StoreProfile', { id: selected.id })}
              >
                <Text style={styles.sheetBtnGhostText}>Details</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.sheetBtn}
              onPress={() => openInGoogleMaps({ lat: selected.lat, lng: selected.lng })}
            >
              <Ionicons name="navigate" size={14} color={colors.white} />
              <Text style={styles.sheetBtnText}>Google Maps</Text>
            </TouchableOpacity>
          </View>
        )}
        </View>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sheet: {
    position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  sheetTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  sheetSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  sheetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  sheetBtnText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '700' },
  sheetBtnGhost: {
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: 7,
  },
  sheetBtnGhostText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' },
});
