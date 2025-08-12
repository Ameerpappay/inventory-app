import { useState, useEffect } from "react";
import { apiClient, User, TokenManager } from "../lib/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = TokenManager.getToken();
      if (token) {
        // For now, we'll assume the token is valid if it exists
        // In a real app, you might want to validate the token with the server
        // You could store user data in localStorage or make a /me request
        const userData = localStorage.getItem("user");
        if (userData) {
          try {
            setUser(JSON.parse(userData));
          } catch (error) {
            console.error("Failed to parse user data:", error);
            TokenManager.removeToken();
            localStorage.removeItem("user");
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      if (response.success && response.data) {
        TokenManager.setToken(response.data.token);
        setUser(response.data.user);
        // Store user data in localStorage for persistence
        localStorage.setItem("user", JSON.stringify(response.data.user));
        return { data: response.data, error: null };
      } else {
        return {
          data: null,
          error: { message: response.error || "Login failed" },
        };
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Login failed",
        },
      };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const response = await apiClient.register(email, password, name);
      if (response.success && response.data) {
        TokenManager.setToken(response.data.token);
        setUser(response.data.user);
        // Store user data in localStorage for persistence
        localStorage.setItem("user", JSON.stringify(response.data.user));
        return { data: response.data, error: null };
      } else {
        return {
          data: null,
          error: { message: response.error || "Registration failed" },
        };
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Registration failed",
        },
      };
    }
  };

  const signOut = async () => {
    TokenManager.removeToken();
    localStorage.removeItem("user");
    setUser(null);
    return { error: null };
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
