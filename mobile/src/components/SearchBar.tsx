import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';

export default function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search products...',
  editable = true,
  onPress,
  onRightPress,
  autoFocus,
  style,
}: {
  value?: string;
  onChangeText?: (t: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  editable?: boolean;
  onPress?: () => void;
  onRightPress?: () => void;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inner = (
    <View style={[styles.bar, style]}>
      <Ionicons name="search" size={18} color={colors.primary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        editable={editable}
        autoFocus={autoFocus}
        returnKeyType="search"
        pointerEvents={editable ? 'auto' : 'none'}
      />
      {!!value && editable && (
        <TouchableOpacity onPress={() => onChangeText?.('')} hitSlop={10} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}
      {/* Search button, only where there is something to submit */}
      {(onRightPress || onSubmit) ? (
        <TouchableOpacity
          onPress={onRightPress || onSubmit}
          style={styles.goBtn}
          hitSlop={8}
          accessibilityLabel="Search"
        >
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: spacing.sm }} />
      )}
    </View>
  );

  if (!editable && onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.md + 2,
    paddingRight: 5,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: fontSize.md, color: colors.text, paddingVertical: 0 },
  goBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
