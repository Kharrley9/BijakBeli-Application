import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';

export default function EmptyState({
  icon = 'file-tray-outline',
  title,
  body,
  children,
}: {
  icon?: any;
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!body && <Text style={styles.body}>{body}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.md + 1, fontWeight: '800', color: colors.text, marginTop: spacing.sm, textAlign: 'center' },
  body: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
});
