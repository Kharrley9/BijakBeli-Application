import './global.css';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { UiFlagsProvider } from './src/context/UiFlagsContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UiFlagsProvider>
          <AuthProvider>
            <LocationProvider>
              <AppNavigator />
              <StatusBar style="auto" />
            </LocationProvider>
          </AuthProvider>
        </UiFlagsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
