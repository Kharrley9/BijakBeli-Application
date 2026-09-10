import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, commonStyles, fontSize, radius, spacing } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Enter your email and password.');
      return;
    }
    if (mode === 'register' && !fullName.trim()) {
      Alert.alert('Missing info', 'Enter your name.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn({ email: email.trim(), password });
      } else {
        await signUp({ fullName: fullName.trim(), email: email.trim(), password });
      }
    } catch (e: any) {
      Alert.alert(
        mode === 'login' ? 'Login failed' : 'Registration failed',
        e?.message || 'Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <Ionicons name="pricetags" size={28} color={colors.primary} />
            <Text style={styles.brand}>BijakBeli</Text>
          </View>
          <Text style={styles.tagline}>Compare prices. Shop smart. Save more.</Text>

          <View style={styles.tabs}>
            {(['login', 'register'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.tab, mode === m && styles.tabActive]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                  {m === 'login' ? 'Log In' : 'Register'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'register' && (
            <Field icon="person-outline" placeholder="Full name" value={fullName} onChangeText={setFullName} />
          )}
          <Field
            icon="mail-outline"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.field}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPw((s) => !s)} hitSlop={10}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[commonStyles.primaryButton, styles.btn, busy && { opacity: 0.7 }]}
            onPress={submit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={commonStyles.primaryButtonText}>
                {mode === 'login' ? 'Log In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.or}>Or continue with</Text>
          <View style={styles.socialRow}>
            {['logo-google', 'logo-facebook', 'logo-apple'].map((ic) => (
              <TouchableOpacity
                key={ic}
                style={styles.social}
                onPress={() => Alert.alert('Coming soon', 'Social sign-in is not enabled yet.')}
              >
                <Ionicons name={ic as any} size={20} color={colors.text} />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.demo}>
            Demo — buyer: khalil@example.com / password123{'\n'}trader: merchant@bijakbeli.com / merchant123
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ icon, ...props }: any) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <TextInput style={styles.input} placeholderTextColor={colors.textMuted} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  brand: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.primary },
  tagline: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontWeight: '700', color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  input: { flex: 1, fontSize: fontSize.md, color: colors.text },
  btn: { marginTop: spacing.sm },
  or: { textAlign: 'center', color: colors.textMuted, marginVertical: spacing.lg },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  social: {
    width: 56,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demo: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xxl,
    lineHeight: 18,
  },
});
