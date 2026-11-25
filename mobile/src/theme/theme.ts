// Shared colors, spacing, shadows and common styles for the BijakBeli app.
//
// Look: fresh-market green on a soft green-grey page, content on white rounded
// cards with a light shadow; amber marks deals and "best value".
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  // Brand green (white text on `primary` passes WCAG AA)
  primaryDark: '#0F5132',
  primary: '#15803D',
  primaryMid: '#22A055',
  primaryLight: '#E6F4EA',
  primarySoft: '#F2FAF4',

  // Deals / highlights
  accent: '#F59E0B',
  accentDark: '#B45309',
  accentLight: '#FEF3C7',

  // Price went up / errors / log out
  discount: '#DC2626',
  dangerLight: '#FDECEC',
  // Malls on the map, info notes
  info: '#2563EB',
  infoLight: '#E8EFFD',

  bestPrice: '#15803D',
  /** Page background behind cards. */
  background: '#F3F6F4',
  /** Inputs, image placeholders, quiet fills. */
  surface: '#EEF3F0',
  border: '#E2E8E4',
  divider: '#EDF1EE',
  text: '#14231B',
  textSecondary: '#56645C',
  textMuted: '#8C9891',
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
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
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

/** Soft shadows (iOS shadow* + Android elevation). */
export const shadow = {
  sm: {
    shadowColor: '#0B3D1C',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  } as ViewStyle,
  md: {
    shadowColor: '#0B3D1C',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  } as ViewStyle,
};

const card: ViewStyle = {
  backgroundColor: colors.white,
  borderRadius: radius.lg,
  padding: spacing.lg,
  ...shadow.sm,
};
const primaryButton: ViewStyle = {
  flexDirection: 'row',
  gap: spacing.sm,
  backgroundColor: colors.primary,
  borderRadius: radius.md,
  minHeight: 50,
  paddingHorizontal: spacing.lg,
  alignItems: 'center',
  justifyContent: 'center',
};
const primaryButtonText: TextStyle = {
  color: colors.white,
  fontSize: fontSize.md,
  fontWeight: '700',
};
const secondaryButton: ViewStyle = {
  flexDirection: 'row',
  gap: spacing.sm,
  backgroundColor: colors.primaryLight,
  borderRadius: radius.md,
  minHeight: 50,
  paddingHorizontal: spacing.lg,
  alignItems: 'center',
  justifyContent: 'center',
};
const secondaryButtonText: TextStyle = {
  color: colors.primary,
  fontSize: fontSize.md,
  fontWeight: '700',
};
const screenPadding: ViewStyle = { paddingHorizontal: spacing.lg };
const sectionTitle: TextStyle = { fontSize: fontSize.lg, fontWeight: '800', color: colors.text };

export const commonStyles = StyleSheet.create({
  card,
  primaryButton,
  primaryButtonText,
  secondaryButton,
  secondaryButtonText,
  screenPadding,
  sectionTitle,
});
