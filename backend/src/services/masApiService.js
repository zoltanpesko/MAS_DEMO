/**
 * MAS API Service
 * Core service for interacting with Maximo Application Suite APIs
 */

const axios = require('axios');
const https = require('https');
const config = require('../config/environment');
const logger = require('../utils/logger');

class MasApiService {
  constructor() {
    this.baseUrl = config.mas.baseUrl;
    this.apiKey = config.mas.apiKey;
    this.tenantId = config.mas.tenantId;
    this.timeout = config.mas.timeout;

    // Create axios instance with default configuration
    // Using maxauth header as per IBM Maximo REST API documentation
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'maxauth': this.apiKey,
        'x-tenant-id': this.tenantId,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: config.mas.rejectUnauthorized,
      }),
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`MAS API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('MAS API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`MAS API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle API errors
   * @param {Error} error - Axios error object
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      logger.error('MAS API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      // Request made but no response received
      logger.error('MAS API No Response:', {
        url: error.config?.url,
        message: error.message,
      });
    } else {
      // Error in request setup
      logger.error('MAS API Request Setup Error:', error.message);
    }
  }

  /**
   * Generic GET request
   * @param {String} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Generic POST request
   * @param {String} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise} API response
   */
  async post(endpoint, data = {}) {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Generic PATCH request
   * @param {String} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise} API response
   */
  async patch(endpoint, data = {}) {
    try {
      const response = await this.client.patch(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Generic DELETE request
   * @param {String} endpoint - API endpoint
   * @returns {Promise} API response
   */
  async delete(endpoint) {
    try {
      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Transform axios error to application error
   * @param {Error} error - Axios error
   * @returns {Object} Transformed error
   */
  transformError(error) {
    if (error.response) {
      return {
        status: error.response.status,
        message: error.response.data?.message || error.message,
        data: error.response.data,
      };
    }
    return {
      status: 500,
      message: error.message || 'MAS API communication error',
      data: null,
    };
  }

  /**
   * Authenticate vendor user
   * @param {String} username - Username
   * @param {String} password - Password
   * @returns {Promise} Authentication response
   */
  async authenticate(username, password) {
    try {
      const response = await this.client.post(config.mas.endpoints.auth, {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      logger.error('MAS Authentication failed:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Get vendor details by vendor code
   * @param {String} vendorCode - Vendor code
   * @returns {Promise} Vendor data
   */
  async getVendor(vendorCode) {
    const endpoint = `${config.mas.endpoints.vendors}?oslc.where=company="${vendorCode}"`;
    return await this.get(endpoint);
  }

  /**
   * Update vendor information
   * @param {String} vendorId - Vendor ID
   * @param {Object} data - Updated vendor data
   * @returns {Promise} Update response
   */
  async updateVendor(vendorId, data) {
    const endpoint = `${config.mas.endpoints.vendors}/${vendorId}`;
    return await this.patch(endpoint, data);
  }

  /**
   * Get purchase orders for vendor
   * @param {String} vendorCode - Vendor code
   * @param {Object} filters - Additional filters
   * @returns {Promise} Purchase orders
   */
  async getPurchaseOrders(vendorCode, filters = {}) {
    const params = {
      'oslc.where': `vendor="${vendorCode}"`,
      'oslc.select': '*',
      'oslc.pageSize': filters.pageSize || 50,
      ...filters,
    };
    return await this.get(config.mas.endpoints.purchaseOrders, params);
  }

  /**
   * Get purchase order details
   * @param {String} poNum - Purchase order number
   * @returns {Promise} PO details
   */
  async getPurchaseOrderDetails(poNum) {
    const endpoint = `${config.mas.endpoints.purchaseOrders}?oslc.where=ponum="${poNum}"`;
    return await this.get(endpoint);
  }

  /**
   * Get invoices for vendor
   * @param {String} vendorCode - Vendor code
   * @param {Object} filters - Additional filters
   * @returns {Promise} Invoices
   */
  async getInvoices(vendorCode, filters = {}) {
    const params = {
      'oslc.where': `vendor="${vendorCode}"`,
      'oslc.select': '*',
      'oslc.pageSize': filters.pageSize || 50,
      ...filters,
    };
    return await this.get(config.mas.endpoints.invoices, params);
  }

  /**
   * Create invoice
   * @param {Object} invoiceData - Invoice data
   * @returns {Promise} Created invoice
   */
  async createInvoice(invoiceData) {
    return await this.post(config.mas.endpoints.invoices, invoiceData);
  }

  /**
   * Get invoice details
   * @param {String} invoiceNum - Invoice number
   * @returns {Promise} Invoice details
   */
  async getInvoiceDetails(invoiceNum) {
    const endpoint = `${config.mas.endpoints.invoices}?oslc.where=invoicenum="${invoiceNum}"`;
    return await this.get(endpoint);
  }

  /**
   * Upload document/attachment
   * @param {String} objectName - Object name (e.g., 'PO')
   * @param {String} objectKey - Object key (e.g., PO number)
   * @param {Object} fileData - File data
   * @returns {Promise} Upload response
   */
  async uploadDocument(objectName, objectKey, fileData) {
    const endpoint = config.mas.endpoints.doclinks;
    const data = {
      docinfo: {
        document: objectName,
        docinfoid: objectKey,
        ...fileData,
      },
    };
    return await this.post(endpoint, data);
  }

  /**
   * Get documents for object
   * @param {String} objectName - Object name
   * @param {String} objectKey - Object key
   * @returns {Promise} Documents list
   */
  async getDocuments(objectName, objectKey) {
    const params = {
      'oslc.where': `document="${objectName}" and docinfoid="${objectKey}"`,
    };
    return await this.get(config.mas.endpoints.doclinks, params);
  }

  /**
   * Health check - test MAS API connectivity
   * @returns {Promise} Health status
   */
  async healthCheck() {
    try {
      // Try to fetch companies as a simple health check
      await this.get(config.mas.endpoints.companies, { 'oslc.pageSize': 1 });
      return { status: 'healthy', message: 'MAS API is accessible' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }
}

// Export singleton instance
module.exports = new MasApiService();

// Made with Bob
