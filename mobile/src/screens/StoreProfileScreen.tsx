import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { useLocation } from '../context/LocationContext';
import { storeService } from '../services/dataService';
import { Store } from '../types';
import AppHeader from '../components/AppHeader';
import DistanceBadge from '../components/DistanceBadge';
import EmptyState from '../components/EmptyState';

export default function StoreProfileScreen({ route, navigation }: any) {
  const { id } = route.params || {};
  const { origin, originParams } = useLocation();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await storeService.getById(id, originParams());
      setStore(res?.data || res);
    } catch {
      setStore(null);
    } finally {
      setLoading(false);
    }
  }, [id, origin?.lat, origin?.lng]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Store" />
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      </View>
    );
  }
  if (!store) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Store" />
        <EmptyState icon="storefront-outline" title="Store not found" />
      </View>
    );
  }

  const navigate = () => {
    const c = store.location?.coordinates;
    if (c?.length === 2) Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${c[1]},${c[0]}`);
  };
  const call = () => store.phone && Linking.openURL(`tel:${store.phone}`);

  return (
    <View style={styles.safe}>
      <AppHeader title={store.storeName} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.banner}>
          {store.bannerImage || store.logo ? (
            <Image source={{ uri: store.bannerImage || store.logo }} style={styles.bannerImg} />
          ) : (
            <Ionicons name="business-outline" size={44} color={colors.primary} />
          )}
        </View>

        <View style={styles.headBlock}>
          <Text style={styles.name}>{store.storeName}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.cat}>{store.city || store.branch || store.state}</Text>
            {store.distanceKm != null && (
              <DistanceBadge distanceKm={store.distanceKm} durationMin={store.durationMin} />
            )}
          </View>
          {!!store.description && <Text style={styles.desc}>{store.description}</Text>}
          {!!store.operating_hours && (
            <Text style={styles.hours}>
              <Ionicons name="time-outline" size={12} /> {store.operating_hours}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={navigate}>
            <Ionicons name="navigate-outline" size={20} color={colors.primary} />
            <Text style={styles.actionText}>Directions</Text>
          </TouchableOpacity>
          {!!store.phone && (
            <TouchableOpacity style={styles.action} onPress={call}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.section}>
          Products {store.productCount ? `(${store.productCount})` : ''}
        </Text>
        {(store.products || []).length === 0 ? (
          <Text style={styles.empty}>No products listed.</Text>
        ) : (
          (store.products || []).map((p) => (
            <TouchableOpacity
              key={p._id}
              style={styles.pRow}
              onPress={() => navigation.navigate('ProductDetail', { id: p._id })}
            >
              <View style={styles.pThumb}>
                {p.image ? (
                  <Image source={{ uri: p.image }} style={{ width: 44, height: 44 }} />
                ) : (
                  <Ionicons name="cube-outline" size={20} color={colors.textMuted} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pName} numberOfLines={2}>{p.productName}</Text>
                <Text style={styles.pSub}>{[p.category, p.unit].filter(Boolean).join(' · ')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {p.previousPrice ? (
                  <Text style={styles.pWas}>RM{Number(p.previousPrice).toFixed(2)}</Text>
                ) : null}
                <Text style={styles.pPrice}>RM{Number(p.price).toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingBottom: spacing.xxl },
  banner: {
    height: 130,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bannerImg: { width: '100%', height: '100%' },
  headBlock: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  name: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  cat: { fontSize: fontSize.sm, color: colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  desc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  hours: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  action: { alignItems: 'center', gap: 4 },
  actionText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  section: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  empty: { color: colors.textMuted, fontStyle: 'italic', paddingHorizontal: spacing.lg },
  pRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  pSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  pWas: { fontSize: fontSize.xs, color: colors.textMuted, textDecorationLine: 'line-through' },
  pPrice: { fontSize: fontSize.md, fontWeight: '800', color: colors.primary },
});
