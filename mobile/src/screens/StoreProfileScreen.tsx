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
import { useCart } from '../context/CartContext';
import { storeService, favoriteStoreService } from '../services/dataService';
import { Store } from '../types';
import { categoryLabel } from '../constants';
import AppHeader from '../components/AppHeader';
import RatingStars from '../components/RatingStars';
import DistanceBadge from '../components/DistanceBadge';
import EmptyState from '../components/EmptyState';

export default function StoreProfileScreen({ route, navigation }: any) {
  const { id } = route.params || {};
  const { origin, originParams } = useLocation();
  const { addItem, groupFor } = useCart();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);

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
    favoriteStoreService
      .check(id)
      .then((r: any) => setIsFav(!!r.data?.isFavorite))
      .catch(() => {});
  }, [id, origin?.lat, origin?.lng]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleFavorite = async () => {
    setIsFav((v) => !v); // optimistic
    try {
      const res: any = await favoriteStoreService.toggle(id);
      setIsFav(!!res.data?.isFavorite);
    } catch {
      setIsFav((v) => !v); // revert
    }
  };

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
      <AppHeader
        title={store.storeName}
        rightIcon={isFav ? 'heart' : 'heart-outline'}
        onRightPress={toggleFavorite}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.banner}>
          {store.bannerImage || store.logo ? (
            <Image source={{ uri: store.bannerImage || store.logo }} style={styles.bannerImg} />
          ) : (
            <Ionicons
              name={store.kind === 'merchant' ? 'storefront-outline' : 'business-outline'}
              size={44}
              color={colors.primary}
            />
          )}
        </View>

        <View style={styles.headBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{store.storeName}</Text>
            {store.kind === 'merchant' && (
              <View style={styles.tag}><Text style={styles.tagText}>Trader</Text></View>
            )}
          </View>
          <Text style={styles.cat}>
            {categoryLabel(store.storeCategory)} · {store.city || store.branch || store.state}
          </Text>
          <View style={styles.metaRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('StoreReviews', { storeId: id, storeName: store.storeName })}
            >
              <RatingStars rating={store.rating || 0} count={store.reviewCount} size={13} />
            </TouchableOpacity>
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
          {store.deliveryAvailable && (
            <View style={styles.action}>
              <Ionicons name="bicycle-outline" size={20} color={colors.primary} />
              <Text style={styles.actionText}>Delivery RM{(store.deliveryFee || 0).toFixed(0)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.section}>
          Products {store.productCount ? `(${store.productCount})` : ''}
        </Text>
        {(store.products || []).length === 0 ? (
          <Text style={styles.empty}>No products listed.</Text>
        ) : (
          (store.products || []).map((p) => {
            const canAdd = store.kind === 'merchant' && p.inStock !== false;
            return (
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
                  <Text style={styles.pSub}>
                    {[p.category, p.unit].filter(Boolean).join(' · ')}
                    {p.stock != null ? `  ·  ${p.stock} in stock` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {p.previousPrice ? (
                    <Text style={styles.pWas}>RM{Number(p.previousPrice).toFixed(2)}</Text>
                  ) : null}
                  <Text style={styles.pPrice}>RM{Number(p.price).toFixed(2)}</Text>
                </View>
                {canAdd && (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      addItem({
                        productId: p._id,
                        storeId: store._id,
                        storeName: store.storeName,
                        storeKind: store.kind,
                        name: p.productName,
                        unit: p.unit,
                        unitPrice: p.price,
                        image: p.image,
                        stock: p.stock,
                        deliveryAvailable: store.deliveryAvailable,
                        deliveryFee: store.deliveryFee,
                        pickupAvailable: store.pickupAvailable,
                      });
                    }}
                  >
                    <Ionicons name="add" size={18} color={colors.white} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {store.kind === 'merchant' && !!groupFor(store._id) && (
        <TouchableOpacity
          style={styles.cartBar}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart" size={18} color={colors.white} />
          <Text style={styles.cartBarText}>
            View Cart · {groupFor(store._id)!.qty} item{groupFor(store._id)!.qty > 1 ? 's' : ''} · RM
            {groupFor(store._id)!.subtotal.toFixed(2)}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.white} />
        </TouchableOpacity>
      )}
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, flexShrink: 1 },
  tag: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  tagText: { fontSize: 9, fontWeight: '800', color: colors.white },
  cat: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
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
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cartBarText: { flex: 1, color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
});
