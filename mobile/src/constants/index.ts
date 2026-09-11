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
    if (Platform.OS === 'android') return `http://${LOCAL_IP}:5000/api`;
    return `http://localhost:5000/api`;
  }
  return 'https://api.bijakbeli.com/api';
};

export const API_URL = getApiUrl();

// Top-level store categories (must match server/config/constants.js)
export const STORE_CATEGORIES = [
  { slug: 'grocery', label: 'Grocery', icon: 'basket-outline' },
  { slug: 'automotive', label: 'Automotive', icon: 'car-outline' },
  { slug: 'hardware', label: 'Hardware', icon: 'hammer-outline' },
  { slug: 'electrical', label: 'Electrical', icon: 'bulb-outline' },
  { slug: 'home', label: 'Home & Living', icon: 'home-outline' },
  { slug: 'health', label: 'Health', icon: 'medkit-outline' },
  { slug: 'telco', label: 'Telco & Computer', icon: 'laptop-outline' },
  { slug: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
] as const;

export const categoryLabel = (slug?: string) =>
  STORE_CATEGORIES.find((c) => c.slug === slug)?.label || 'Other';

export const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Lowest Price' },
  { value: 'nearest', label: 'Nearest' },
  { value: '-createdAt', label: 'Newest' },
] as const;

export const PRODUCT_UNITS = [
  'kg', 'g', 'L', 'ml', 'pcs', 'pack', 'box', 'bottle', 'can', 'bag', 'unit',
  'set', 'pair', 'roll', 'length', 'tin', 'tube', 'tray',
];

export const DEFAULT_MAX_NEARBY_KM = 60;

export const POPULAR_SEARCHES = [
  'Beras', 'Minyak Masak', 'Milo', 'Engine Oil', 'LED Bulb', 'Telur',
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  packing: 'Packing',
  ready: 'Ready for pickup',
  on_the_way: 'On the way',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Ordered progression a merchant advances an order through, by fulfilment type
// (must match server/config/constants.js ORDER_FLOW).
export const ORDER_FLOW: Record<'pickup' | 'delivery', string[]> = {
  pickup: ['pending', 'confirmed', 'preparing', 'packing', 'ready', 'completed'],
  delivery: ['pending', 'confirmed', 'preparing', 'packing', 'on_the_way', 'completed'],
};

export const BUYER_CANCELLABLE_STATUSES = ['pending', 'confirmed'];

export const ONBOARDING_SLIDES = [
  {
    title: 'Compare Prices',
    body: 'See the price of any item across supermarkets and nearby traders in one place.',
    icon: 'pricetags-outline',
  },
  {
    title: 'Find Nearby Stores',
    body: 'Sort by distance and drive time — buy where it actually costs you less to shop.',
    icon: 'navigate-outline',
  },
  {
    title: 'Order From Traders',
    body: 'Grocery, automotive, hardware and more — order for pickup or delivery from local shops.',
    icon: 'cart-outline',
  },
];
