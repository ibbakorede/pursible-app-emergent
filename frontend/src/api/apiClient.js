/**
 * API Client for Pursible - Replaces Base44 SDK
 * Connects to our FastAPI backend
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

// Token expiration time (7 days in milliseconds)
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Secure storage utilities for auth tokens
 * Uses sessionStorage for tokens (cleared on tab close)
 * Uses localStorage for user profile (non-sensitive, persisted)
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
    
    if (!token || !expiresAt) {
      // Fallback: check localStorage for legacy tokens
      const legacyToken = localStorage.getItem('auth_token');
      if (legacyToken) {
        // Migrate legacy token to sessionStorage
        secureStorage.setToken(legacyToken);
        localStorage.removeItem('auth_token');
        return legacyToken;
      }
      return null;
    }
    
    // Check if token has expired
    if (Date.now() > parseInt(expiresAt, 10)) {
      secureStorage.clearAuth();
      return null;
    }
    
    return token;
  },
  
  setUser: (userData) => {
    // Store non-sensitive user profile in localStorage for persistence
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

// Create axios instance with defaults
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = secureStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      secureStorage.clearAuth();
      // Redirect to login will be handled by AuthContext
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// ENTITY OPERATIONS - Mimics Base44's entity pattern
// ═══════════════════════════════════════════════════════════════════════════════

const createEntityAPI = (entityName) => ({
  // Create a new record
  create: async (data) => {
    const response = await api.post(`/entities/${entityName}`, data);
    return response.data;
  },
  
  // List all records (with optional sorting and limit)
  list: async (sortBy = null, limit = 100) => {
    const params = {};
    if (sortBy) params.sort_by = sortBy;
    if (limit) params.limit = limit;
    const response = await api.get(`/entities/${entityName}`, { params });
    return response.data;
  },
  
  // Filter records by criteria
  filter: async (criteria, sortBy = null, limit = null) => {
    const params = { ...criteria };
    if (sortBy) params.sort_by = sortBy;
    if (limit) params.limit = limit;
    const response = await api.get(`/entities/${entityName}/filter`, { params });
    return response.data;
  },
  
  // Update a record
  update: async (id, data) => {
    const response = await api.patch(`/entities/${entityName}/${id}`, data);
    return response.data;
  },
  
  // Delete a record
  delete: async (id) => {
    const response = await api.delete(`/entities/${entityName}/${id}`);
    return response.data;
  },
  
  // Get a single record by ID
  get: async (id) => {
    const response = await api.get(`/entities/${entityName}/${id}`);
    return response.data;
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTIONS - Cloud function invocations
// ═══════════════════════════════════════════════════════════════════════════════

const functions = {
  invoke: async (functionName, params = {}) => {
    const response = await api.post(`/functions/${functionName}`, params);
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH - Authentication operations
// ═══════════════════════════════════════════════════════════════════════════════

const auth = {
  // Get current user
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  // Login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      secureStorage.setToken(response.data.token);
      secureStorage.setUser(response.data.user);
    }
    return response.data;
  },
  
  // Register
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      secureStorage.setToken(response.data.token);
      secureStorage.setUser(response.data.user);
    }
    return response.data;
  },
  
  // Logout
  logout: (redirectUrl = null) => {
    secureStorage.clearAuth();
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },
  
  // Redirect to login (for compatibility)
  redirectToLogin: (returnUrl = null) => {
    const loginUrl = returnUrl ? `/login?return=${encodeURIComponent(returnUrl)}` : '/login';
    window.location.href = loginUrl;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT - Mimics base44 client structure
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATIONS - File uploads and other integrations
// ═══════════════════════════════════════════════════════════════════════════════

const integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
  },
};

export const base44 = {
  auth,
  functions,
  integrations,
  entities: {
    User: createEntityAPI('users'),
    Wallet: createEntityAPI('wallets'),
    Transaction: createEntityAPI('transactions'),
    KYCRecord: createEntityAPI('kyc_records'),
    BankAccount: createEntityAPI('bank_accounts'),
    Notification: createEntityAPI('notifications'),
    Balance: createEntityAPI('balances'),
    AppError: createEntityAPI('app_errors'),
    ConversionRate: createEntityAPI('conversion_rates'),
    AuditLog: createEntityAPI('audit_logs'),
    RateAlert: createEntityAPI('rate_alerts'),
    Goal: createEntityAPI('goals'),
    Referral: createEntityAPI('referrals'),
    SupportTicket: createEntityAPI('support_tickets'),
    DepositAccount: createEntityAPI('deposit_accounts'),
  },
};

export default base44;
