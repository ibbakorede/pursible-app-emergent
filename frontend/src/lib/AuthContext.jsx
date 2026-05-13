import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

/**
 * Authentication Context using httpOnly cookies
 * 
 * SECURITY: Auth tokens are stored in httpOnly cookies managed by the server.
 * No tokens are stored in localStorage/sessionStorage.
 * User state is fetched from /auth/me which validates the cookie server-side.
 */

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
      
      // Check if session is valid by calling /auth/me
      // The httpOnly cookie is automatically sent with the request
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
      } catch {
        // No valid session - cookie invalid or expired
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
      // Login sets httpOnly cookie on server
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
    // This method is now deprecated for security
    // Token should only be in httpOnly cookie
    // Just update the user state if provided
    try {
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        setAuthError(null);
      }
      return { success: true };
    } catch (error) {
      throw error;
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      // Register sets httpOnly cookie on server
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

  const logout = useCallback(async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear push token and biometric on logout
    try {
      await base44.push.deleteToken();
    } catch {
      // Ignore push token deletion errors
    }
    
    // Server clears httpOnly cookie
    await base44.auth.logout(shouldRedirect ? '/' : null);
  }, []);

  const navigateToLogin = useCallback(() => {
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
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
  }), [
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
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
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
