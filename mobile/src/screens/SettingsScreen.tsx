import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import { ChipSelect } from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { getPrefs, setPref, Vehicle } from '../utils/prefs';
import RadiusChips from '../components/RadiusChips';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const initial = getPrefs();
  const [distanceUnit, setDistanceUnit] = useState(initial.distanceUnit);
  const [vehicle, setVehicle] = useState(initial.vehicle);
  const { lang, setLang } = useLanguage();

  const changeUnit = (v: 'km' | 'mi') => {
    setDistanceUnit(v);
    setPref('distanceUnit', v);
  };

  const changeVehicle = (v: Vehicle) => {
    setVehicle(v);
    setPref('vehicle', v);
  };

  const logout = () =>
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut },
    ]);

  return (
    <View style={styles.safe}>
      <AppHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <GroupTitle icon="navigate" text="Distance" />
        <View style={styles.card}>
          <ChipSelect
            label="Show distances in"
            options={[
              { value: 'km', label: 'Kilometres' },
              { value: 'mi', label: 'Miles' },
            ]}
            value={distanceUnit}
            onChange={changeUnit}
          />
          <Text style={styles.fieldLabel}>Search for stores</Text>
          <RadiusChips />
          <Text style={[styles.note, { marginTop: spacing.sm }]}>
            Only stores this close to you are listed and compared. Also on the Nearby tab.
          </Text>
        </View>

        <GroupTitle icon="car-sport" text="Travel cost" />
        <View style={styles.card}>
          <ChipSelect
            label="I usually travel by"
            options={[
              { value: 'car', label: 'Car' },
              { value: 'motorcycle', label: 'Motorcycle' },
            ]}
            value={vehicle}
            onChange={changeVehicle}
          />
          <Text style={styles.note}>
            Used to estimate round-trip petrol (RON95) to each store, so stores can be
            ranked by item price plus fuel.
          </Text>
        </View>

        <GroupTitle icon="language" text="Language" />
        <View style={styles.card}>
          <ChipSelect
            label="Category names"
            options={[
              { value: 'ms', label: 'Bahasa Melayu' },
              { value: 'en', label: 'English' },
            ]}
            value={lang}
            onChange={setLang}
          />
        </View>

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.discount} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>BijakBeli · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function GroupTitle({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.groupRow}>
      <View style={styles.groupIcon}>
        <Ionicons name={icon} size={13} color={colors.primary} />
      </View>
      <Text style={styles.groupTitle}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  groupRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.sm },
  groupIcon: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  groupTitle: { fontSize: fontSize.sm, fontWeight: "800", color: colors.text },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    ...shadow.sm,
  },
  note: { fontSize: fontSize.xs + 1, color: colors.textSecondary, lineHeight: 19 },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text, marginTop: spacing.xs, marginBottom: spacing.sm },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    minHeight: 50,
    marginTop: spacing.xl,
  },
  logoutText: { color: colors.discount, fontWeight: "800", fontSize: fontSize.md },
  version: { textAlign: "center", color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.lg },
});
