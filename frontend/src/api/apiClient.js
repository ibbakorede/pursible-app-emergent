/**
 * API Client for Paysible - Replaces Base44 SDK
 * Connects to our FastAPI backend
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

// Create axios instance with defaults
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
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
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
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
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  // Register
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  // Logout
  logout: (redirectUrl = null) => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
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
