/**
 * API Client for Pursible - Replaces Base44 SDK
 * Connects to our FastAPI backend
 * 
 * SECURITY: Uses httpOnly cookies for authentication
 * No tokens are stored in localStorage/sessionStorage
 */
import axios from 'axios';
import { logger } from '../lib/logger';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

// Create axios instance with credentials enabled for httpOnly cookies
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for all requests
});

// Handle auth errors - redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auth cookie is invalid or expired
      // Let the AuthContext handle redirect
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
// AUTH - Authentication operations using httpOnly cookies
// ═══════════════════════════════════════════════════════════════════════════════

const auth = {
  // Get current user (validates session via cookie)
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  // Login - server sets httpOnly cookie
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  // Register - server sets httpOnly cookie
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  // Logout - server clears httpOnly cookie
  logout: async (redirectUrl = null) => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      logger.warn('Logout API call failed:', err);
    }
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },
  
  // Refresh token (extends cookie expiration)
  refresh: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
  
  // Redirect to login (for compatibility)
  redirectToLogin: (returnUrl = null) => {
    const loginUrl = returnUrl ? `/login?return=${encodeURIComponent(returnUrl)}` : '/login';
    window.location.href = loginUrl;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// BIOMETRIC - Server-side biometric credential management
// ═══════════════════════════════════════════════════════════════════════════════

const biometric = {
  // Register biometric credential on server
  register: async (credentialId, credentialRawId, publicKey = null) => {
    const response = await api.post('/biometric/register', {
      credential_id: credentialId,
      credential_raw_id: credentialRawId,
      public_key: publicKey,
    });
    return response.data;
  },
  
  // Verify biometric credential exists
  verify: async (credentialId, assertionData = null) => {
    const response = await api.post('/biometric/verify', {
      credential_id: credentialId,
      assertion_data: assertionData,
    });
    return response.data;
  },
  
  // Delete biometric credential
  disable: async () => {
    const response = await api.delete('/biometric/credential');
    return response.data;
  },
  
  // Get biometric status for current user
  status: async () => {
    const response = await api.get('/biometric/status');
    return response.data;
  },
  
  // Biometric login (after client-side WebAuthn verification)
  login: async (email) => {
    const response = await api.post('/auth/biometric-login', { email });
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS - Server-side push token management
// ═══════════════════════════════════════════════════════════════════════════════

const push = {
  // Register push token on server
  registerToken: async (token, deviceType = 'web') => {
    const response = await api.post('/push/register-token', {
      token,
      device_type: deviceType,
    });
    return response.data;
  },
  
  // Delete push token (on logout)
  deleteToken: async () => {
    const response = await api.delete('/push/token');
    return response.data;
  },
  
  // Get notification settings
  getSettings: async () => {
    const response = await api.get('/push/settings');
    return response.data;
  },
  
  // Update notification settings
  updateSettings: async (settings) => {
    const response = await api.patch('/push/settings', settings);
    return response.data;
  },
};

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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT - Mimics base44 client structure
// ═══════════════════════════════════════════════════════════════════════════════

export const base44 = {
  auth,
  biometric,
  push,
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
