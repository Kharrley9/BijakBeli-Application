import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import { CatalogProduct } from '../types';
import DistanceBadge from './DistanceBadge';
import BrandAvatar from './BrandAvatar';
import { imageSource } from '../utils/imageSource';
import { prettyName, storeCountLabel } from '../utils/format';

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
    <TouchableOpacity style={styles.card} activeOpacity={0.75} onPress={onPress}>
      <View style={styles.thumb}>
        {product.image ? (
          <Image source={imageSource(product.image)} style={styles.img} />
        ) : (
          <Ionicons name="leaf-outline" size={26} color={colors.primary} />
        )}
      </View>

      <View style={styles.mid}>
        <Text style={styles.name} numberOfLines={2}>
          {prettyName(product.productName)}
        </Text>
        <View style={styles.subRow}>
          {brand && <BrandAvatar brandName={brand} size={16} style={{ marginRight: spacing.xs }} />}
          <Text style={styles.sub} numberOfLines={1}>
            {[brand, product.unit, storeCountLabel(product)]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        {cheapest && (
          <View style={styles.storeRow}>
            <Ionicons name="trophy" size={11} color={colors.accent} />
            <Text style={styles.store} numberOfLines={1}>
              Cheapest at {cheapest.storeName}
            </Text>
          </View>
        )}
        {nearest?.distanceKm != null && (
          <DistanceBadge
            distanceKm={nearest.distanceKm}
            durationMin={nearest.durationMin}
            compact
            style={{ marginTop: 6 }}
          />
        )}
      </View>

      <View style={styles.right}>
        <Text style={styles.priceLabel}>from</Text>
        <Text style={styles.price}>
          {product.lowestPrice != null ? `RM${product.lowestPrice.toFixed(2)}` : '—'}
        </Text>
        <View style={styles.go}>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: { width: 68, height: 68 },
  mid: { flex: 1 },
  name: { fontSize: fontSize.md - 1, fontWeight: '700', color: colors.text, lineHeight: 19 },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  sub: { fontSize: fontSize.xs, color: colors.textMuted },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  store: { flex: 1, fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  right: { alignItems: 'flex-end', minWidth: 72 },
  priceLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  price: { fontSize: fontSize.md + 1, fontWeight: '900', color: colors.primary },
  go: {
    marginTop: 6,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
