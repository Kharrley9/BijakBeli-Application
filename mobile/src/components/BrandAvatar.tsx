import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

// Distinct, readable-with-white-text swatches — picked by a deterministic hash of the
// brand name so each brand always gets the same color without storing one per brand.
const PALETTE = [
  '#2E7D32', '#1565C0', '#AD1457', '#6A1B9A', '#EF6C00',
  '#00838F', '#C62828', '#4527A0', '#2E7D32', '#5D4037',
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function initialsFor(brandName: string): string {
  const words = brandName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function BrandAvatar({
  brandName,
  size = 28,
  style,
}: {
  brandName: string;
  size?: number;
  style?: ViewStyle;
}) {
  const color = PALETTE[hashString(brandName) % PALETTE.length];
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initialsFor(brandName)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
