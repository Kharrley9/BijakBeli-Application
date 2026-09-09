// BottomNav.js
// Reusable bottom navigation bar: Home, Compare, Budget, Profile

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing } from '../theme/theme';

const TABS = [
  { key: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'Compare', label: 'Compare', icon: 'swap-horizontal-outline', activeIcon: 'swap-horizontal' },
  { key: 'Nearby', label: 'Nearby', icon: 'map-outline', activeIcon: 'map' },
  { key: 'Budget', label: 'Budget', icon: 'wallet-outline', activeIcon: 'wallet' },
  { key: 'Profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

import { useNavigation } from '@react-navigation/native';

export default function BottomNav({ active = 'Home' }) {
  const navigation = useNavigation();
  const onNavigate = (key) => {
    if (key === 'Home') navigation.navigate('HomeDashboard');
    else if (key === 'Compare') navigation.navigate('SearchGrocery');
    else if (key === 'Nearby') navigation.navigate('NearbyStores');
    else if (key === 'Budget') navigation.navigate('ShoppingList');
    else if (key === 'Profile') navigation.navigate('Profile');
  };
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onNavigate(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={24}
                color={isActive ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
