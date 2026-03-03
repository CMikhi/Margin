"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "../api/client";
import {
  migrateTokensToCookies,
  isMigrationNeeded,
} from "../utils/tokenMigration";
import type { User, LoginRequest, RegisterRequest } from "../types/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    // Check if user is already logged in on mount
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // First, check if we need to migrate tokens from localStorage to cookies
      if (isMigrationNeeded()) {
        migrateTokensToCookies();
        // Refresh the API client's token from cookies after migration
        apiClient.refreshFromCookies();
      }

      if (!apiClient.isAuthenticated()) {
        setLoading(false);
        return;
      }

      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to get current user:", error);
      // Token might be invalid, clear it
      apiClient.logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const authResponse = await apiClient.login(credentials);

      // Backend now returns user data, so we don't need to call /me
      if (authResponse.user) {
        setUser(authResponse.user);
      } else {
        throw new Error("Login succeeded but no user data returned");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      const authResponse = await apiClient.register(userData);

      // Backend now returns user data for register too
      if (authResponse.user) {
        setUser(authResponse.user);
      } else {
        throw new Error("Registration succeeded but no user data returned");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  const refreshToken = async () => {
    try {
      await apiClient.refreshToken();
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
