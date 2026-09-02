'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: 'FARMER' | 'BUYER' | 'ADMIN';
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED' | string;
  district?: string;
  state?: string;
  village?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  profilePhotoUrl?: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isVerified?: boolean;
  rejectionReason?: string;
  primaryCrop?: string;
  farmSize?: number;
  kccNumber?: string;
  apmcNumber?: string;
  apmcRegistrationNumber?: string;
  organizationName?: string;
  contactPerson?: string;
  businessType?: string;
  gstin?: string;
  fssaiNumber?: string;
  warehouseLocation?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    identifier: string,
    password: string,
    selectedRole?: 'FARMER' | 'BUYER' | 'ADMIN',
    captchaId?: string,
    captchaAnswer?: string,
  ) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({} as User),
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadSession = async () => {
    try {
      const storedToken = localStorage.getItem('vanijya_token');
      const storedUser = localStorage.getItem('vanijya_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsed = JSON.parse(storedUser);
        setUser(parsed);

        // Asynchronously revalidate session with server
        api.get<User>('/users/me')
          .then((freshUser) => {
            if (freshUser && freshUser.id) {
              setUser(freshUser);
              localStorage.setItem('vanijya_user', JSON.stringify(freshUser));
            }
          })
          .catch((err: any) => {
            if (err.status === 401) {
              // Token expired
              setToken(null);
              setUser(null);
              localStorage.removeItem('vanijya_token');
              localStorage.removeItem('vanijya_user');
            }
          });
      }
    } catch {
      localStorage.removeItem('vanijya_token');
      localStorage.removeItem('vanijya_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async (
    identifier: string,
    password: string,
    selectedRole?: 'FARMER' | 'BUYER' | 'ADMIN',
    captchaId?: string,
    captchaAnswer?: string,
  ): Promise<User> => {
    try {
      const res = await api.post<{ accessToken: string; user: User }>('/auth/login', {
        identifier,
        password,
        captchaId,
        captchaAnswer,
      });

      let loggedInUser = res.user;

      // If user chose a specific role and it's valid, respect the role context
      if (selectedRole && loggedInUser.role !== selectedRole && loggedInUser.role === 'ADMIN') {
        loggedInUser = { ...loggedInUser, role: selectedRole };
      }

      setToken(res.accessToken);
      setUser(loggedInUser);

      localStorage.setItem('vanijya_token', res.accessToken);
      localStorage.setItem('vanijya_user', JSON.stringify(loggedInUser));

      return loggedInUser;
    } catch (err: any) {
      throw new Error(err.message || 'Login failed. Please check credentials.');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vanijya_token');
    localStorage.removeItem('vanijya_user');
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await api.get<User>('/users/me');
      if (updatedUser && updatedUser.id) {
        setUser(updatedUser);
        localStorage.setItem('vanijya_user', JSON.stringify(updatedUser));
      }
    } catch {
      // Ignore if offline
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
