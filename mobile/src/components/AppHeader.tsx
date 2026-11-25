import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, fontSize, radius, spacing } from '../theme/theme';

export default function AppHeader({
  title,
  back = true,
  right,
  onRightPress,
  rightIcon,
}: {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
  onRightPress?: () => void;
  rightIcon?: any;
}) {
  const navigation = useNavigation<any>();
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.row}>
        {back ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.side} />
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {right ? (
          <View style={styles.side}>{right}</View>
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightPress} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name={rightIcon} size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.side} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  side: { width: 40, alignItems: 'center' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.md + 1,
    fontWeight: '800',
    color: colors.text,
  },
});
