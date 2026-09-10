import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize } from '../theme/theme';

export default function RatingStars({
  rating = 0,
  count,
  size = 14,
  showNumber = true,
}: {
  rating?: number;
  count?: number;
  size?: number;
  showNumber?: boolean;
}) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={styles.row}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Ionicons
          key={i}
          name={i < full ? 'star' : i === full && half ? 'star-half' : 'star-outline'}
          size={size}
          color={colors.accent}
        />
      ))}
      {showNumber && (
        <Text style={[styles.text, { fontSize: size - 1 }]}>
          {rating ? rating.toFixed(1) : 'New'}
          {count != null ? ` (${count})` : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  text: { color: colors.textSecondary, marginLeft: 4, fontWeight: '600' },
});
