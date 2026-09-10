import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { STORE_CATEGORIES } from '../constants';

export default function CategoryGrid({
  onPick,
}: {
  onPick: (slug: string, label: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {STORE_CATEGORIES.map((c) => (
        <TouchableOpacity
          key={c.slug}
          style={styles.item}
          activeOpacity={0.7}
          onPress={() => onPick(c.slug, c.label)}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={c.icon as any} size={24} color={colors.primary} />
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {c.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  item: { width: '23%', alignItems: 'center', gap: spacing.xs },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});
