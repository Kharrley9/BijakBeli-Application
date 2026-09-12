import './global.css';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { UiFlagsProvider } from './src/context/UiFlagsContext';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import { loadPrefs } from './src/utils/prefs';

export default function App() {
  useEffect(() => {
    loadPrefs();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UiFlagsProvider>
          <AuthProvider>
            <LocationProvider>
              <CartProvider>
                <AppNavigator />
                <StatusBar style="auto" />
              </CartProvider>
            </LocationProvider>
          </AuthProvider>
        </UiFlagsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
