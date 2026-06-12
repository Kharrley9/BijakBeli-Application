import api from './api';

export const authService = {
  register: (data: { fullName: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getMe: () => api.get('/auth/me'),

  updateProfile: (data: Record<string, unknown>) =>
    api.put('/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
};
