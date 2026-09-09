import './global.css';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </LocationProvider>
    </AuthProvider>
  );
}
