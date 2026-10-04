import { Platform } from 'react-native';

// ======================================================
// Dev server address.
//  - Android emulator  -> 10.0.2.2 (host loopback alias)
//  - Physical device   -> your PC's Wi-Fi IP (ipconfig), same Wi-Fi network — set below
//  - iOS simulator     -> localhost works
// Currently set to the PC's LAN IP so a physical phone (on the same Wi-Fi) can reach
// the backend. Switch back to '10.0.2.2' if you go back to testing on the emulator.
// ======================================================
const LOCAL_IP = '10.4.57.225';

const getApiUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') return `http://${LOCAL_IP}:5000/api`;
    return `http://localhost:5000/api`;
  }
  return 'https://api.bijakbeli.com/api';
};

export const API_URL = getApiUrl();

export const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Lowest Price' },
  { value: 'nearest', label: 'Nearest' },
  { value: '-createdAt', label: 'Newest' },
] as const;

export const DEFAULT_MAX_NEARBY_KM = 60;

export const POPULAR_SEARCHES = [
  'Beras', 'Minyak Masak', 'Gula', 'Biskut', 'Mi Segera', 'Coklat',
];

export const ONBOARDING_SLIDES = [
  {
    title: 'Compare Prices',
    body: 'See the price of any grocery item across major supermarkets in one place.',
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
