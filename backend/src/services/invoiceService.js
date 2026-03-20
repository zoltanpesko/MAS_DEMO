/**
 * Invoice Service
 * Handles invoice operations with MAS API integration
 */

const masApiService = require('./masApiService');
const logger = require('../utils/logger');

class InvoiceService {
  /**
   * Get invoices for vendor
   * @param {String} vendorCode - Vendor code
   * @param {Object} filters - Filter options
   * @returns {Array} Invoices
   */
  async getInvoices(vendorCode, filters = {}) {
    try {
      const { page = 1, limit = 50, status, dateFrom, dateTo, search } = filters;

      // Build MAS API filters
      const masFilters = {
        pageSize: limit,
        'oslc.pageSize': limit,
      };

      // Add status filter
      if (status) {
        masFilters['oslc.where'] = `vendor="${vendorCode}" and status="${status}"`;
      } else {
        masFilters['oslc.where'] = `vendor="${vendorCode}"`;
      }

      // Add date range filter
      if (dateFrom && dateTo) {
        masFilters['oslc.where'] += ` and invoicedate>="${dateFrom}" and invoicedate<="${dateTo}"`;
      }

      // Add search filter
      if (search) {
        masFilters['oslc.where'] += ` and (invoicenum="${search}" or description~"${search}")`;
      }

      // Fetch from MAS API
      const response = await masApiService.getInvoices(vendorCode, masFilters);

      logger.info('Invoices fetched:', { vendorCode, count: response.member?.length || 0 });

      // Transform MAS response to our format
      const invoices = this.transformInvoices(response.member || []);

      return {
        invoices,
        total: response.totalCount || invoices.length,
        page: parseInt(page),
        limit: parseInt(limit),
      };
    } catch (error) {
      logger.error('Get invoices error:', error);
      throw error;
    }
  }

  /**
   * Get invoice details
   * @param {String} invoiceNum - Invoice number
   * @returns {Object} Invoice details
   */
  async getInvoiceDetails(invoiceNum) {
    try {
      const response = await masApiService.getInvoiceDetails(invoiceNum);

      if (!response.member || response.member.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = this.transformInvoice(response.member[0]);

      logger.info('Invoice details fetched:', { invoiceNum });

      return invoice;
    } catch (error) {
      logger.error('Get invoice details error:', error);
      throw error;
    }
  }

  /**
   * Create new invoice
   * @param {String} vendorCode - Vendor code
   * @param {Object} invoiceData - Invoice data
   * @returns {Object} Created invoice
   */
  async createInvoice(vendorCode, invoiceData) {
    try {
      const {
        poNumber,
        invoiceNumber,
        invoiceDate,
        dueDate,
        totalAmount,
        taxAmount,
        currency,
        description,
        lines,
      } = invoiceData;

      // Prepare MAS invoice data
      const masInvoiceData = {
        vendor: vendorCode,
        invoicenum: invoiceNumber,
        invoicedate: invoiceDate,
        duedate: dueDate,
        totalcost: totalAmount,
        tax1: taxAmount || 0,
        currencycode: currency || 'HUF',
        description: description || '',
        status: 'WAPPR', // Waiting for approval
        ponum: poNumber,
        invoiceline: lines?.map((line, index) => ({
          invoicelinenum: index + 1,
          description: line.description,
          linecost: line.amount,
          quantity: line.quantity || 1,
          unitcost: line.unitCost || line.amount,
        })) || [],
      };

      // Create invoice in MAS
      const response = await masApiService.createInvoice(masInvoiceData);

      logger.info('Invoice created:', { invoiceNum: invoiceNumber, vendorCode });

      return this.transformInvoice(response);
    } catch (error) {
      logger.error('Create invoice error:', error);
      throw error;
    }
  }

  /**
   * Get invoice statistics for vendor
   * @param {String} vendorCode - Vendor code
   * @returns {Object} Statistics
   */
  async getInvoiceStatistics(vendorCode) {
    try {
      // Fetch all invoices
      const allInvoices = await masApiService.getInvoices(vendorCode, {
        'oslc.select': 'invoicenum,status,totalcost,invoicedate',
        'oslc.pageSize': 1000,
      });

      const invoices = allInvoices.member || [];

      // Calculate statistics
      const stats = {
        total: invoices.length,
        pending: invoices.filter(i => ['WAPPR', 'INPRG'].includes(i.status)).length,
        approved: invoices.filter(i => i.status === 'APPR').length,
        paid: invoices.filter(i => i.status === 'PAID').length,
        rejected: invoices.filter(i => i.status === 'CAN').length,
        totalValue: invoices.reduce((sum, i) => sum + (parseFloat(i.totalcost) || 0), 0),
        pendingValue: invoices
          .filter(i => ['WAPPR', 'INPRG'].includes(i.status))
          .reduce((sum, i) => sum + (parseFloat(i.totalcost) || 0), 0),
        last30Days: invoices.filter(i => {
          const invoiceDate = new Date(i.invoicedate);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return invoiceDate >= thirtyDaysAgo;
        }).length,
      };

      logger.info('Invoice statistics calculated:', { vendorCode, stats });

      return stats;
    } catch (error) {
      logger.error('Get invoice statistics error:', error);
      throw error;
    }
  }

  /**
   * Transform MAS invoices to our format
   * @param {Array} masInvoices - MAS invoice array
   * @returns {Array} Transformed invoices
   */
  transformInvoices(masInvoices) {
    return masInvoices.map(invoice => this.transformInvoice(invoice));
  }

  /**
   * Transform single MAS invoice to our format
   * @param {Object} masInvoice - MAS invoice object
   * @returns {Object} Transformed invoice
   */
  transformInvoice(masInvoice) {
    return {
      id: masInvoice._rowstamp || masInvoice.invoicenum,
      invoiceNum: masInvoice.invoicenum,
      poNum: masInvoice.ponum,
      vendor: masInvoice.vendor,
      status: masInvoice.status,
      statusDescription: this.getStatusDescription(masInvoice.status),
      invoiceDate: masInvoice.invoicedate,
      dueDate: masInvoice.duedate,
      totalCost: parseFloat(masInvoice.totalcost) || 0,
      tax: parseFloat(masInvoice.tax1) || 0,
      currency: masInvoice.currencycode || 'HUF',
      description: masInvoice.description,
      paymentTerms: masInvoice.paymentterms,
      lines: masInvoice.invoiceline?.map(line => ({
        lineNum: line.invoicelinenum,
        description: line.description,
        quantity: parseFloat(line.quantity) || 0,
        unitCost: parseFloat(line.unitcost) || 0,
        lineCost: parseFloat(line.linecost) || 0,
        taxCode: line.tax1code,
      })) || [],
      createdDate: masInvoice.changedate,
      lastModified: masInvoice.statusdate,
    };
  }

  /**
   * Get human-readable status description
   * @param {String} status - MAS status code
   * @returns {String} Status description
   */
  getStatusDescription(status) {
    const statusMap = {
      'WAPPR': 'Waiting for Approval',
      'APPR': 'Approved',
      'INPRG': 'In Progress',
      'PAID': 'Paid',
      'CAN': 'Cancelled',
      'CLOSE': 'Closed',
    };
    return statusMap[status] || status;
  }
}

module.exports = new InvoiceService();

// Made with Bob
