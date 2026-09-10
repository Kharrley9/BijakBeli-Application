import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, fontSize, spacing } from '../theme/theme';

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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.side} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
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
          <TouchableOpacity onPress={onRightPress} style={styles.side} hitSlop={10}>
            <Ionicons name={rightIcon} size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.side} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  side: { minWidth: 40, alignItems: 'center' },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
});
