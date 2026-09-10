import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, commonStyles, fontSize, spacing } from '../theme/theme';
import { useLocation } from '../context/LocationContext';
import { useUiFlags } from '../context/UiFlagsContext';

export default function LocationPermissionScreen() {
  const { refreshGps, setOriginMode } = useLocation();
  const { markLocationAsked } = useUiFlags();
  const [busy, setBusy] = useState(false);

  const done = () => markLocationAsked();

  const enable = async () => {
    setBusy(true);
    const pos = await refreshGps();
    setBusy(false);
    if (pos) setOriginMode('gps');
    done();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Ionicons name="location-outline" size={64} color={colors.primary} />
        </View>
        <Text style={styles.title}>Use your location?</Text>
        <Text style={styles.text}>
          BijakBeli uses your location to show how far each store is and find the
          nearest one. You can change this anytime in Settings.
        </Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[commonStyles.primaryButton, busy && { opacity: 0.7 }]}
          onPress={enable}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={commonStyles.primaryButtonText}>Allow Location</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.skip} onPress={done}>
          <Text style={styles.skipText}>Not now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  text: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  footer: { padding: spacing.lg, gap: spacing.sm },
  skip: { alignItems: 'center', paddingVertical: spacing.md },
  skipText: { color: colors.textSecondary, fontWeight: '600' },
});
