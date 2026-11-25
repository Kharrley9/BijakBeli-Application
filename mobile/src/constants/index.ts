import { Platform } from 'react-native';

// ======================================================
// Dev server address.
//  - Android emulator  -> 10.0.2.2 (host loopback alias)
//  - Physical device   -> your PC's Wi-Fi IP (ipconfig), same Wi-Fi network — set below
//  - iOS simulator     -> localhost works
// Currently set to the PC's LAN IP so a physical phone (on the same Wi-Fi) can reach
// the backend. Switch back to '10.0.2.2' if you go back to testing on the emulator.
// ======================================================
const LOCAL_IP = '192.168.0.54';

// The API hosted on Render (render.yaml). If Render gave the service another name,
// set EXPO_PUBLIC_API_URL in mobile/.env instead of editing this.
const CLOUD_API_URL = 'https://bijakbeli-api.onrender.com/api';

const getApiUrl = () => {
  // mobile/.env: EXPO_PUBLIC_API_URL=https://…/api — wins in dev and release builds
  // (Expo bakes EXPO_PUBLIC_* values in when the bundle is built).
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  if (__DEV__) {
    if (Platform.OS === 'android') return `http://${LOCAL_IP}:5000/api`;
    return `http://localhost:5000/api`;
  }
  return CLOUD_API_URL;
};

export const API_URL = getApiUrl();

export const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Lowest Price' },
  { value: 'nearest', label: 'Nearest' },
  { value: '-createdAt', label: 'Newest' },
] as const;

export const POPULAR_SEARCHES = [
  'Ayam', 'Telur', 'Udang', 'Kembung', 'Cili', 'Sawi', 'Pisang', 'Tomato',
];

export const ONBOARDING_SLIDES = [
  {
    title: 'Compare Prices',
    body: 'See the price of fresh food — chicken, fish, vegetables, fruit — across major supermarkets in one place.',
    icon: 'pricetags-outline',
  },
  {
    title: 'Find Nearby Stores',
    body: 'Sort by distance and drive time — buy where it actually costs you less to shop.',
    icon: 'navigate-outline',
  },
  {
    title: 'Shop Smart',
    body: 'Catch weekly deals and promotions from AEON BiG, Lotus\'s, MYDIN and more.',
    icon: 'pricetag-outline',
  },
];
