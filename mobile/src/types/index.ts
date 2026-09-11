export interface GeoPoint {
  type: 'Point';
  coordinates: number[]; // [longitude, latitude]
  label?: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  role: 'customer' | 'merchant' | 'admin';
  preferredState?: string;
  businessLocation?: GeoPoint;
  createdAt?: string;
}

export type StoreKind = 'chain' | 'merchant';

export interface Store {
  _id: string;
  storeName: string;
  mallName?: string;
  branch?: string;
  address: string;
  city?: string;
  state?: string;
  kind?: StoreKind;
  storeCategory?: string;
  type?: string;
  phone?: string;
  description?: string;
  logo?: string;
  bannerImage?: string;
  operating_hours?: string;
  location?: { type: string; coordinates: number[] };
  rating?: number;
  reviewCount?: number;
  deliveryAvailable?: boolean;
  deliveryFee?: number;
  pickupAvailable?: boolean;
  orderable?: boolean;
  // attached when the request includes an origin
  distanceKm?: number | null;
  durationMin?: number | null;
  // attached by GET /stores/:id
  products?: StoreProductListing[];
  productCount?: number;
}

export interface StoreProductListing {
  _id: string;
  productName: string;
  image?: string;
  unit?: string;
  storeCategory?: string;
  category?: string;
  price: number;
  previousPrice?: number | null;
  stock?: number | null;
  inStock?: boolean;
}

export interface Category {
  _id: string;
  categoryName: string;
  group?: string;
  icon?: string;
  image?: string;
}

export interface StoreCategory {
  slug: string;
  label: string;
  icon: string;
}

/** A product row in a catalogue list (from GET /products). */
export interface CatalogProduct {
  _id: string;
  productName: string;
  description?: string;
  image?: string;
  unit: string;
  storeCategory?: string;
  categoryId?: { _id: string; categoryName: string; group?: string } | string;
  brandId?: { _id: string; brandName: string } | string | null;
  lowestPrice: number | null;
  storeCount: number;
  cheapestStore: StoreSummary | null;
  nearestStore: StoreSummary | null;
}

export interface StoreSummary {
  _id: string;
  storeName: string;
  logo?: string;
  kind?: StoreKind;
  rating?: number;
  city?: string;
  state?: string;
  deliveryAvailable?: boolean;
  deliveryFee?: number;
  distanceKm?: number | null;
  durationMin?: number | null;
}

/** A per-store row in the product detail / price comparison. */
export interface StorePriceRow {
  store: StoreSummary & {
    reviewCount?: number;
    pickupAvailable?: boolean;
    phone?: string;
    orderable?: boolean;
  };
  price: number;
  previousPrice?: number | null;
  effectivePrice: number;
  stock?: number | null;
  inStock?: boolean;
  hasPromotion: boolean;
  promotion?: {
    title: string;
    type: string;
    promotionPrice: number;
    discountPercentage: number;
    endDate: string;
  } | null;
  isLowestPrice?: boolean;
  isNearest?: boolean;
}

export interface ProductDetail {
  product: CatalogProduct & {
    categoryId?: { categoryName: string; group?: string };
    brandId?: { brandName: string } | null;
    attributes?: Record<string, any>;
  };
  stores: StorePriceRow[];
  cheapestStore: StoreSummary | null;
  nearestStore: StoreSummary | null;
  lowestPrice: number | null;
  highestPrice: number | null;
  savings: number;
  storeCount: number;
}

/** The merchant's own store (from GET /merchant/store). */
export interface MerchantStore extends Store {
  ownerId?: string;
  minOrder?: number;
  status?: 'active' | 'draft' | 'suspended';
  views?: number;
  stats?: {
    productCount: number;
    activePromoCount: number;
    openOrders: number;
    views: number;
    rating: number;
    reviewCount: number;
  };
}

/** A row in the merchant's product-management list. */
export interface MerchantProduct {
  _id: string;
  productName: string;
  description?: string;
  image?: string;
  unit: string;
  storeCategory?: string;
  categoryId?: string;
  category?: string;
  attributes?: Record<string, any>;
  status?: 'active' | 'inactive' | 'discontinued';
  priceId?: string;
  price: number;
  previousPrice?: number | null;
  stock?: number | null;
  inStock?: boolean;
  sku?: string;
  ownProduct?: boolean;
}

export interface MerchantPromotion {
  _id: string;
  productId: { _id: string; productName: string; image?: string; unit?: string } | string;
  storeId: string;
  promotionTitle: string;
  promotionType: string;
  promotionPrice: number;
  discountPercentage?: number;
  startDate: string;
  endDate: string;
}

export type Fulfilment = 'pickup' | 'delivery';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'packing'
  | 'ready'
  | 'on_the_way'
  | 'completed'
  | 'cancelled';

export interface CartLine {
  productId: string;
  storeId: string;
  storeName: string;
  storeKind?: StoreKind;
  name: string;
  unit?: string;
  unitPrice: number;
  qty: number;
  image?: string;
  /** max orderable qty; null/undefined = unknown */
  stock?: number | null;
  deliveryAvailable?: boolean;
  deliveryFee?: number;
  pickupAvailable?: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  unit?: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

export interface StatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface OrderStoreSummary {
  _id: string;
  storeName: string;
  logo?: string;
  kind?: StoreKind;
  phone?: string;
  city?: string;
  state?: string;
  deliveryFee?: number;
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  location?: { coordinates: number[] };
  ownerId?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string | { _id: string; fullName: string; phone?: string; email?: string };
  storeId: string | OrderStoreSummary;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfilment: Fulfilment;
  deliveryAddress?: { label?: string; line?: string; city?: string; state?: string };
  contactPhone?: string;
  paymentMethod: 'cod' | 'pay_at_pickup';
  status: OrderStatus;
  statusHistory: StatusEvent[];
  cancelledBy?: 'buyer' | 'merchant' | null;
  notes?: string;
  createdAt: string;
}

export interface Promotion {
  _id: string;
  productId: any;
  storeId: any;
  promotionTitle: string;
  promotionType: string;
  promotionPrice: number;
  discountPercentage?: number;
  startDate: string;
  endDate: string;
}

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  status: 'unread' | 'read';
  createdDate?: string;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  pages?: number;
}
