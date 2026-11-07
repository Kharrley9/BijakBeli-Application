import api from './api';
import { getPrefs } from '../utils/prefs';
export { authService } from './authService';

type Origin = { lat?: number; lng?: number } | null | undefined;

/** Adds the buyer's location, plus their vehicle so the server can price the trip. */
function withOrigin(params: Record<string, any>, origin: Origin) {
  if (origin && origin.lat != null && origin.lng != null) {
    return { ...params, lat: origin.lat, lng: origin.lng, vehicle: getPrefs().vehicle };
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

/** Nearest shopping malls to a point, looked up server-side via Google Places. */
export const placeService = {
  getNearbyMalls: (params: { lat: number; lng: number; radiusKm?: number; limit?: number }) =>
    api.get('/places/malls', { params }),
};

export const priceService = {
  compare: (productId: string, storeIds?: string[], origin?: Origin) => {
    const params: Record<string, any> = {};
    if (storeIds?.length) params.storeIds = storeIds.join(',');
    return api.get(`/prices/compare/${productId}`, {
      params: withOrigin(params, origin),
    });
  },

  /** Lowest price nationwide or by state (Price Catcher feature) */
  getLowest: (productId: string, state?: string) =>
    api.get(`/prices/lowest/${productId}`, { params: state ? { state } : {} }),

  /** Historical price trend for charting */
  getTrend: (productId: string, opts: { storeId?: string; days?: number; state?: string } = {}) =>
    api.get(`/prices/trend/${productId}`, { params: opts }),

  /** JOM Kongsi – submit a crowdsourced price report */
  reportPrice: (data: {
    productId: string;
    storeId: string;
    price: number;
    isPromo?: boolean;
    promoDescription?: string;
    photoUrl?: string;
  }) => api.post('/prices/report', data),

  /** Fetch all user-submitted reports for a product */
  getReports: (productId: string, params: { storeId?: string; status?: string } = {}) =>
    api.get('/prices/reports', { params: { productId, ...params } }),

  /** Confirm a crowdsourced price report */
  confirmReport: (reportId: string) => api.post(`/prices/reports/${reportId}/confirm`),

  /** Dispute a crowdsourced price report */
  disputeReport: (reportId: string) => api.post(`/prices/reports/${reportId}/dispute`),
};

export const promotionService = {
  getActive: (params?: Record<string, any>) => api.get('/promotions/active', { params }),
  getBestDeals: (params?: Record<string, any>) => api.get('/promotions/best-deals', { params }),
};
