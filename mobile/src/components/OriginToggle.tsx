import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { useLocation } from '../context/LocationContext';

/**
 * Segmented control that picks the origin used for travel-distance comparison:
 * the device GPS location or the buyer's saved location.
 */
export default function OriginToggle() {
  const navigation = useNavigation<any>();
  const {
    originMode,
    setOriginMode,
    businessOrigin,
    gpsOrigin,
    gpsLoading,
    gpsError,
    refreshGps,
  } = useLocation();

  const onGpsPress = () => {
    setOriginMode('gps');
    // Always fetch a fresh fix — the user tapping this expects it to reflect
    // where they are now, not a cached reading from whenever it was first granted.
    refreshGps();
  };

  const onBusinessPress = () => {
    if (!businessOrigin) {
      navigation.navigate('BusinessLocation');
      return;
    }
    setOriginMode('business');
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Distance from</Text>
      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.option, originMode === 'gps' && styles.optionActive]}
          onPress={onGpsPress}
          activeOpacity={0.8}
        >
          {gpsLoading && originMode === 'gps' ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name="navigate"
              size={14}
              color={originMode === 'gps' ? colors.white : colors.textSecondary}
            />
          )}
          <Text
            style={[styles.optionText, originMode === 'gps' && styles.optionTextActive]}
          >
            My location
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, originMode === 'business' && styles.optionActive]}
          onPress={onBusinessPress}
          activeOpacity={0.8}
        >
          <Ionicons
            name="home"
            size={14}
            color={originMode === 'business' ? colors.white : colors.textSecondary}
          />
          <Text
            style={[
              styles.optionText,
              originMode === 'business' && styles.optionTextActive,
            ]}
          >
            {businessOrigin ? 'Saved location' : 'Set location'}
          </Text>
        </TouchableOpacity>
      </View>
      {originMode === 'gps' && gpsError ? (
        <Text style={styles.hint}>{gpsError}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    gap: 3,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    minHeight: 38,
  },
  optionActive: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  optionTextActive: {
    color: colors.white,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.discount,
    marginTop: spacing.xs,
  },
});
