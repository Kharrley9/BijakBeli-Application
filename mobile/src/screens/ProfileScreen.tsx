import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

const MENU = [
  { key: 'orders', label: 'Order History', icon: 'receipt-outline', screen: 'Tabs', params: { screen: 'Orders' } },
  { key: 'alerts', label: 'Price Alerts', icon: 'notifications-outline', screen: 'PriceAlerts', params: {} },
  { key: 'favs', label: 'Favourite Stores', icon: 'heart-outline', screen: 'FavouriteStores', params: {} },
  { key: 'reviews', label: 'My Reviews', icon: 'star-outline', screen: 'MyReviews', params: {} },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', screen: 'Settings', params: {} },
];

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const initial = (user?.fullName || 'U').charAt(0).toUpperCase();
  const isMerchant = user?.role === 'merchant';

  const logout = () =>
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.head}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <TouchableOpacity
          style={styles.locRow}
          onPress={() => navigation.navigate('BusinessLocation')}
        >
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.locLabel}>Saved location</Text>
            <Text style={styles.locValue} numberOfLines={1}>
              {user?.businessLocation?.label ||
                (user?.businessLocation?.coordinates ? 'Location set' : 'Not set — tap to add')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.card}>
          {MENU.map((m, i) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.menuRow, i === MENU.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate(m.screen, m.params)}
            >
              <Ionicons name={m.icon as any} size={20} color={colors.textSecondary} />
              <Text style={styles.menuText}>{m.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.merchantCta}
          onPress={() =>
            navigation.navigate(isMerchant ? 'MerchantDashboard' : 'MerchantOnboarding')
          }
        >
          <Ionicons name="storefront" size={22} color={colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={styles.merchantTitle}>
              {isMerchant ? 'My Store' : 'Register Your Store'}
            </Text>
            <Text style={styles.merchantSub}>
              {isMerchant
                ? 'Manage products, prices and orders'
                : 'List your shop and start selling on BijakBeli'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.discount} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  head: { alignItems: 'center', paddingVertical: spacing.lg },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.white },
  name: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  email: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  locLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  locValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600', marginTop: 2 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuText: { flex: 1, fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  merchantCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  merchantTitle: { color: colors.white, fontWeight: '800', fontSize: fontSize.md },
  merchantSub: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.xs, marginTop: 2 },
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
  },
  logoutText: { color: colors.discount, fontWeight: '700', fontSize: fontSize.md },
});
