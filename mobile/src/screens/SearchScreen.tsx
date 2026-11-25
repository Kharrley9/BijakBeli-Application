import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import SearchBar from '../components/SearchBar';
import CategoryCircles from '../components/CategoryCircles';
import { POPULAR_SEARCHES } from '../constants';

const KEY = 'recentSearches';

export async function pushRecentSearch(term: string) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const next = [term, ...list.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 8);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export default function SearchScreen({ navigation }: any) {
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(KEY)
        .then((raw) => setRecent(raw ? JSON.parse(raw) : []))
        .catch(() => {});
    }, [])
  );

  const go = (term: string) => {
    const t = term.trim();
    if (!t) return;
    pushRecentSearch(t);
    navigation.navigate('SearchResults', { q: t });
  };

  const clearRecent = async () => {
    await AsyncStorage.removeItem(KEY);
    setRecent([]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>Find a fresh item and compare its price</Text>
        <SearchBar
          value={q}
          onChangeText={setQ}
          onSubmit={() => go(q)}
          autoFocus
          placeholder="e.g. ayam, telur, sawi…"
          style={{ marginTop: spacing.md }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {recent.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <TouchableOpacity onPress={clearRecent} hitSlop={8}>
                <Text style={styles.clear}>Clear</Text>
              </TouchableOpacity>
            </View>
            {recent.map((t, i) => (
              <TouchableOpacity
                key={t}
                style={[styles.row, i === recent.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => go(t)}
              >
                <View style={styles.rowIcon}>
                  <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
                </View>
                <Text style={styles.rowText}>{t}</Text>
                <Ionicons name="arrow-up-outline" size={14} color={colors.textMuted} style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: spacing.md }]}>Popular searches</Text>
          <View style={styles.chips}>
            {POPULAR_SEARCHES.map((t) => (
              <TouchableOpacity key={t} style={styles.chip} onPress={() => go(t)}>
                <Ionicons name="trending-up" size={13} color={colors.primary} />
                <Text style={styles.chipText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.categories}>
          <CategoryCircles
            onPick={(id, label) => navigation.navigate('CategoryBrowse', { categoryId: id, label })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    ...shadow.sm,
    zIndex: 1,
  },
  title: { fontSize: fontSize.xl, fontWeight: '900', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.background, flexGrow: 1 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.xl,
    ...shadow.sm,
  },
  section: { marginBottom: spacing.xl },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  sectionTitle: { fontSize: fontSize.md + 1, fontWeight: '800', color: colors.text },
  clear: { color: colors.primary, fontWeight: '800', fontSize: fontSize.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    ...shadow.sm,
  },
  chipText: { fontSize: fontSize.sm, color: colors.text, fontWeight: '700' },
  // CategoryCircles has its own side padding
  categories: { marginHorizontal: -spacing.lg },
});
