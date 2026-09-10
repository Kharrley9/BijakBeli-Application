import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { Store } from '../types';
import { categoryLabel } from '../constants';
import DistanceBadge from './DistanceBadge';
import RatingStars from './RatingStars';

export default function StoreCard({
  store,
  onPress,
  rank,
}: {
  store: Store;
  onPress: () => void;
  rank?: number;
}) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.logo}>
        {store.logo ? (
          <Image source={{ uri: store.logo }} style={styles.logoImg} />
        ) : (
          <Ionicons
            name={store.kind === 'merchant' ? 'storefront-outline' : 'business-outline'}
            size={22}
            color={colors.primary}
          />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {rank ? `${rank}. ` : ''}
            {store.storeName}
          </Text>
          {store.kind === 'merchant' && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Trader</Text>
            </View>
          )}
        </View>
        <Text style={styles.sub} numberOfLines={1}>
          {categoryLabel(store.storeCategory)} · {store.city || store.branch || store.state}
        </Text>
        <View style={styles.metaRow}>
          {!!store.rating && <RatingStars rating={store.rating} count={store.reviewCount} size={12} />}
          {store.deliveryAvailable && (
            <Text style={styles.delivery}>
              <Ionicons name="bicycle-outline" size={11} /> RM{(store.deliveryFee || 0).toFixed(0)}
            </Text>
          )}
        </View>
      </View>

      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        {store.distanceKm != null && (
          <DistanceBadge distanceKm={store.distanceKm} durationMin={store.durationMin} highlight={rank === 1} />
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: 46, height: 46 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, flexShrink: 1 },
  tag: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tagText: { fontSize: 9, fontWeight: '800', color: colors.white },
  sub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4 },
  delivery: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
});
