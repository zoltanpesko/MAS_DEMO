/**
 * Vendor Service
 * Handles vendor operations with MAS API integration
 */

const masApiService = require('./masApiService');
const logger = require('../utils/logger');

class VendorService {
  /**
   * Get all vendors from Maximo
   * @param {Object} filters - Filter options
   * @returns {Array} Vendors
   */
  async getVendors(filters = {}) {
    try {
      const { page = 1, limit = 50, search, status } = filters;

      // Build MAS API filters
      const masFilters = {
        'oslc.pageSize': limit,
      };

      // Add search filter
      if (search) {
        masFilters['oslc.where'] = `company~"${search}" or name~"${search}"`;
      }

      // Add status filter
      if (status) {
        if (masFilters['oslc.where']) {
          masFilters['oslc.where'] += ` and status="${status}"`;
        } else {
          masFilters['oslc.where'] = `status="${status}"`;
        }
      }

      // Fetch from MAS API
      const response = await masApiService.get(
        require('../config/environment').mas.endpoints.vendors,
        masFilters
      );

      logger.info('Vendors fetched from Maximo:', { count: response.member?.length || 0 });

      // Transform MAS response to our format
      const vendors = this.transformVendors(response.member || []);

      return {
        vendors,
        total: response.totalCount || vendors.length,
        page: parseInt(page),
        limit: parseInt(limit),
      };
    } catch (error) {
      logger.error('Get vendors error:', error);
      throw error;
    }
  }

  /**
   * Get vendor details by vendor code
   * @param {String} vendorCode - Vendor code
   * @returns {Object} Vendor details
   */
  async getVendorDetails(vendorCode) {
    try {
      const response = await masApiService.getVendor(vendorCode);

      if (!response.member || response.member.length === 0) {
        throw new Error('Vendor not found');
      }

      const vendor = this.transformVendor(response.member[0]);

      logger.info('Vendor details fetched from Maximo:', { vendorCode });

      return vendor;
    } catch (error) {
      logger.error('Get vendor details error:', error);
      throw error;
    }
  }

  /**
   * Get vendor statistics
   * @param {String} vendorCode - Vendor code
   * @returns {Object} Statistics
   */
  async getVendorStatistics(vendorCode) {
    try {
      // Fetch vendor details
      const vendor = await this.getVendorDetails(vendorCode);

      // Fetch related data counts from MAS
      const [poResponse, invoiceResponse] = await Promise.all([
        masApiService.get(require('../config/environment').mas.endpoints.purchaseOrders, {
          'oslc.where': `vendor="${vendorCode}"`,
          'oslc.select': 'ponum',
          'oslc.pageSize': 1,
        }),
        masApiService.get(require('../config/environment').mas.endpoints.invoices, {
          'oslc.where': `vendor="${vendorCode}"`,
          'oslc.select': 'invoicenum',
          'oslc.pageSize': 1,
        }),
      ]);

      const stats = {
        vendorCode: vendor.vendorCode,
        vendorName: vendor.name,
        status: vendor.status,
        totalPurchaseOrders: poResponse.totalCount || 0,
        totalInvoices: invoiceResponse.totalCount || 0,
        lastSync: new Date().toISOString(),
      };

      logger.info('Vendor statistics calculated:', { vendorCode, stats });

      return stats;
    } catch (error) {
      logger.error('Get vendor statistics error:', error);
      throw error;
    }
  }

  /**
   * Transform MAS vendors to our format
   * @param {Array} masVendors - MAS vendor array
   * @returns {Array} Transformed vendors
   */
  transformVendors(masVendors) {
    return masVendors.map(vendor => this.transformVendor(vendor));
  }

  /**
   * Transform single MAS vendor to our format
   * @param {Object} masVendor - MAS vendor object
   * @returns {Object} Transformed vendor
   */
  transformVendor(masVendor) {
    return {
      id: masVendor._rowstamp || masVendor.company,
      vendorCode: masVendor.company,
      name: masVendor.name,
      status: masVendor.status,
      type: masVendor.type,
      currency: masVendor.currencycode,
      paymentTerms: masVendor.paymentterms,
      contact: {
        name: masVendor.contact,
        phone: masVendor.phone,
        fax: masVendor.fax,
        email: masVendor.email,
      },
      address: {
        street: masVendor.address1,
        street2: masVendor.address2,
        city: masVendor.city,
        state: masVendor.stateprovince,
        postalCode: masVendor.postalcode,
        country: masVendor.country,
      },
      taxInfo: {
        taxId: masVendor.taxid,
        vatNumber: masVendor.vatnumber,
      },
      createdDate: masVendor.changedate,
      lastModified: masVendor.statusdate,
    };
  }
}

module.exports = new VendorService();

// Made with Bob