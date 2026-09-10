import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import SearchBar from '../components/SearchBar';
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
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={q}
            onChangeText={setQ}
            onSubmit={() => go(q)}
            autoFocus
            placeholder="Search products..."
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {recent.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <TouchableOpacity onPress={clearRecent}>
                <Text style={styles.clear}>Clear</Text>
              </TouchableOpacity>
            </View>
            {recent.map((t) => (
              <TouchableOpacity key={t} style={styles.row} onPress={() => go(t)}>
                <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                <Text style={styles.rowText}>{t}</Text>
                <Ionicons name="arrow-up-outline" size={14} color={colors.textMuted} style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular searches</Text>
          <View style={styles.chips}>
            {POPULAR_SEARCHES.map((t) => (
              <TouchableOpacity key={t} style={styles.chip} onPress={() => go(t)}>
                <Text style={styles.chipText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  scroll: { padding: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  clear: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1, fontSize: fontSize.md, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
});
