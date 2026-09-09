import api from './api';
export { authService } from './authService';

export const productService = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/products', { params }),

  getById: (id: string) => api.get(`/products/${id}`),

  search: (params: Record<string, string | number>) =>
    api.get('/products/search', { params }),

  create: (data: Record<string, unknown>) =>
    api.post('/products', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/products/${id}`, data),

  delete: (id: string) => api.delete(`/products/${id}`),

  compareStores: (
    storeIds: string[],
    params?: { preferred_ids?: string; categoryId?: string; q?: string; lat?: number; lng?: number }
  ) =>
    api.get('/products/compare-stores', { params: { storeIds: storeIds.join(','), ...params } }),
};

export const storeService = {
  getAll: (params?: Record<string, string | number>) => api.get('/stores', { params }),
  getNearby: (params: { lat: number; lng: number; maxKm?: number; limit?: number }) =>
    api.get('/stores/nearby', { params }),
  getById: (id: string) => api.get(`/stores/${id}`),
  create: (data: Record<string, unknown>) => api.post('/stores', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/stores/${id}`, data),
  delete: (id: string) => api.delete(`/stores/${id}`),
};

export const categoryService = {
  getAll: () => api.get('/categories'),
  create: (data: Record<string, unknown>) => api.post('/categories', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const brandService = {
  getAll: () => api.get('/brands'),
  create: (data: Record<string, unknown>) => api.post('/brands', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/brands/${id}`, data),
  delete: (id: string) => api.delete(`/brands/${id}`),
};

export const priceService = {
  compare: (productId: string, storeIds?: string[], origin?: { lat?: number; lng?: number }) => {
    const params: Record<string, string | number> = {};
    if (storeIds?.length) params.storeIds = storeIds.join(',');
    if (origin?.lat != null && origin?.lng != null) {
      params.lat = origin.lat;
      params.lng = origin.lng;
    }
    return api.get(`/prices/compare/${productId}`, {
      params: Object.keys(params).length ? params : undefined,
    });
  },
  getAll: (params?: Record<string, string | number>) => api.get('/prices', { params }),
  update: (data: { productId: string; storeId: string; price: number; inStock?: boolean }) => api.post('/prices', data),
  delete: (id: string) => api.delete(`/prices/${id}`),
};

export const promotionService = {
  getActive: (params?: Record<string, string | number>) => api.get('/promotions/active', { params }),
  getBestDeals: (params?: Record<string, string | number>) => api.get('/promotions/best-deals', { params }),
  getAll: (params?: Record<string, string | number>) => api.get('/promotions', { params }),
  getById: (id: string) => api.get(`/promotions/${id}`),
  create: (data: Record<string, unknown>) => api.post('/promotions', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/promotions/${id}`, data),
  delete: (id: string) => api.delete(`/promotions/${id}`),
};

export const shoppingListService = {
  getAll: () => api.get('/shopping-lists'),
  getById: (id: string) => api.get(`/shopping-lists/${id}`),
  create: (title: string) => api.post('/shopping-lists', { title }),
  delete: (id: string) => api.delete(`/shopping-lists/${id}`),
  addItem: (listId: string, productId: string, quantity: number) =>
    api.post(`/shopping-lists/${listId}/items`, { productId, quantity }),
  updateItem: (listId: string, itemId: string, quantity: number) =>
    api.put(`/shopping-lists/${listId}/items/${itemId}`, { quantity }),
  removeItem: (listId: string, itemId: string) =>
    api.delete(`/shopping-lists/${listId}/items/${itemId}`),
  compareStores: (listId: string, origin?: { lat?: number; lng?: number }) =>
    api.get(`/shopping-lists/${listId}/compare`, {
      params:
        origin?.lat != null && origin?.lng != null
          ? { lat: origin.lat, lng: origin.lng }
          : undefined,
    }),
};

export const budgetService = {
  setCurrent: (data: { monthlyBudget: number; month: number; year: number }) =>
    api.post('/budgets', data),
  addExpense: (data: { amount: number; month: number; year: number }) =>
    api.post('/budgets/expense', data),
  getCurrent: () => api.get('/budgets/current'),
  getHistory: () => api.get('/budgets/history'),
  delete: (id: string) => api.delete(`/budgets/${id}`),
};

export const favoriteService = {
  getAll: () => api.get('/favorites'),
  toggle: (productId: string) => api.post(`/favorites/${productId}`),
  check: (productId: string) => api.get(`/favorites/${productId}/check`),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: Record<string, string | number>) => api.get('/admin/users', { params }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
};

export const orderService = {
  create: (data: { items: Array<{ productId: string; storeId: string; quantity: number; price: number }>; shoppingListId?: string }) =>
    api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getById: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string) => api.put(`/orders/${id}/cancel`),
};

export const userService = {
  getPreferredProducts: (userId: string) => api.get(`/users/${userId}/preferred-products`),
  togglePreferredProduct: (userId: string, productId: string) => api.patch(`/users/${userId}/preferred-products`, { productId }),
};

export const uploadService = {
  uploadImage: async (imageUri: string) => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // Any is used here to bypass strict TS checking for React Native FormData
    formData.append('image', { uri: imageUri, name: filename, type } as any);
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};
