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
import { Circle } from 'react-native-svg';
import FillSvg from '../components/FillSvg';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const initial = (user?.fullName || 'U').charAt(0).toUpperCase();

  const logout = () =>
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut },
    ]);

  const savedLocation =
    user?.businessLocation?.label ||
    (user?.businessLocation?.coordinates ? 'Location set' : 'Not set — tap to add');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profile</Text>

        <View style={styles.head}>
          <FillSvg>
            <Circle cx="90%" cy="10%" r="70" fill="#FFFFFF" fillOpacity="0.08" />
            <Circle cx="8%" cy="110%" r="60" fill="#FFFFFF" fillOpacity="0.06" />
          </FillSvg>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{user?.fullName}</Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>

        <Text style={styles.groupTitle}>Shopping</Text>
        <View style={styles.card}>
          <MenuRow
            icon="location"
            tint={colors.primary}
            bg={colors.primaryLight}
            label="Saved location"
            value={savedLocation}
            onPress={() => navigation.navigate('BusinessLocation')}
          />
          <MenuRow
            icon="scan"
            tint={colors.accentDark}
            bg={colors.accentLight}
            label="Scan an item"
            value="Photo or QR label"
            onPress={() => navigation.navigate('Scan')}
          />
          <MenuRow
            icon="map"
            tint={colors.info}
            bg={colors.infoLight}
            label="Stores near me"
            onPress={() => navigation.navigate('Nearby')}
            last
          />
        </View>

        <Text style={styles.groupTitle}>App</Text>
        <View style={styles.card}>
          <MenuRow
            icon="settings"
            tint={colors.textSecondary}
            bg={colors.background}
            label="Settings"
            value="Distance, travel cost, language"
            onPress={() => navigation.navigate('Settings')}
            last
          />
        </View>

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.discount} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Prices from PriceCatcher, KPDN (data.gov.my){'\n'}BijakBeli · v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  tint,
  bg,
  label,
  value,
  onPress,
  last,
}: {
  icon: any;
  tint: string;
  bg: string;
  label: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.menuRow, last && { borderBottomWidth: 0 }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuText}>{label}</Text>
        {!!value && <Text style={styles.menuValue} numberOfLines={1}>{value}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  pageTitle: { fontSize: fontSize.xl, fontWeight: '900', color: colors.text, marginBottom: spacing.md },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadow.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.xxl - 2, fontWeight: '900', color: colors.primary },
  name: { fontSize: fontSize.lg, fontWeight: '800', color: colors.white },
  email: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  groupTitle: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { fontSize: fontSize.md, color: colors.text, fontWeight: '700' },
  menuValue: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    minHeight: 50,
    marginTop: spacing.xl,
  },
  logoutText: { color: colors.discount, fontWeight: '800', fontSize: fontSize.md },
  footer: { textAlign: 'center', color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.lg, lineHeight: 17 },
});
