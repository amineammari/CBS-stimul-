import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://192.168.72.128:30003'; // URL du middleware CBS

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