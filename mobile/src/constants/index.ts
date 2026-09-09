import { Platform } from 'react-native';

// ======================================================
// IMPORTANT: Update this IP to your machine's local IP
// when testing on a physical device via Expo Go.
// Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
// ======================================================
const LOCAL_IP = '192.168.0.15';

const getApiUrl = () => {
  if (__DEV__) {
    // Development mode: use local server
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to reach host localhost,
      // but physical Android devices need the real IP
      return `http://${LOCAL_IP}:5000/api`;
    }
    // iOS simulator can use localhost, physical iOS needs IP
    return `http://${LOCAL_IP}:5000/api`;
  }
  // Production: use your deployed server URL
  return 'https://api.bijakbeli.com/api';
};

export const API_URL = getApiUrl();

export const PRODUCT_UNITS = [
  'kg', 'g', 'L', 'ml', 'pcs', 'pack', 'box', 'bottle', 'can', 'bag', 'unit',
];

export const PROMOTION_TYPES = [
  { value: 'discount', label: 'Discount' },
  { value: 'buy1free1', label: 'Buy 1 Free 1' },
  { value: 'bundle', label: 'Bundle Deal' },
  { value: 'clearance', label: 'Clearance' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'member', label: 'Member Only' },
];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Travel-distance comparison
export const DEFAULT_MAX_NEARBY_KM = 60;
