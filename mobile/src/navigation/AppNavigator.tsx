import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeDashboardScreen from '../screens/HomeDashboardScreen';
import SearchGroceryScreen from '../screens/SearchGroceryScreen';
import PriceComparisonScreen from '../screens/PriceComparisonScreen';
import WeeklyPromotionsScreen from '../screens/WeeklyPromotionsScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminStatesScreen from '../screens/AdminStatesScreen';
import AdminStoresScreen from '../screens/AdminStoresScreen';
import AddEditStoreScreen from '../screens/AddEditStoreScreen';
import AdminProductListScreen from '../screens/AdminProductListScreen';
import NearbyStoresScreen from '../screens/NearbyStoresScreen';
import BusinessLocationScreen from '../screens/BusinessLocationScreen';

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Splash" component={SplashScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="HomeDashboard" component={HomeDashboardScreen} />
      <AppStack.Screen name="SearchGrocery" component={SearchGroceryScreen} />
      <AppStack.Screen name="PriceComparison" component={PriceComparisonScreen} />
      <AppStack.Screen name="NearbyStores" component={NearbyStoresScreen} />
      <AppStack.Screen name="BusinessLocation" component={BusinessLocationScreen} />
      <AppStack.Screen name="WeeklyPromotions" component={WeeklyPromotionsScreen} />
      <AppStack.Screen name="ShoppingList" component={ShoppingListScreen} />
      <AppStack.Screen name="Profile" component={ProfileScreen} />
      <AppStack.Screen name="AdminStates" component={AdminStatesScreen} />
      <AppStack.Screen name="AdminStores" component={AdminStoresScreen} />
      <AppStack.Screen name="AddEditStore" component={AddEditStoreScreen} />
      <AppStack.Screen name="AdminProductList" component={AdminProductListScreen} />
    </AppStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F5E9' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
