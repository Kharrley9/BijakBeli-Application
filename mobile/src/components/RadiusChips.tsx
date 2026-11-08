import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { getPrefs, onPrefsChange, RADIUS_OPTIONS, setPref } from '../utils/prefs';

/** The buyer's search radius (km), kept in sync when it changes anywhere in the app. */
export function useRadiusKm(): number {
  const [km, setKm] = useState(getPrefs().radiusKm);
  useEffect(() => onPrefsChange(() => setKm(getPrefs().radiusKm)), []);
  return km;
}

/** The next wider radius choice, or null when already at the widest. */
export function widerRadius(km: number): number | null {
  return RADIUS_OPTIONS.find((r) => r > km) ?? null;
}

/** The smallest radius choice that reaches `km`, or the widest one. */
export function radiusCovering(km: number): number {
  return RADIUS_OPTIONS.find((r) => r >= km) ?? RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1];
}

/**
 * Shown when no store within the radius sells an item: names the closest one
 * that does and offers to widen the radius to reach it.
 */
export function OutsideRadiusNotice({
  radiusKm,
  nearestBeyond,
}: {
  radiusKm: number;
  nearestBeyond?: { storeName: string; mallName?: string; city?: string; distanceKm?: number | null } | null;
}) {
  const reachable = nearestBeyond?.distanceKm != null && nearestBeyond.distanceKm <= RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1];
  const target = reachable ? radiusCovering(nearestBeyond!.distanceKm!) : widerRadius(radiusKm);
  const where = nearestBeyond ? [nearestBeyond.mallName, nearestBeyond.city].filter(Boolean).join(', ') : '';
  return (
    <View style={styles.notice}>
      <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.noticeTitle}>No store within {radiusKm} km sells this</Text>
        {nearestBeyond && nearestBeyond.distanceKm != null && (
          <Text style={styles.noticeBody}>
            Closest: {nearestBeyond.storeName}
            {where ? ` (${where})` : ''}, {nearestBeyond.distanceKm} km away
          </Text>
        )}
        {target != null && target > radiusKm && (
          <TouchableOpacity onPress={() => setPref('radiusKm', target)} style={styles.noticeBtn}>
            <Text style={styles.noticeBtnText}>Show stores within {target} km</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/** "Within: 5 km · 10 km · 20 km …" row; picking one saves it for the whole app. */
export default function RadiusChips({ style }: { style?: any }) {
  const km = useRadiusKm();
  return (
    <View style={[styles.wrap, style]}>
      <Ionicons name="radio-outline" size={15} color={colors.textSecondary} />
      <Text style={styles.label}>Within</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {RADIUS_OPTIONS.map((r) => {
          const active = r === km;
          return (
            <TouchableOpacity
              key={r}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setPref('radiusKm', r)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{r} km</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary },
  row: { gap: 6, paddingRight: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.white },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noticeTitle: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  noticeBody: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2, lineHeight: 19 },
  noticeBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  noticeBtnText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '700' },
});
