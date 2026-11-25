import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import { ONBOARDING_SLIDES } from '../constants';
import { useUiFlags } from '../context/UiFlagsContext';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { completeOnboarding } = useUiFlags();
  const [index, setIndex] = useState(0);
  // Slides take the list height so their content can be centred vertically
  const [listH, setListH] = useState(0);
  const listRef = useRef<FlatList>(null);
  const last = index === ONBOARDING_SLIDES.length - 1;

  const finish = () => completeOnboarding();

  const next = () => {
    if (last) return finish();
    listRef.current?.scrollToIndex({ index: index + 1 });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.brandRow}>
        <Ionicons name="pricetags" size={22} color={colors.primary} />
        <Text style={styles.brand}>BijakBeli</Text>
        {!last && (
          <TouchableOpacity onPress={finish} style={styles.skip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        onLayout={(e) => setListH(e.nativeEvent.layout.height)}
        data={ONBOARDING_SLIDES}
        keyExtractor={(s) => s.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }, listH ? { height: listH } : null]}>
            <View style={styles.iconRing}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon as any} size={60} color={colors.white} />
              </View>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {ONBOARDING_SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={commonStyles.primaryButton} onPress={next}>
          <Text style={commonStyles.primaryButtonText}>
            {last ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  brand: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primary, flex: 1 },
  skip: { padding: spacing.sm },
  skipText: { color: colors.textSecondary, fontWeight: '600' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  iconRing: {
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  body: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 22 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});
