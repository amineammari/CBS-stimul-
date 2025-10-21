import axios from 'axios';

// Prefer dynamic NodePort routing from the browser; fall back to env when provided
const resolveBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && envUrl.trim().length > 0) return envUrl;
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:30003`;
  }
  // Final fallback for non-browser contexts
  return 'http://localhost:30003';
};

const baseURL = resolveBaseUrl();

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const cbsAPI = {
  getMetrics: async () => {
    try {
      const response = await apiClient.get('/metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  },

  getHealth: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error fetching health status:', error);
      throw error;
    }
  },

  doTransfer: async (transferData) => {
    try {
      const response = await apiClient.post('/transfer', transferData);
      return response.data;
    } catch (error) {
      console.error('Error performing transfer:', error);
      throw error;
    }
  },

  getAccount: async (accountId) => {
    try {
      const response = await apiClient.get(`/accounts/${accountId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching account ${accountId}:`, error);
      throw error;
    }
  },

  getCustomer: async (customerId) => {
    try {
      const response = await apiClient.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching customer ${customerId}:`, error);
      throw error;
    }
  },

  getTransactionHistory: async (accountId) => {
    try {
      const response = await apiClient.get(`/accounts/${accountId}/history`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching transaction history for account ${accountId}:`, error);
      throw error;
    }
  },
}; 