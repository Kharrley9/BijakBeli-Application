// Shared colors, spacing, and common styles for the BijakBeli app.
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  primaryDark: '#1B5E20',
  primary: '#2E7D32',
  primaryLight: '#E8F5E9',
  accent: '#F9A825',
  discount: '#E53935',
  bestPrice: '#2E7D32',
  background: '#FFFFFF',
  surface: '#F7F9F8',
  border: '#E0E0E0',
  text: '#212121',
  textSecondary: '#757575',
  textMuted: '#9E9E9E',
  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
};

const card: ViewStyle = {
  backgroundColor: colors.white,
  borderRadius: radius.md,
  padding: spacing.lg,
  borderWidth: 1,
  borderColor: colors.border,
};
const primaryButton: ViewStyle = {
  backgroundColor: colors.primary,
  borderRadius: radius.md,
  paddingVertical: spacing.md + 2,
  alignItems: 'center',
  justifyContent: 'center',
};
const primaryButtonText: TextStyle = {
  color: colors.white,
  fontSize: fontSize.md,
  fontWeight: '600',
};
const screenPadding: ViewStyle = { paddingHorizontal: spacing.lg };
const sectionTitle: TextStyle = { fontSize: fontSize.lg, fontWeight: '700', color: colors.text };

export const commonStyles = StyleSheet.create({
  card,
  primaryButton,
  primaryButtonText,
  screenPadding,
  sectionTitle,
});
