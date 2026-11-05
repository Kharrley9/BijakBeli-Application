/**
 * CategoryCircles.tsx
 * "Shop by Category" row for the HomeScreen — one horizontally scrollable line
 * of round category photos on soft pastel rings, with a short label underneath.
 * Photos come from each category's `image` (set by server/scripts/setCategoryImages.js);
 * a category without one falls back to its Ionicon.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing } from '../theme/theme';
import { categoryService } from '../services/dataService';
import { Category } from '../types';
import { useLanguage, categoryLabel } from '../context/LanguageContext';

const SIZE = 64;

// Pastel ring colours, cycled per category.
const PASTELS = ['#FAD4DC', '#D4EDD5', '#E3C7EE', '#CDE4F7', '#FFF3C4', '#C9ECE8', '#FFE0C2', '#E0E0F8', '#F3E5D0'];

export default function CategoryCircles({
  onPick,
}: {
  onPick: (categoryId: string, label: string) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  useEffect(() => {
    categoryService
      .getAll()
      .then((res: any) => {
        const cats: Category[] = res?.data || res || [];
        cats.sort((a: any, b: any) => (a.order ?? 99) - (b.order ?? 99));
        setCategories(cats);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View>
      <Text style={styles.title}>{lang === 'ms' ? 'Kategori' : 'Shop by Category'}</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ height: SIZE + 36 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {categories.map((c, i) => {
            const image = c.image;
            const label = categoryLabel(c, lang);
            return (
              <TouchableOpacity
                key={c._id}
                style={styles.item}
                activeOpacity={0.8}
                onPress={() => onPick(c._id, label)}
              >
                <View style={[styles.ring, { backgroundColor: PASTELS[i % PASTELS.length] }]}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.photo} resizeMode="cover" />
                  ) : (
                    <Ionicons name={((c as any).icon || 'pricetag-outline') as any} size={26} color={colors.primary} />
                  )}
                </View>
                <Text style={styles.label} numberOfLines={2}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  row: { paddingHorizontal: spacing.lg, gap: spacing.md },
  item: { width: SIZE + 12, alignItems: 'center' },
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%', borderRadius: SIZE / 2 },
  label: {
    marginTop: spacing.xs + 2,
    fontSize: fontSize.xs,
    fontWeight: '600',
    lineHeight: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
