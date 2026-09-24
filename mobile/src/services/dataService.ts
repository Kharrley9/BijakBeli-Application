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
  getAll: () => api.get('/categories'),
};

export const productService = {
  /** Catalogue list: products annotated with cheapest price / cheapest & nearest store. */
  list: (
    params: {
      categoryId?: string;
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
  list: (params: { state?: string; q?: string } = {}, origin?: Origin) =>
    api.get('/stores', { params: withOrigin(params, origin) }),

  getNearby: (params: { lat: number; lng: number; maxKm?: number; limit?: number }) =>
    api.get('/stores/nearby', { params }),

  getById: (id: string, origin?: Origin) =>
    api.get(`/stores/${id}`, { params: withOrigin({}, origin) }),
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
