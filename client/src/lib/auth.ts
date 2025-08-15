import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import type { User, LoginRequest } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem("auth_token")
  );
  const queryClient = useQueryClient();

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      return response;
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem("auth_token", data.token);
      // Store token globally for immediate use
      (window as any).__auth_token = data.token;
      queryClient.setQueryData(["/api/auth/me"], data);
      refetch();
    },
  });

  // Set up global auth header for fetch requests
  useEffect(() => {
    if (token) {
      // Store token globally for fetch requests
      (window as any).__auth_token = token;
    } else {
      delete (window as any).__auth_token;
    }
  }, [token]);

  const login = async (credentials: LoginRequest) => {
    await loginMutation.mutateAsync(credentials);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("auth_token");
    queryClient.clear();
    
    // Reset fetch to original
    const originalFetch = window.fetch;
    window.fetch = originalFetch;
    
    window.location.href = "/login";
  };

  const value: AuthContextType = {
    user: (user as any)?.user || null,
    login,
    logout,
    isLoading: isLoading || loginMutation.isPending,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};