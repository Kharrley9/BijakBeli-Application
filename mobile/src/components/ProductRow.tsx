import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { CatalogProduct } from '../types';
import DistanceBadge from './DistanceBadge';
import BrandAvatar from './BrandAvatar';

export default function ProductRow({
  product,
  onPress,
}: {
  product: CatalogProduct;
  onPress: () => void;
}) {
  const cheapest = product.cheapestStore;
  const nearest = product.nearestStore;
  const brand =
    typeof product.brandId === 'object' && product.brandId
      ? product.brandId.brandName
      : undefined;

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.thumb}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.img} />
        ) : (
          <Ionicons name="cube-outline" size={26} color={colors.textMuted} />
        )}
      </View>

      <View style={styles.mid}>
        <Text style={styles.name} numberOfLines={2}>
          {product.productName}
        </Text>
        <View style={styles.subRow}>
          {brand && <BrandAvatar brandName={brand} size={16} style={{ marginRight: spacing.xs }} />}
          <Text style={styles.sub} numberOfLines={1}>
            {[brand, product.unit].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {cheapest && (
          <Text style={styles.store} numberOfLines={1}>
            <Ionicons name="storefront-outline" size={11} color={colors.textMuted} />{' '}
            {cheapest.storeName}
            {product.storeCount > 1 ? `  ·  +${product.storeCount - 1} more` : ''}
          </Text>
        )}
        {nearest?.distanceKm != null && (
          <DistanceBadge
            distanceKm={nearest.distanceKm}
            durationMin={nearest.durationMin}
            compact
            style={{ marginTop: 4 }}
          />
        )}
      </View>

      <View style={styles.right}>
        <Text style={styles.priceLabel}>from</Text>
        <Text style={styles.price}>
          RM{product.lowestPrice != null ? product.lowestPrice.toFixed(2) : '—'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: { width: 56, height: 56 },
  mid: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  sub: { fontSize: fontSize.xs, color: colors.textMuted },
  store: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 1, minWidth: 74 },
  priceLabel: { fontSize: 10, color: colors.textMuted },
  price: { fontSize: fontSize.md, fontWeight: '800', color: colors.primary },
});
