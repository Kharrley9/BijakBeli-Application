import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

// ── Dark theme tokens ──────────────────────────────────────────────────────
const C = {
  bg: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceHigh: '#242424',
  border: '#2E2E2E',
  borderFocus: '#4CAF50',
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  text: '#F5F5F5',
  textSub: '#9E9E9E',
  textMuted: '#5A5A5A',
  white: '#FFFFFF',
  blob1: '#2E7D32',
  blob2: '#1B5E20',
  blob3: '#388E3C',
};

// ── Animated blob component ───────────────────────────────────────────────
function BlobBackground() {
  const rotate1 = useRef(new Animated.Value(0)).current;
  const rotate2 = useRef(new Animated.Value(0)).current;
  const scale1  = useRef(new Animated.Value(1)).current;
  const scale2  = useRef(new Animated.Value(1)).current;
  const translateY1 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Blob 1 – slow rotation + scale breathe
    Animated.loop(
      Animated.parallel([
        Animated.timing(rotate1, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scale1, { toValue: 1.15, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(scale1, { toValue: 1,    duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Blob 2 – opposite rotation
    Animated.loop(
      Animated.timing(rotate2, {
        toValue: -1,
        duration: 11000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Blob 3 – float up/down
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY1, { toValue: -20, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(translateY1, { toValue:  20, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin1 = rotate1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spin2 = rotate2.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg', '0deg'] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Main large blob */}
      <Animated.View
        style={[
          styles.blob,
          {
            width: width * 0.85,
            height: width * 0.85,
            borderRadius: width * 0.43,
            backgroundColor: C.blob1,
            top: -width * 0.35,
            left: -width * 0.15,
            opacity: 0.55,
            transform: [{ rotate: spin1 }, { scale: scale1 }],
          },
        ]}
      />
      {/* Second blob */}
      <Animated.View
        style={[
          styles.blob,
          {
            width: width * 0.6,
            height: width * 0.6,
            borderRadius: width * 0.3,
            backgroundColor: C.blob2,
            top: -width * 0.1,
            right: -width * 0.2,
            opacity: 0.4,
            transform: [{ rotate: spin2 }, { translateY: translateY1 }],
          },
        ]}
      />
      {/* Accent dot */}
      <Animated.View
        style={[
          styles.blob,
          {
            width: width * 0.25,
            height: width * 0.25,
            borderRadius: width * 0.125,
            backgroundColor: C.blob3,
            top: width * 0.15,
            left: width * 0.55,
            opacity: 0.35,
            transform: [{ translateY: translateY1 }],
          },
        ]}
      />
    </View>
  );
}

// ── Animated field wrapper ─────────────────────────────────────────────────
function AnimatedField({
  anim,
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightIcon,
  onRightIcon,
}: any) {
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(focusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.border, C.borderFocus],
  });

  // ── Outer: entrance animation (useNativeDriver: true — opacity + translateY only)
  // ── Inner: border color animation (useNativeDriver: false — JS-driven color)
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        marginBottom: 12,
      }}
    >
      <Animated.View style={[styles.field, { borderColor }]}>
        <Ionicons name={icon} size={18} color={focused ? C.primary : C.textMuted} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIcon} hitSlop={10}>
            <Ionicons name={rightIcon} size={18} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────
export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [busy, setBusy]         = useState(false);

  // ── Entrance anims ──────────────────────────────────────────────────────
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const tabAnim     = useRef(new Animated.Value(0)).current;
  const field1Anim  = useRef(new Animated.Value(0)).current;
  const field2Anim  = useRef(new Animated.Value(0)).current;
  const field3Anim  = useRef(new Animated.Value(0)).current;
  const btnAnim     = useRef(new Animated.Value(0)).current;
  const socialAnim  = useRef(new Animated.Value(0)).current;
  const btnScale    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(tabAnim,    { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(field1Anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(field2Anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(field3Anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(btnAnim,    { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(socialAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
    ]).start();
  }, []);

  // Re-animate fields when mode switches
  const switchMode = (m: 'login' | 'register') => {
    if (m === mode) return;
    // fade out
    Animated.parallel([
      Animated.timing(field1Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(field2Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(field3Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setMode(m);
      // fade in
      Animated.stagger(60, [
        Animated.spring(field1Anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.spring(field2Anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.spring(field3Anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      ]).start();
    });
  };

  const onPressIn  = () => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start();

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Enter your email and password.'); return;
    }
    if (mode === 'register' && !fullName.trim()) {
      Alert.alert('Missing info', 'Enter your name.'); return;
    }
    setBusy(true);
    try {
      if (mode === 'login') await signIn({ email: email.trim(), password });
      else await signUp({ fullName: fullName.trim(), email: email.trim(), password });
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
      <BlobBackground />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Animated.View
            style={[
              styles.headerWrap,
              {
                opacity: headerAnim,
                transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
              },
            ]}
          >
            <View style={styles.logoRow}>
              <Ionicons name="pricetags" size={26} color={C.primary} />
              <Text style={styles.appName}>BijakBeli</Text>
            </View>
            <Text style={styles.tagline}>Compare prices. Shop smart. Save more.</Text>
          </Animated.View>

          {/* ── Card ── */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: tabAnim,
                transform: [{ translateY: tabAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
              },
            ]}
          >
            {/* Tab switcher */}
            <View style={styles.tabs}>
              {(['login', 'register'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.tab, mode === m && styles.tabActive]}
                  onPress={() => switchMode(m)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                    {m === 'login' ? 'Log In' : 'Register'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title */}
            <Text style={styles.formTitle}>{mode === 'login' ? 'Welcome back 👋' : 'Create account'}</Text>
            <Text style={styles.formSub}>
              {mode === 'login'
                ? 'Log in to continue shopping smart'
                : 'Join thousands of smart shoppers'}
            </Text>

            {/* Fields */}
            {mode === 'register' && (
              <AnimatedField
                anim={field1Anim}
                icon="person-outline"
                placeholder="Full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            )}
            <AnimatedField
              anim={mode === 'register' ? field2Anim : field1Anim}
              icon="mail-outline"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <AnimatedField
              anim={mode === 'register' ? field3Anim : field2Anim}
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              rightIcon={showPw ? 'eye-off-outline' : 'eye-outline'}
              onRightIcon={() => setShowPw((v) => !v)}
            />

            {mode === 'login' && (
              <Animated.View style={{ opacity: field3Anim, alignItems: 'flex-end', marginBottom: 4 }}>
                <TouchableOpacity>
                  <Text style={styles.forgot}>Forgot password?</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* CTA button */}
            <Animated.View
              style={{
                opacity: btnAnim,
                transform: [
                  { translateY: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                  { scale: btnScale },
                ],
                marginTop: 8,
              }}
            >
              <TouchableOpacity
                style={[styles.btn, busy && { opacity: 0.7 }]}
                onPress={submit}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={busy}
                activeOpacity={1}
              >
                {busy ? (
                  <ActivityIndicator color={C.white} />
                ) : (
                  <Text style={styles.btnText}>{mode === 'login' ? 'Log In' : 'Create Account'}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <Animated.View style={[styles.dividerRow, { opacity: socialAnim }]}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

            {/* Social */}
            <Animated.View
              style={[
                styles.socialRow,
                {
                  opacity: socialAnim,
                  transform: [{ translateY: socialAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                },
              ]}
            >
              {[
                { icon: 'logo-google',   label: 'Google'   },
                { icon: 'logo-facebook', label: 'Facebook' },
              ].map(({ icon, label }) => (
                <TouchableOpacity
                  key={icon}
                  style={styles.socialBtn}
                  onPress={() => Alert.alert('Coming soon', `${label} sign-in is not enabled yet.`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={icon as any} size={20} color={C.text} />
                  <Text style={styles.socialLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </Animated.View>

          {/* Footer */}
          <Animated.Text style={[styles.demo, { opacity: socialAnim }]}>
            Demo — khalil@example.com / password123
          </Animated.Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  scroll:      { flexGrow: 1, paddingHorizontal: 24, paddingTop: height * 0.07, paddingBottom: 40 },

  blob:        { position: 'absolute' },

  headerWrap:  { alignItems: 'center', marginBottom: 36 },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  appName:     { fontSize: 32, fontWeight: '800', color: C.text, letterSpacing: 1 },
  tagline:     { fontSize: 13, color: C.textSub, textAlign: 'center' },

  card: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
  },

  tabs:           { flexDirection: 'row', backgroundColor: C.surfaceHigh, borderRadius: 12, padding: 4, marginBottom: 20 },
  tab:            { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive:      { backgroundColor: C.primary },
  tabText:        { fontWeight: '600', color: C.textSub, fontSize: 14 },
  tabTextActive:  { color: C.white },

  formTitle:   { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 4 },
  formSub:     { fontSize: 13, color: C.textSub, marginBottom: 20 },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
    backgroundColor: C.surfaceHigh,
  },
  input: { flex: 1, fontSize: 15, color: C.text },

  forgot: { fontSize: 12, color: C.primary, marginBottom: 16 },

  btn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btnText: { color: C.white, fontSize: 16, fontWeight: '700' },

  dividerRow:   { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: C.border },
  dividerText:  { fontSize: 12, color: C.textMuted },

  socialRow:   { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceHigh,
  },
  socialLabel: { color: C.text, fontSize: 14, fontWeight: '500' },

  demo: { textAlign: 'center', color: C.textMuted, fontSize: 11, marginTop: 24 },
});
