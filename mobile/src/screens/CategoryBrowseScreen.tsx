import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import CatalogList from '../components/CatalogList';
import { categoryService } from '../services/dataService';
import { categoryLabel } from '../constants';

export default function CategoryBrowseScreen({ route }: any) {
  const { group, label } = route.params || {};
  const [subCats, setSubCats] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState<string | undefined>(undefined);

  useEffect(() => {
    categoryService
      .getByGroup(group)
      .then((res: any) => setSubCats(res?.data || res || []))
      .catch(() => {});
  }, [group]);

  return (
    <View style={styles.safe}>
      <AppHeader title={label || categoryLabel(group)} />

      {subCats.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
          style={styles.catBar}
        >
          <Chip label="All" active={!activeCat} onPress={() => setActiveCat(undefined)} />
          {subCats.map((c) => (
            <Chip
              key={c._id}
              label={c.categoryName}
              active={activeCat === c._id}
              onPress={() => setActiveCat(c._id)}
            />
          ))}
        </ScrollView>
      )}

      <CatalogList
        baseParams={activeCat ? { categoryId: activeCat } : { group }}
      />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  catBar: { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.border },
  catRow: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    maxWidth: 160,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.white },
});
