import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { categoryService } from '../services/dataService';
import { Category } from '../types';

export default function CategoryGrid({
  onPick,
}: {
  onPick: (categoryId: string, label: string) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService
      .getAll()
      .then((res: any) => setCategories(res?.data || res || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />;
  }

  return (
    <View style={styles.grid}>
      {categories.map((c) => (
        <TouchableOpacity
          key={c._id}
          style={styles.item}
          activeOpacity={0.7}
          onPress={() => onPick(c._id, c.categoryName)}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={(c.icon as any) || 'pricetag-outline'} size={24} color={colors.primary} />
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {c.categoryName}
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
