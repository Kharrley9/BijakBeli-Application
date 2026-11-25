import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../context/AuthContext';
import { useUiFlags } from '../context/UiFlagsContext';
import { colors, fontSize, radius, shadow } from '../theme/theme';

import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import LocationPermissionScreen from '../screens/LocationPermissionScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import CategoryBrowseScreen from '../screens/CategoryBrowseScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import PriceComparisonScreen from '../screens/PriceComparisonScreen';
import NearbyStoresScreen from '../screens/NearbyStoresScreen';
import StoreProfileScreen from '../screens/StoreProfileScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BusinessLocationScreen from '../screens/BusinessLocationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ReportPriceScreen from '../screens/ReportPriceScreen';
import ScanScreen from '../screens/ScanScreen';
import LinkBarcodeScreen from '../screens/LinkBarcodeScreen';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, [string, string]> = {
  Home: ['home', 'home-outline'],
  Search: ['search', 'search-outline'],
  Nearby: ['map', 'map-outline'],
  Profile: ['person', 'person-outline'],
};

function Tabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          height: 74 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          ...shadow.md,
        },
        tabBarIconStyle: { width: 52, height: 28 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2, lineHeight: 15 },
        tabBarIcon: ({ color, focused }) => {
          const [on, off] = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline'];
          // Active tab: icon on a soft green pill
          return (
            <View style={[tabStyles.pill, focused && tabStyles.pillOn]}>
              <Ionicons name={(focused ? on : off) as any} size={21} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Nearby" component={NearbyStoresScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { ready, onboarded, locationAsked } = useUiFlags();

  if (loading || !ready) {
    return (
      <View style={tabStyles.splash}>
        <View style={tabStyles.splashLogo}>
          <Ionicons name="pricetags" size={36} color={colors.white} />
        </View>
        <Text style={tabStyles.splashName}>BijakBeli</Text>
        <ActivityIndicator color={colors.white} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!onboarded ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !user ? (
          <RootStack.Screen name="Auth" component={AuthScreen} />
        ) : !locationAsked ? (
          <RootStack.Screen name="LocationPermission" component={LocationPermissionScreen} />
        ) : (
          <>
            <RootStack.Screen name="Tabs" component={Tabs} />
            <RootStack.Screen name="SearchResults" component={SearchResultsScreen} />
            <RootStack.Screen name="CategoryBrowse" component={CategoryBrowseScreen} />
            <RootStack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <RootStack.Screen name="PriceComparison" component={PriceComparisonScreen} />
            <RootStack.Screen name="StoreProfile" component={StoreProfileScreen} />
            <RootStack.Screen name="BusinessLocation" component={BusinessLocationScreen} />
            <RootStack.Screen name="Settings" component={SettingsScreen} />
            <RootStack.Screen name="ReportPrice" component={ReportPriceScreen} />
            <RootStack.Screen name="Scan" component={ScanScreen} options={{ animation: 'slide_from_bottom' }} />
            <RootStack.Screen name="LinkBarcode" component={LinkBarcodeScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// Screens sit on the soft page colour, so a screen that has not drawn yet never flashes white.
const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.background, card: colors.white },
};

const tabStyles = StyleSheet.create({
  pill: {
    width: 52,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOn: { backgroundColor: colors.primaryLight },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  splashLogo: {
    width: 76,
    height: 76,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashName: { marginTop: 14, fontSize: fontSize.xl, fontWeight: '900', color: colors.white, letterSpacing: 0.5 },
});
