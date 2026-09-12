import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { getPrefs } from '../utils/prefs';

interface Props {
  distanceKm?: number | null;
  durationMin?: number | null;
  /** Emphasise as the nearest option. */
  highlight?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function formatKm(km?: number | null): string {
  if (km == null) return '';
  if (getPrefs().distanceUnit === 'mi') {
    const mi = km * 0.621371;
    return mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi`;
  }
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export function formatDuration(min?: number | null): string {
  if (min == null) return '';
  if (min < 60) return `~${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `~${h}h ${m}m` : `~${h}h`;
}

export default function DistanceBadge({
  distanceKm,
  durationMin,
  highlight = false,
  compact = false,
  style,
}: Props) {
  if (distanceKm == null) return null;

  const parts = [formatKm(distanceKm)];
  if (durationMin != null && !compact) parts.push(formatDuration(durationMin));

  return (
    <View
      style={[
        styles.badge,
        highlight ? styles.badgeHighlight : styles.badgeDefault,
        style,
      ]}
    >
      <Ionicons
        name="location"
        size={compact ? 10 : 12}
        color={highlight ? colors.white : colors.primary}
      />
      <Text
        style={[
          compact ? styles.textCompact : styles.text,
          highlight && styles.textHighlight,
        ]}
      >
        {parts.join(' · ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeDefault: {
    backgroundColor: colors.primaryLight,
  },
  badgeHighlight: {
    backgroundColor: colors.primary,
  },
  text: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  textCompact: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  textHighlight: {
    color: colors.white,
  },
});
