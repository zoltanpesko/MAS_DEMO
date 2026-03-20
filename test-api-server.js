/**
 * Simple Test Server for MAS API Testing
 * Runs without database - only for testing MAS API endpoints
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// MAS Configuration
const MAS_BASE_URL = process.env.MAS_BASE_URL;
const MAS_API_KEY = process.env.MAS_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/public')));

// Import MAS API service
const masApiService = require('./backend/src/services/masApiService');
const vendorService = require('./backend/src/services/vendorService');
const orderService = require('./backend/src/services/orderService');
const invoiceService = require('./backend/src/services/invoiceService');

// Mock authentication middleware (for testing only)
const mockAuth = (req, res, next) => {
  req.user = { id: 1, username: 'test' };
  req.vendor = { vendorCode: 'VENDOR001' };
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Test server running - MAS API only',
    masServer: process.env.MAS_BASE_URL,
  });
});

// Test MAS connection
app.get('/api/test-connection', async (req, res) => {
  try {
    const health = await masApiService.healthCheck();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get system info from Maximo
app.get('/api/systeminfo', async (req, res) => {
  try {
    // Get API key and server URL from request headers (sent from frontend)
    const apiKey = req.headers['x-mas-api-key'] || MAS_API_KEY;
    const serverUrl = req.headers['x-mas-server-url'] || MAS_BASE_URL;
    
    console.log('Fetching system info from Maximo...');
    console.log('Using server:', serverUrl);
    
    const response = await axios.get(
      `${serverUrl}/maximo/api/systeminfo`,
      {
        headers: {
          'apikey': apiKey,
          'Accept': 'application/json'
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        timeout: 10000
      }
    );

    console.log('System info response status:', response.status);
    
    if (response.data) {
      return res.json({
        success: true,
        data: response.data,
        source: 'maximo'
      });
    }
  } catch (error) {
    console.error('Error fetching system info from Maximo:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch system information',
      details: error.message
    });
  }
});

// Get current user info from Maximo
app.get('/api/whoami', async (req, res) => {
  try {
    // Get API key and server URL from request headers (sent from frontend)
    const apiKey = req.headers['x-mas-api-key'] || MAS_API_KEY;
    const serverUrl = req.headers['x-mas-server-url'] || MAS_BASE_URL;
    
    console.log('Fetching whoami from Maximo...');
    console.log('Using server:', serverUrl);
    
    const response = await axios.get(
      `${serverUrl}/maximo/api/whoami`,
      {
        headers: {
          'apikey': apiKey,
          'Accept': 'application/json'
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        timeout: 10000
      }
    );

    console.log('Whoami response status:', response.status);
    
    if (response.data) {
      return res.json({
        success: true,
        data: response.data,
        source: 'maximo'
      });
    }
  } catch (error) {
    console.error('Error fetching whoami from Maximo:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user information from Maximo',
      details: error.message
    });
  }
});

// Get assets from Maximo
app.get('/api/assets', async (req, res) => {
  try {
    // Get API key and server URL from request headers (sent from frontend)
    const apiKey = req.headers['x-mas-api-key'] || MAS_API_KEY;
    const serverUrl = req.headers['x-mas-server-url'] || MAS_BASE_URL;
    
    console.log('Fetching assets from Maximo...');
    console.log('Using server:', serverUrl);
    
    // Use the correct Maximo API format with apikey as query parameter
    const response = await axios.get(
      `${serverUrl}/maximo/api/os/MXAPIASSET?apikey=${apiKey}&lean=1&oslc.select=assetnum,description,status,siteid,location,assettype,manufacturer,serialnum,installdate&oslc.pageSize=10`,
      {
        headers: {
          'Accept': 'application/json'
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        timeout: 30000  // Increased to 30 seconds
      }
    );

    console.log('Assets response status:', response.status);
    console.log('Assets count:', response.data?.member?.length || 0);
    
    if (response.data) {
      return res.json({
        success: true,
        data: response.data,
        source: 'maximo'
      });
    }
  } catch (error) {
    console.error('Error fetching assets from Maximo:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch assets',
      details: error.message
    });
  }
});

// Get vendors from Maximo (MXAPIINVVENDOR)
app.get('/api/maximo-vendors', async (req, res) => {
  try {
    // Get API key and server URL from request headers (sent from frontend)
    const apiKey = req.headers['x-mas-api-key'] || MAS_API_KEY;
    const serverUrl = req.headers['x-mas-server-url'] || MAS_BASE_URL;
    
    console.log('Fetching vendors from Maximo...');
    console.log('Using server:', serverUrl);
    
    // Use the correct Maximo API format with apikey as query parameter
    const response = await axios.get(
      `${serverUrl}/maximo/api/os/MXAPIINVVENDOR?apikey=${apiKey}&lean=1&oslc.select=company,name,type,status,vendor&oslc.pageSize=10`,
      {
        headers: {
          'Accept': 'application/json'
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        timeout: 30000  // Increased to 30 seconds
      }
    );

    console.log('Vendors response status:', response.status);
    console.log('Vendors count:', response.data?.member?.length || 0);
    
    if (response.data) {
      return res.json({
        success: true,
        data: response.data,
        source: 'maximo'
      });
    }
  } catch (error) {
    console.error('Error fetching vendors from Maximo:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendors',
      details: error.message
    });
  }
});

// Vendor endpoints
app.get('/api/vendors', mockAuth, async (req, res) => {
  try {
    const result = await vendorService.getVendors({
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      search: req.query.search,
      status: req.query.status,
    });
    res.json({ success: true, data: result.vendors, pagination: { total: result.total, page: result.page, limit: result.limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/vendors/:vendorCode', mockAuth, async (req, res) => {
  try {
    const vendor = await vendorService.getVendorDetails(req.params.vendorCode);
    res.json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/vendors/:vendorCode/statistics', mockAuth, async (req, res) => {
  try {
    const stats = await vendorService.getVendorStatistics(req.params.vendorCode);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Order endpoints
app.get('/api/orders', mockAuth, async (req, res) => {
  try {
    const result = await orderService.getOrders(req.vendor.vendorCode, {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      status: req.query.status,
      search: req.query.search,
    });
    res.json({ success: true, data: result.orders, pagination: { total: result.total, page: result.page, limit: result.limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/orders/statistics', mockAuth, async (req, res) => {
  try {
    const stats = await orderService.getOrderStatistics(req.vendor.vendorCode);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/orders/:poNum', mockAuth, async (req, res) => {
  try {
    const order = await orderService.getOrderDetails(req.params.poNum);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Invoice endpoints
app.get('/api/invoices', mockAuth, async (req, res) => {
  try {
    const result = await invoiceService.getInvoices(req.vendor.vendorCode, {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      status: req.query.status,
      search: req.query.search,
    });
    res.json({ success: true, data: result.invoices, pagination: { total: result.total, page: result.page, limit: result.limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/invoices/statistics', mockAuth, async (req, res) => {
  try {
    const stats = await invoiceService.getInvoiceStatistics(req.vendor.vendorCode);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/invoices/:invoiceNum', mockAuth, async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceDetails(req.params.invoiceNum);
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve test page
app.get('/test-sync', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public/maximo-data-sync-test.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public/maximo-data-sync-test.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 MAS API Test Server Started');
  console.log('='.repeat(60));
  console.log(`Port:        ${PORT}`);
  console.log(`URL:         http://localhost:${PORT}`);
  console.log(`Test Page:   http://localhost:${PORT}/test-sync`);
  console.log(`Health:      http://localhost:${PORT}/health`);
  console.log('');
  console.log(`MAS Server:  ${process.env.MAS_BASE_URL}`);
  console.log(`API Key:     ${process.env.MAS_API_KEY ? process.env.MAS_API_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
  console.log('='.repeat(60));
  console.log('');
  console.log('⚠️  NOTE: This is a test server with mock authentication');
  console.log('    For production, use the full server with database');
  console.log('');
});

// Made with Bob
