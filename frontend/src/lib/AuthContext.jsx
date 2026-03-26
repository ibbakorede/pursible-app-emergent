import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      
      // Check if we have a stored token
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // Verify token is still valid
          const currentUser = await base44.auth.me();
          setUser(currentUser);
          setIsAuthenticated(true);
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('[AuthContext] Calling login API for:', email);
      const response = await base44.auth.login(email, password);
      console.log('[AuthContext] Login response:', response);
      setUser(response.user);
      setIsAuthenticated(true);
      setAuthError(null);
      return response;
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      setAuthError({ type: 'login_failed', message: errorMessage });
      throw error;
    }
  };

  const register = async (data) => {
    try {
      console.log('[AuthContext] Calling register API for:', data.email);
      const response = await base44.auth.register(data);
      console.log('[AuthContext] Register response:', response);
      setUser(response.user);
      setIsAuthenticated(true);
      setAuthError(null);
      return response;
    } catch (error) {
      console.error('[AuthContext] Register error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
      setAuthError({ type: 'registration_failed', message: errorMessage });
      throw error;
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout(shouldRedirect ? '/' : null);
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      login,
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
