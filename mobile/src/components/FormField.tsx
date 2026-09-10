import React from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/theme';

/** Labelled text input. */
export function FormField({
  label,
  hint,
  error,
  style,
  ...props
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !!error && styles.inputError, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {!!error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !!hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Labelled on/off row. */
export function FormSwitch({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {!!hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={colors.white}
      />
    </View>
  );
}

/** Horizontal single-select chip row. */
export function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <TouchableOpacity
              key={o.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(o.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.discount },
  hint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  error: { fontSize: fontSize.xs, color: colors.discount, marginTop: 4 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.white },
});
