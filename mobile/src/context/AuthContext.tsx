import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (data: Record<string, string>) => Promise<void>;
  signUp: (data: Record<string, string>) => Promise<void>;
  signOut: () => Promise<void>;
  bypassLogin: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Assume authService.me() returns { data: { user: User } } based on typical API setups
        // Here we just fetch user profile if token exists
        try {
          const res = await authService.me();
          if (res && (res as any).data) {
            // Check if it's nested like res.data.user or just res.data
            if ((res as any).data.user) {
              setUser((res as any).data.user);
            } else {
              setUser((res as any).data);
            }
          } else if (res && (res as any).user) {
            setUser((res as any).user);
          }
        } catch (e) {
          // Token invalid or expired
          await AsyncStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Failed to load storage data', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(data: Record<string, string>) {
    const res = await authService.login(data);
    // Determine the structure (it might be { data: { token, user } })
    const payload = (res as any).data || res;
    if (payload.token) {
      await AsyncStorage.setItem('token', payload.token);
      setUser(payload.user);
    }
  }

  async function signUp(data: Record<string, string>) {
    const res = await authService.register(data);
    const payload = (res as any).data || res;
    if (payload.token) {
      await AsyncStorage.setItem('token', payload.token);
      setUser(payload.user);
    }
  }

  async function signOut() {
    await AsyncStorage.removeItem('token');
    setUser(null);
  }

  async function bypassLogin() {
    setUser({
      _id: 'fake_user_id',
      fullName: 'Demo User',
      email: 'demo@bijakbeli.com',
      role: 'customer',
      preferredState: 'Johor',
      preferredStores: ['dummy1', 'dummy2']
    } as User);
  }

  async function refreshUser() {
    await loadStorageData();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, bypassLogin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
