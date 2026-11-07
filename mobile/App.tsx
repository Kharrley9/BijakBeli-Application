import './global.css';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { UiFlagsProvider } from './src/context/UiFlagsContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { loadPrefs } from './src/utils/prefs';

export default function App() {
  useEffect(() => {
    loadPrefs();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
        <UiFlagsProvider>
          <AuthProvider>
            <LocationProvider>
              <AppNavigator />
              <StatusBar style="auto" />
            </LocationProvider>
          </AuthProvider>
        </UiFlagsProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
