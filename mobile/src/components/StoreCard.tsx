import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { Store } from '../types';
import DistanceBadge from './DistanceBadge';

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
          <Ionicons name="business-outline" size={22} color={colors.primary} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {rank ? `${rank}. ` : ''}
          {store.storeName}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {store.city || store.branch || store.state}
        </Text>
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
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, flexShrink: 1 },
  sub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
});
