// ProfileScreen.js
// Profile — User profile info, account settings, options

import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';

import { useState } from 'react';
import UserPreferencesModal from '../components/UserPreferencesModal';

const MENU_ITEMS = [
  { id: '1', title: 'My Orders', icon: 'receipt-outline', route: 'MyOrders' },
  { id: '2', title: 'Shopping List', icon: 'list-outline', route: 'ShoppingList' },
  { id: '3', title: 'Preferred State & Stores', icon: 'options-outline', action: 'location' },
  { id: '4', title: 'Business Location', icon: 'storefront-outline', route: 'BusinessLocation' },
  { id: '5', title: 'Notifications', icon: 'notifications-outline', route: 'Notifications' },
  { id: '6', title: 'Settings', icon: 'settings-outline', route: 'Settings' },
  { id: '7', title: 'Help & Support', icon: 'help-circle-outline', route: 'HelpSupport' },
];

export default function ProfileScreen({ navigation }) {
  const { user, signOut, refreshUser } = useAuth();
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  const userName = user?.fullName || 'User';
  const userEmail = user?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();

  const handlePreferencesSaved = async () => {
    setShowPreferencesModal(false);
    if (refreshUser) {
      await refreshUser();
    }
  };

  const handleItemPress = (item) => {
    if (item.action === 'location') {
      setShowPreferencesModal(true);
    } else if (item.route) {
      navigation?.navigate?.(item.route);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            // Navigation back to login is handled automatically by AppNavigator
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header Area (Dark Green) */}
          <View style={styles.headerSection}>
            <View style={styles.profileInfoWrap}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
              <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{userEmail}</Text>
              <TouchableOpacity style={styles.editButton}>
                <Ionicons name="pencil" size={18} color={colors.white} />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu Options */}
          <View style={styles.contentSection}>
            <View style={[commonStyles.card, styles.menuCard]}>
              {user?.role === 'admin' && (
                <TouchableOpacity 
                  style={styles.menuRow}
                  onPress={() => navigation?.navigate?.('AdminStates')}
                >
                  <View style={styles.menuIconWrap}>
                    <Ionicons name="list-circle" size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.menuText, { color: colors.primary }]}>Admin: Products</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.border} />
                </TouchableOpacity>
              )}

              {MENU_ITEMS.map((item, index) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[
                    styles.menuRow,
                    index === MENU_ITEMS.length - 1 && styles.menuRowLast
                  ]}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={styles.menuIconWrap}>
                    <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuText}>{item.title}</Text>
                    {item.id === '4' && (
                      <Text style={styles.menuSubtext} numberOfLines={1}>
                        {user?.businessLocation?.label ||
                          (user?.businessLocation?.coordinates ? 'Location set' : 'Not set')}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.border} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={colors.discount} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <BottomNav active="Profile" />
      </View>
      
      <UserPreferencesModal 
        visible={showPreferencesModal} 
        onClose={() => setShowPreferencesModal(false)}
        onSaveSuccess={handlePreferencesSaved}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    paddingBottom: spacing.xxl * 2, // Ensure it clears BottomNav
  },
  
  /* Header Area */
  headerSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + spacing.xl,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  profileInfoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.primary,
  },
  profileDetails: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: fontSize.md,
    color: colors.primaryLight,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  editButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  /* Content & Menu */
  contentSection: {
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.xl, // Negative margin to overlap the header card visually
  },
  menuCard: {
    padding: 0, // Override default card padding so rows can stretch edge-to-edge
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuIconWrap: {
    width: 36,
    alignItems: 'flex-start',
  },
  menuText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
  },
  menuSubtext: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  
  /* Logout */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xxl,
    minHeight: 48,
  },
  logoutText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.discount, // Red color from theme for logout
  },
});
