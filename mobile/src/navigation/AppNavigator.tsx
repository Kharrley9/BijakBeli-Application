import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../context/AuthContext';
import { useUiFlags } from '../context/UiFlagsContext';
import { colors } from '../theme/theme';

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
import ComingSoonScreen from '../screens/ComingSoonScreen';
import MerchantOnboardingScreen from '../screens/MerchantOnboardingScreen';
import MerchantDashboardScreen from '../screens/MerchantDashboardScreen';
import AddEditProductScreen from '../screens/AddEditProductScreen';
import ProductManagementScreen from '../screens/ProductManagementScreen';
import StorePromotionsScreen from '../screens/StorePromotionsScreen';
import EditStoreScreen from '../screens/EditStoreScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import OrdersScreen from '../screens/OrdersScreen';
import MerchantOrderScreen from '../screens/MerchantOrderScreen';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border, height: 58, paddingBottom: 6, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<string, string> = {
            Home: focused ? 'home' : 'home-outline',
            Search: focused ? 'search' : 'search-outline',
            Nearby: focused ? 'map' : 'map-outline',
            Orders: focused ? 'receipt' : 'receipt-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={map[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Nearby" component={NearbyStoresScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { ready, onboarded, locationAsked } = useUiFlags();

  if (loading || !ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
            <RootStack.Screen name="ComingSoon" component={ComingSoonScreen} />
            <RootStack.Screen name="MerchantOnboarding" component={MerchantOnboardingScreen} />
            <RootStack.Screen name="MerchantDashboard" component={MerchantDashboardScreen} />
            <RootStack.Screen name="AddEditProduct" component={AddEditProductScreen} />
            <RootStack.Screen name="ProductManagement" component={ProductManagementScreen} />
            <RootStack.Screen name="StorePromotions" component={StorePromotionsScreen} />
            <RootStack.Screen name="EditStore" component={EditStoreScreen} />
            <RootStack.Screen name="Cart" component={CartScreen} />
            <RootStack.Screen name="Checkout" component={CheckoutScreen} />
            <RootStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
            <RootStack.Screen name="MerchantOrder" component={MerchantOrderScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
