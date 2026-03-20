/**
 * Order Service
 * Handles purchase order operations with MAS API integration
 */

const masApiService = require('./masApiService');
const logger = require('../utils/logger');

class OrderService {
  /**
   * Get purchase orders for vendor
   * @param {String} vendorCode - Vendor code
   * @param {Object} filters - Filter options
   * @returns {Array} Purchase orders
   */
  async getOrders(vendorCode, filters = {}) {
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
        masFilters['oslc.where'] += ` and orderdate>="${dateFrom}" and orderdate<="${dateTo}"`;
      }

      // Add search filter
      if (search) {
        masFilters['oslc.where'] += ` and (ponum="${search}" or description~"${search}")`;
      }

      // Fetch from MAS API
      const response = await masApiService.getPurchaseOrders(vendorCode, masFilters);

      logger.info('Orders fetched:', { vendorCode, count: response.member?.length || 0 });

      // Transform MAS response to our format
      const orders = this.transformOrders(response.member || []);

      return {
        orders,
        total: response.totalCount || orders.length,
        page: parseInt(page),
        limit: parseInt(limit),
      };
    } catch (error) {
      logger.error('Get orders error:', error);
      throw error;
    }
  }

  /**
   * Get purchase order details
   * @param {String} poNum - Purchase order number
   * @returns {Object} PO details
   */
  async getOrderDetails(poNum) {
    try {
      const response = await masApiService.getPurchaseOrderDetails(poNum);

      if (!response.member || response.member.length === 0) {
        throw new Error('Purchase order not found');
      }

      const order = this.transformOrder(response.member[0]);

      logger.info('Order details fetched:', { poNum });

      return order;
    } catch (error) {
      logger.error('Get order details error:', error);
      throw error;
    }
  }

  /**
   * Acknowledge purchase order
   * @param {String} poNum - Purchase order number
   * @param {String} vendorCode - Vendor code
   * @returns {Object} Updated order
   */
  async acknowledgeOrder(poNum, vendorCode) {
    try {
      // Get current order
      const order = await this.getOrderDetails(poNum);

      // Verify vendor owns this order
      if (order.vendor !== vendorCode) {
        throw new Error('Unauthorized to acknowledge this order');
      }

      // Update order status in MAS
      const updateData = {
        status: 'ACKNOWLEDGED',
        vendoracknowledgedate: new Date().toISOString(),
      };

      await masApiService.patch(
        `${require('../config/environment').mas.endpoints.purchaseOrders}/${order.id}`,
        updateData
      );

      logger.info('Order acknowledged:', { poNum, vendorCode });

      return await this.getOrderDetails(poNum);
    } catch (error) {
      logger.error('Acknowledge order error:', error);
      throw error;
    }
  }

  /**
   * Get order statistics for vendor
   * @param {String} vendorCode - Vendor code
   * @returns {Object} Statistics
   */
  async getOrderStatistics(vendorCode) {
    try {
      // Fetch all orders
      const allOrders = await masApiService.getPurchaseOrders(vendorCode, {
        'oslc.select': 'ponum,status,totalcost,orderdate',
        'oslc.pageSize': 1000,
      });

      const orders = allOrders.member || [];

      // Calculate statistics
      const stats = {
        total: orders.length,
        active: orders.filter(o => ['APPROVED', 'INPRG'].includes(o.status)).length,
        completed: orders.filter(o => o.status === 'CLOSE').length,
        pending: orders.filter(o => o.status === 'WAPPR').length,
        totalValue: orders.reduce((sum, o) => sum + (parseFloat(o.totalcost) || 0), 0),
        last30Days: orders.filter(o => {
          const orderDate = new Date(o.orderdate);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return orderDate >= thirtyDaysAgo;
        }).length,
      };

      logger.info('Order statistics calculated:', { vendorCode, stats });

      return stats;
    } catch (error) {
      logger.error('Get order statistics error:', error);
      throw error;
    }
  }

  /**
   * Transform MAS orders to our format
   * @param {Array} masOrders - MAS order array
   * @returns {Array} Transformed orders
   */
  transformOrders(masOrders) {
    return masOrders.map(order => this.transformOrder(order));
  }

  /**
   * Transform single MAS order to our format
   * @param {Object} masOrder - MAS order object
   * @returns {Object} Transformed order
   */
  transformOrder(masOrder) {
    return {
      id: masOrder._rowstamp || masOrder.ponum,
      poNum: masOrder.ponum,
      description: masOrder.description,
      vendor: masOrder.vendor,
      status: masOrder.status,
      statusDescription: this.getStatusDescription(masOrder.status),
      orderDate: masOrder.orderdate,
      requiredDate: masOrder.requireddate,
      totalCost: parseFloat(masOrder.totalcost) || 0,
      currency: masOrder.currencycode || 'HUF',
      buyer: masOrder.buyer,
      shipTo: masOrder.shipto,
      billTo: masOrder.billto,
      lines: masOrder.poline?.map(line => ({
        lineNum: line.polinenum,
        itemNum: line.itemnum,
        description: line.description,
        quantity: parseFloat(line.orderqty) || 0,
        unitCost: parseFloat(line.unitcost) || 0,
        totalCost: parseFloat(line.linecost) || 0,
        receivedQty: parseFloat(line.receivedqty) || 0,
        status: line.status,
      })) || [],
      createdDate: masOrder.changedate,
      lastModified: masOrder.statusdate,
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
      'APPROVED': 'Approved',
      'INPRG': 'In Progress',
      'CLOSE': 'Closed',
      'CAN': 'Cancelled',
      'REVISE': 'Revision Required',
      'ACKNOWLEDGED': 'Acknowledged',
    };
    return statusMap[status] || status;
  }
}

module.exports = new OrderService();

// Made with Bob
