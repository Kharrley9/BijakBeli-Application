import { Platform } from 'react-native';

// ======================================================
// Dev server address.
//  - Android emulator  -> 10.0.2.2 (host loopback alias) — the default below
//  - Physical device   -> set LOCAL_IP to your PC's Wi-Fi IP (ipconfig), same network
//  - iOS simulator     -> localhost works
// ======================================================
const LOCAL_IP = '10.0.2.2';

const getApiUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return `http://${LOCAL_IP}:5000/api`;
    }
    // iOS simulator can use localhost, physical iOS needs the LAN IP
    return `http://localhost:5000/api`;
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
