'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/api/auth';
import type {
  User,
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  UpdatePasswordData,
} from '@/types/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  updatePassword: (data: UpdatePasswordData) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const userData = await authApi.getProfile();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(credentials: LoginCredentials) {
    const { user: userData } = await authApi.login(credentials);
    setUser(userData);
  }

  async function register(data: RegisterData) {
    const { user: userData } = await authApi.register(data);
    setUser(userData);
  }

  async function logout() {
    await authApi.logout();
    setUser(null);
  }

  async function updateProfile(data: UpdateProfileData) {
    const { user: userData } = await authApi.updateProfile(data);
    setUser(userData);
  }

  async function updatePassword(data: UpdatePasswordData) {
    const { user: userData } = await authApi.updatePassword(data);
    setUser(userData);
  }

  async function refreshProfile() {
    const userData = await authApi.getProfile();
    setUser(userData);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
