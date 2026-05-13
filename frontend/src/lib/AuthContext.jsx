import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

// Token expiration time (7 days in milliseconds)
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Secure storage utilities using sessionStorage for sensitive data
 * with expiration handling
 */
const secureStorage = {
  setToken: (token) => {
    const expiresAt = Date.now() + TOKEN_EXPIRY_MS;
    sessionStorage.setItem('auth_token', token);
    sessionStorage.setItem('auth_token_expires', String(expiresAt));
  },
  
  getToken: () => {
    const token = sessionStorage.getItem('auth_token');
    const expiresAt = sessionStorage.getItem('auth_token_expires');
    
    if (!token || !expiresAt) return null;
    
    // Check if token has expired
    if (Date.now() > parseInt(expiresAt, 10)) {
      secureStorage.clearAuth();
      return null;
    }
    
    return token;
  },
  
  setUser: (userData) => {
    // Store non-sensitive user data in localStorage for persistence
    // Sensitive operations still require valid token from sessionStorage
    localStorage.setItem('user_profile', JSON.stringify(userData));
  },
  
  getUser: () => {
    try {
      const stored = localStorage.getItem('user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
  
  clearAuth: () => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token_expires');
    localStorage.removeItem('user_profile');
    // Legacy cleanup
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const checkAppState = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      
      // Check if we have a stored token (using secure storage)
      const token = secureStorage.getToken();
      const storedUser = secureStorage.getUser();
      
      if (token && storedUser) {
        try {
          // Verify token is still valid with backend
          const currentUser = await base44.auth.me();
          setUser(currentUser);
          setIsAuthenticated(true);
        } catch {
          // Token invalid, clear storage
          secureStorage.clearAuth();
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  }, []);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await base44.auth.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      setAuthError(null);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      setAuthError({ type: 'login_failed', message: errorMessage });
      throw error;
    }
  }, []);

  const loginWithToken = useCallback(async (token, userData) => {
    try {
      secureStorage.setToken(token);
      secureStorage.setUser(userData);
      setUser(userData);
      setIsAuthenticated(true);
      setAuthError(null);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      const response = await base44.auth.register(data);
      setUser(response.user);
      setIsAuthenticated(true);
      setAuthError(null);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
      setAuthError({ type: 'registration_failed', message: errorMessage });
      throw error;
    }
  }, []);

  const logout = useCallback((shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    secureStorage.clearAuth();
    base44.auth.logout(shouldRedirect ? '/' : null);
  }, []);

  const navigateToLogin = useCallback(() => {
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    secureStorage.setUser(userData);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      login,
      loginWithToken,
      register,
      logout,
      navigateToLogin,
      checkAppState,
      updateUser
    }}>
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
