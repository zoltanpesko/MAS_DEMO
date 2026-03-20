/**
 * Environment Configuration
 * Centralized configuration management for the application
 */

require('dotenv').config();

const config = {
  // Application
  app: {
    name: process.env.APP_NAME || 'Maximo Vendor Portal',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 8080,
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // MAS API Configuration
  mas: {
    baseUrl: process.env.MAS_BASE_URL || 'https://mas-instance.com',
    apiKey: process.env.MAS_API_KEY || '',
    tenantId: process.env.MAS_TENANT_ID || '',
    timeout: parseInt(process.env.MAS_TIMEOUT, 10) || 30000,
    rejectUnauthorized: process.env.MAS_REJECT_UNAUTHORIZED !== 'false',
    endpoints: {
      // Authentication
      auth: '/maximo/oslc/login',
      logout: '/maximo/oslc/logout',
      
      // Vendor Management (using MXAPI endpoints)
      vendors: '/maximo/oslc/os/mxapivendor',
      persons: '/maximo/oslc/os/mxapiperson',
      
      // Purchase Orders (using MXAPI endpoints)
      purchaseOrders: '/maximo/oslc/os/mxapipo',
      poLines: '/maximo/oslc/os/mxapipoline',
      
      // Invoices (using MXAPI endpoints)
      invoices: '/maximo/oslc/os/mxapiinvoice',
      invoiceLines: '/maximo/oslc/os/mxapiinvoiceline',
      
      // Documents/Attachments
      doclinks: '/maximo/oslc/os/mxapidoclinks',
      
      // Companies
      companies: '/maximo/oslc/os/mxapicompany',
    },
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'vendor_portal',
    user: process.env.DB_USER || 'vendor_portal_user',
    password: process.env.DB_PASSWORD || '',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    },
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },

  // Security Configuration
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'change-this-secret',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    session: {
      secret: process.env.SESSION_SECRET || 'change-this-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.COOKIE_SECURE === 'true',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.COOKIE_SAME_SITE || 'strict',
      },
    },
    bcrypt: {
      saltRounds: 10,
    },
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    message: 'Too many requests from this IP, please try again later.',
  },

  // File Upload Configuration
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png').split(','),
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },

  // OpenShift Configuration
  openshift: {
    buildName: process.env.OPENSHIFT_BUILD_NAME || '',
    buildNamespace: process.env.OPENSHIFT_BUILD_NAMESPACE || '',
    buildCommit: process.env.OPENSHIFT_BUILD_COMMIT || '',
  },
};

// Validate required configuration
const validateConfig = () => {
  const required = [
    { key: 'MAS_BASE_URL', value: config.mas.baseUrl },
    { key: 'MAS_API_KEY', value: config.mas.apiKey },
    { key: 'JWT_SECRET', value: config.security.jwt.secret },
    { key: 'DB_PASSWORD', value: config.database.password },
  ];

  const missing = required.filter(item => !item.value || item.value === '');

  if (missing.length > 0 && config.app.isProduction) {
    console.error('Missing required environment variables:');
    missing.forEach(item => console.error(`  - ${item.key}`));
    process.exit(1);
  }

  if (missing.length > 0 && config.app.isDevelopment) {
    console.warn('Warning: Missing environment variables (using defaults):');
    missing.forEach(item => console.warn(`  - ${item.key}`));
  }
};

validateConfig();

module.exports = config;

// Made with Bob
