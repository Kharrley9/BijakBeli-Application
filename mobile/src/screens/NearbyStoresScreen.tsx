import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, Region } from 'react-native-maps';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import BottomNav from '../components/BottomNav';
import DistanceBadge, { formatDuration } from '../components/DistanceBadge';
import { useLocation } from '../context/LocationContext';
import { storeService } from '../services/dataService';
import { DEFAULT_MAX_NEARBY_KM } from '../constants';
import { Store } from '../types';

const FALLBACK: Region = {
  latitude: 1.8548,
  longitude: 102.9358,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export default function NearbyStoresScreen({ navigation }: any) {
  const { origin, originMode, businessOrigin, refreshGps, gpsOrigin } = useLocation();
  const mapRef = useRef<MapView>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let o = origin;
    if (!o && originMode === 'gps') o = await refreshGps();
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
      });
      const data: Store[] = res?.data || res || [];
      setStores(Array.isArray(data) ? data : []);
      if (data.length) {
        mapRef.current?.animateToRegion(
          { ...FALLBACK, latitude: o.lat, longitude: o.lng },
          400
        );
      }
    } catch (e) {
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [origin, originMode, refreshGps]);

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [origin])
  );

  const region: Region = useMemo(
    () =>
      origin
        ? { ...FALLBACK, latitude: origin.lat, longitude: origin.lng }
        : FALLBACK,
    [origin]
  );

  const noOrigin = !origin;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Stores Near You</Text>
        <TouchableOpacity onPress={load}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          showsUserLocation={originMode === 'gps'}
        >
          {origin && (
            <Marker
              coordinate={{ latitude: origin.lat, longitude: origin.lng }}
              title={originMode === 'gps' ? 'My location' : 'My business'}
              pinColor={colors.primaryDark}
            />
          )}
          {stores.map((s) =>
            s.location?.coordinates?.length === 2 ? (
              <Marker
                key={s._id}
                coordinate={{
                  latitude: s.location.coordinates[1],
                  longitude: s.location.coordinates[0],
                }}
                title={s.storeName}
                description={`${s.mallName || ''}${
                  s.distanceKm != null ? ` · ${s.distanceKm} km` : ''
                }`}
              />
            ) : null
          )}
        </MapView>
      </View>

      <View style={styles.listWrap}>
        {noOrigin ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              Set your business location or turn on GPS to see nearby stores.
            </Text>
            <TouchableOpacity
              style={[commonStyles.primaryButton, styles.emptyBtn]}
              onPress={() => navigation.navigate('BusinessLocation')}
            >
              <Text style={commonStyles.primaryButtonText}>Set Business Location</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: spacing.xl }}
          />
        ) : stores.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No stores within {DEFAULT_MAX_NEARBY_KM} km.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
            {stores.map((s, i) => (
              <TouchableOpacity
                key={s._id}
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('SearchGrocery')}
              >
                <View style={styles.rowRank}>
                  <Text style={styles.rowRankText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{s.storeName}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {s.mallName || s.city}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <DistanceBadge
                    distanceKm={s.distanceKm}
                    durationMin={s.durationMin}
                    highlight={i === 0}
                  />
                  {s.durationMin != null && (
                    <Text style={styles.rowTime}>{formatDuration(s.durationMin)}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <BottomNav active="Nearby" />
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  mapWrap: { height: '38%' },
  listWrap: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowRank: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowRankText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.primary },
  rowName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  rowTime: { fontSize: fontSize.xs, color: colors.textMuted },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: { paddingHorizontal: spacing.xl },
});
