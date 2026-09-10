import api from './api';
export { authService } from './authService';

type Origin = { lat?: number; lng?: number } | null | undefined;

function withOrigin(params: Record<string, any>, origin: Origin) {
  if (origin && origin.lat != null && origin.lng != null) {
    return { ...params, lat: origin.lat, lng: origin.lng };
  }
  return params;
}

export const categoryService = {
  /** The 8 top-level store categories for the home grid. */
  getStoreCategories: () => api.get('/categories', { params: { kind: 'store' } }),
  /** Product categories within a store-category group. */
  getByGroup: (group: string) =>
    api.get('/categories', { params: { kind: 'product', group } }),
  getAll: () => api.get('/categories'),
};

export const productService = {
  /** Marketplace list: products annotated with cheapest price / cheapest & nearest store. */
  list: (
    params: {
      group?: string;
      storeCategory?: string;
      categoryId?: string;
      storeId?: string;
      q?: string;
      sort?: 'price_asc' | 'nearest' | '-createdAt';
      page?: number;
      limit?: number;
    },
    origin?: Origin
  ) => api.get('/products', { params: withOrigin(params, origin) }),

  /** Full detail with "prices at nearby stores". */
  getDetail: (id: string, origin?: Origin) =>
    api.get(`/products/${id}`, { params: withOrigin({}, origin) }),

  search: (q: string, params: Record<string, any> = {}, origin?: Origin) =>
    api.get('/products/search', { params: withOrigin({ q, ...params }, origin) }),

  getById: (id: string) => api.get(`/products/${id}`),
};

export const storeService = {
  list: (
    params: { storeCategory?: string; kind?: string; state?: string; q?: string } = {},
    origin?: Origin
  ) => api.get('/stores', { params: withOrigin(params, origin) }),

  getNearby: (params: {
    lat: number;
    lng: number;
    maxKm?: number;
    limit?: number;
    storeCategory?: string;
    kind?: string;
  }) => api.get('/stores/nearby', { params }),

  getById: (id: string, origin?: Origin) =>
    api.get(`/stores/${id}`, { params: withOrigin({}, origin) }),

  create: (data: Record<string, unknown>) => api.post('/stores', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/stores/${id}`, data),
};

export const priceService = {
  compare: (productId: string, storeIds?: string[], origin?: Origin) => {
    const params: Record<string, any> = {};
    if (storeIds?.length) params.storeIds = storeIds.join(',');
    return api.get(`/prices/compare/${productId}`, {
      params: withOrigin(params, origin),
    });
  },
};

export const promotionService = {
  getActive: (params?: Record<string, any>) => api.get('/promotions/active', { params }),
  getBestDeals: (params?: Record<string, any>) => api.get('/promotions/best-deals', { params }),
};

export const merchantService = {
  /** Register the caller's store (auto-approved, upgrades role to merchant). */
  registerStore: (data: Record<string, unknown>) => api.post('/merchant/store', data),
  getMyStore: () => api.get('/merchant/store'),
  updateMyStore: (data: Record<string, unknown>) => api.put('/merchant/store', data),
  /** Product categories for the store's group (or an explicit group). */
  getCategories: (group?: string) =>
    api.get('/merchant/categories', { params: group ? { group } : {} }),

  listProducts: () => api.get('/merchant/products'),
  createProduct: (data: Record<string, unknown>) => api.post('/merchant/products', data),
  updateProduct: (id: string, data: Record<string, unknown>) =>
    api.put(`/merchant/products/${id}`, data),
  quickUpdatePrice: (id: string, data: { price?: number; stock?: number | null; inStock?: boolean }) =>
    api.patch(`/merchant/products/${id}/price`, data),
  deleteProduct: (id: string) => api.delete(`/merchant/products/${id}`),

  listPromotions: () => api.get('/merchant/promotions'),
  createPromotion: (data: Record<string, unknown>) => api.post('/merchant/promotions', data),
  deletePromotion: (id: string) => api.delete(`/merchant/promotions/${id}`),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const uploadService = {
  uploadImage: async (imageUri: string) => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('image', { uri: imageUri, name: filename, type } as any);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
