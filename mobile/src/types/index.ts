export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  role: 'customer' | 'admin';
  createdAt?: string;
}

export interface Store {
  _id: string;
  storeName: string;
  mallName?: string;
  address: string;
  location?: { type: string; coordinates: number[] };
  logo?: string;
}

export interface Category {
  _id: string;
  categoryName: string;
  image?: string;
}

export interface Brand {
  _id: string;
  brandName: string;
  logo?: string;
}

export interface Product {
  _id: string;
  barcode?: string;
  productName: string;
  description?: string;
  categoryId: Category | string;
  brandId: Brand | string;
  image?: string;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
}

export interface Price {
  _id: string;
  productId: Product | string;
  storeId: Store | string;
  price: number;
  previousPrice?: number;
  lastUpdated: string;
}

export interface Promotion {
  _id: string;
  productId: Product | string;
  storeId: Store | string;
  promotionTitle: string;
  promotionType: 'discount' | 'buy1free1' | 'bundle' | 'clearance' | 'seasonal' | 'member';
  promotionPrice: number;
  discountPercentage?: number;
  startDate: string;
  endDate: string;
  promotionBanner?: string;
}

export interface PriceComparison {
  store: Store;
  currentPrice: number;
  previousPrice?: number;
  effectivePrice: number;
  priceDifference: number;
  promotion?: {
    title: string;
    type: string;
    promotionPrice: number;
    discountPercentage: number;
    endDate: string;
  };
  hasPromotion: boolean;
  isLowestPrice?: boolean;
  isBestPromotion?: boolean;
}

export interface ComparisonResult {
  comparisons: PriceComparison[];
  cheapestStore: Store | null;
  savings: number;
  lowestPrice: number;
  highestPrice: number;
}

export interface ShoppingList {
  _id: string;
  userId: string;
  title: string;
  createdDate: string;
  estimatedSaving: number;
  totalPrice: number;
  items?: ShoppingListItem[];
}

export interface ShoppingListItem {
  _id: string;
  shoppingListId: string;
  productId: Product | string;
  quantity: number;
}

export interface Budget {
  _id: string;
  userId: string;
  monthlyBudget: number;
  spentAmount: number;
  remainingAmount: number;
  month: number;
  year: number;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  status: 'unread' | 'read';
  createdDate: string;
}

export interface FavoriteProduct {
  _id: string;
  userId: string;
  productId: Product;
}

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalStores: number;
  activePromotions: number;
  mostSavedProduct: Product | null;
  avgSavings: number;
  monthlyUsers: { _id: { month: number; year: number }; count: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  pages?: number;
}
