import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import { Store } from '../types';
import DistanceBadge from './DistanceBadge';
import { imageSource } from '../utils/imageSource';

/** "Giant Tampoi" -> "Tampoi"; otherwise the branch or town. */
function branchLine(store: Store): string {
  const mall = store.mallName || '';
  if (mall && mall.toLowerCase().startsWith(store.storeName.toLowerCase())) {
    const rest = mall.slice(store.storeName.length).trim();
    if (rest) {
      const town = store.city && !rest.toLowerCase().includes(store.city.toLowerCase()) ? `, ${store.city}` : '';
      return `${rest}${town}`;
    }
  }
  return store.city || store.branch || store.state || '';
}

export default function StoreCard({
  store,
  onPress,
  rank,
}: {
  store: Store;
  onPress: () => void;
  rank?: number;
}) {
  const nearest = rank === 1;
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.75} onPress={onPress}>
      <View style={styles.logo}>
        {store.logo || store.bannerImage ? (
          <Image source={imageSource((store.logo || store.bannerImage)!)} style={styles.logoImg} resizeMode="cover" />
        ) : (
          <Ionicons name="storefront-outline" size={24} color={colors.primary} />
        )}
        {!!rank && (
          <View style={[styles.rank, nearest && styles.rankFirst]}>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {store.storeName}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {branchLine(store)}
        </Text>
        {store.distanceKm != null && (
          <DistanceBadge
            distanceKm={store.distanceKm}
            durationMin={store.durationMin}
            highlight={nearest}
            style={{ marginTop: 6 }}
          />
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: { width: 64, height: 64, borderRadius: radius.md },
  rank: {
    position: 'absolute',
    top: -6,
    left: -6,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: radius.full,
    backgroundColor: colors.primaryDark,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankFirst: { backgroundColor: colors.accent },
  rankText: { fontSize: 10, fontWeight: '900', color: colors.white },
  name: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  sub: { fontSize: fontSize.sm - 1, color: colors.textSecondary, marginTop: 2 },
});
