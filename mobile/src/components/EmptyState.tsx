import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing } from '../theme/theme';

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
      <Ionicons name={icon} size={44} color={colors.border} />
      <Text style={styles.title}>{title}</Text>
      {!!body && <Text style={styles.body}>{body}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.sm },
  body: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
});
