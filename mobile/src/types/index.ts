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
  role: 'customer' | 'admin';
  preferredState?: string;
  businessLocation?: GeoPoint;
  createdAt?: string;
}

export interface Store {
  _id: string;
  storeName: string;
  mallName?: string;
  branch?: string;
  address: string;
  city?: string;
  state?: string;
  type?: string;
  phone?: string;
  description?: string;
  logo?: string;
  bannerImage?: string;
  /**
   * Credit for bannerImage (Wikimedia Commons). scope 'chain' means the photo is
   * of another store of the same chain, standing in for this branch.
   */
  photoCredit?: { author?: string; license?: string; sourceUrl?: string; scope?: 'branch' | 'chain' };
  operating_hours?: string;
  location?: { type: string; coordinates: number[] };
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
  /** Malay category name. */
  category?: string;
  categoryEn?: string;
  /** Category position in the app's category list (listings come sorted by it). */
  categoryOrder?: number;
  price: number;
  previousPrice?: number | null;
  inStock?: boolean;
}

export interface Category {
  _id: string;
  /** Malay name (primary, matches Price Catcher). */
  categoryName: string;
  /** English name, shown when the app language is English. */
  nameEn?: string;
  icon?: string;
  image?: string;
}

/** A product row in a catalogue list (from GET /products). */
export interface CatalogProduct {
  _id: string;
  productName: string;
  description?: string;
  image?: string;
  /** Credit for `image` when it is a Wikimedia Commons photo. */
  imageCredit?: { author?: string; license?: string; sourceUrl?: string };
  unit: string;
  categoryId?: { _id: string; categoryName: string } | string;
  brandId?: { _id: string; brandName: string } | string | null;
  lowestPrice: number | null;
  storeCount: number;
  /** With a buyer location: stores within their radius that sell it. */
  nearbyStoreCount?: number;
  priceScope?: 'nearby' | 'all';
  cheapestStore: StoreSummary | null;
  nearestStore: StoreSummary | null;
}

export interface StoreSummary {
  _id: string;
  storeName: string;
  /** Chain + branch, e.g. "Giant Tampoi". */
  mallName?: string;
  logo?: string;
  city?: string;
  state?: string;
  distanceKm?: number | null;
  durationMin?: number | null;
}

/** A per-store row in the product detail / price comparison. */
export interface StorePriceRow {
  store: StoreSummary & {
    phone?: string;
  };
  price: number;
  previousPrice?: number | null;
  effectivePrice: number;
  /** Round-trip fuel to this store in RM; null when the buyer's location is unknown. */
  travelCost?: number | null;
  /** effectivePrice + travelCost. */
  totalCost?: number | null;
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
  /** Lowest item price + fuel among in-stock stores. */
  isBestValue?: boolean;
}

/** The fuel assumptions the server used for travelCost. */
export interface FuelAssumptions {
  vehicle: 'car' | 'motorcycle';
  fuelPriceRm: number;
  litresPer100Km: number;
  roundTrip: boolean;
}

export interface ProductDetail {
  product: CatalogProduct & {
    categoryId?: { categoryName: string };
    brandId?: { brandName: string } | null;
  };
  stores: StorePriceRow[];
  cheapestStore: StoreSummary | null;
  nearestStore: StoreSummary | null;
  bestValueStore?: StoreSummary | null;
  fuel?: FuelAssumptions;
  /** Date of the newest price (PriceCatcher observation date). */
  dataAsOf?: string | null;
  /** 'nearby': stores and all figures are limited to stores within nearbyRadiusKm. */
  priceScope?: 'nearby' | 'all';
  nearbyRadiusKm?: number;
  nearbyStoreCount?: number;
  /** Stores selling this item that are farther than the radius. */
  storesBeyondRadius?: number;
  /** The closest of those, so the app can suggest a wider radius. */
  nearestBeyond?: StoreSummary | null;
  lowestPrice: number | null;
  highestPrice: number | null;
  savings: number;
  storeCount: number;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  pages?: number;
}
