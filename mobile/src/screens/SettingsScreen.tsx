import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import AppHeader from '../components/AppHeader';
import { FormSwitch, ChipSelect } from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { getPrefs, setPref } from '../utils/prefs';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const initial = getPrefs();
  const [distanceUnit, setDistanceUnit] = useState(initial.distanceUnit);
  const [notifyOrders, setNotifyOrders] = useState(initial.notifyOrderUpdates);
  const [notifyPrices, setNotifyPrices] = useState(initial.notifyPriceAlerts);

  const changeUnit = (v: 'km' | 'mi') => {
    setDistanceUnit(v);
    setPref('distanceUnit', v);
  };
  const toggleOrders = (v: boolean) => {
    setNotifyOrders(v);
    setPref('notifyOrderUpdates', v);
  };
  const togglePrices = (v: boolean) => {
    setNotifyPrices(v);
    setPref('notifyPriceAlerts', v);
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
        <Text style={styles.groupTitle}>Distance</Text>
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
        </View>

        <Text style={styles.groupTitle}>Notifications</Text>
        <View style={styles.card}>
          <FormSwitch
            label="Order updates"
            hint="Status changes on orders you placed or received"
            value={notifyOrders}
            onValueChange={toggleOrders}
          />
          <FormSwitch
            label="Price alerts"
            hint="When a watched product drops to your target price"
            value={notifyPrices}
            onValueChange={togglePrices}
          />
        </View>

        <Text style={styles.groupTitle}>Language</Text>
        <View style={styles.card}>
          <Text style={styles.note}>
            BijakBeli currently runs in English. More languages are planned.
          </Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  groupTitle: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textMuted, marginBottom: spacing.sm, marginTop: spacing.md, textTransform: 'uppercase' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  note: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
    marginTop: spacing.lg,
  },
  logoutText: { color: colors.discount, fontWeight: '700', fontSize: fontSize.md },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.lg },
});
