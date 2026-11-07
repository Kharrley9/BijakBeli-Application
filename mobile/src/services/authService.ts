import api from './api';
import { User } from '../types';

export const authService = {
  login: (data: Record<string, string>) => api.post<{ token: string; user: User }>('/auth/login', data),
  register: (data: Record<string, string>) => api.post<{ token: string; user: User }>('/auth/register', data),
  me: () => api.get<{ user: User }>('/auth/me'),
  updateProfile: (data: any) => api.put<{ user: User }>('/auth/profile', data),
};
