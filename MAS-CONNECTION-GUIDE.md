# IBM Maximo Application Suite (MAS) Connection Guide

## Overview
This guide documents the successful connection method to IBM Maximo Application Suite (MAS) demo server, including authentication, API endpoints, and implementation details.

## Connection Details

### Server Information
- **Base URL**: `https://demo.manage.instance.apps.sc-ncee-demo.pok-lb.techzone.ibm.com`
- **Environment**: Demo/Test Environment
- **Username**: WILSON (note: the API returns `"spi:userName": "WILSON"` with namespace prefix)
- **API Key**: `46skcdle5m1qt1u36b0dovbia8dtcq2iamucm6i3`

### SSL Certificate Handling
The demo server uses a self-signed SSL certificate. You must disable certificate verification:

**Node.js (axios)**:
```javascript
const https = require('https');
const axios = require('axios');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const response = await axios.get(url, {
  httpsAgent,
  // ... other options
});
```

**curl**:
```bash
curl -k https://demo.manage.instance.apps.sc-ncee-demo.pok-lb.techzone.ibm.com/...
```

## Authentication

### API Key Authentication
MAS uses API key authentication via HTTP headers.

**Required Headers**:
```javascript
{
  'apikey': '46skcdle5m1qt1u36b0dovbia8dtcq2iamucm6i3',
  'Accept': 'application/json'
}
```

**Important Notes**:
- Use `apikey` header (NOT `maxauth` or `Authorization`)
- The API key is case-sensitive
- Always include `Accept: application/json` for JSON responses

## API Endpoints

### Base Path
Use `/maximo/api/` as the base path (NOT `/maximo/oslc/`)

### 1. User Information (whoami)

**Endpoint**: `/maximo/api/whoami`

**Method**: GET

**curl Example**:
```bash
curl -k \
  -H "apikey: 46skcdle5m1qt1u36b0dovbia8dtcq2iamucm6i3" \
  -H "Accept: application/json" \
  "https://demo.manage.instance.apps.sc-ncee-demo.pok-lb.techzone.ibm.com/maximo/api/whoami"
```

**Node.js Example**:
```javascript
const axios = require('axios');
const https = require('https');

const response = await axios.get(
  'https://demo.manage.instance.apps.sc-ncee-demo.pok-lb.techzone.ibm.com/maximo/api/whoami',
  {
    headers: {
      'apikey': '46skcdle5m1qt1u36b0dovbia8dtcq2iamucm6i3',
      'Accept': 'application/json'
    },
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    }),
    timeout: 10000
  }
);

console.log(response.data);
```

**Response Structure**:
```json
{
  "spi:userName": "WILSON",
  "displayName": "Mike Wilson",
  "primaryemail": "m.wilson@helwig.com",
  "defaultOrg": "EAGLENA",
  "defaultSite": "BEDFORD",
  "personid": "WILSON",
  "langcode": "EN",
  "timezone": "GMT",
  "labor": {
    "laborcode": "WILSON",
    "laborcraftrate": {
      "craft": "Electrician",
      "skilllevel": "Electrician - 1st Class"
    }
  }
}
```

### 2. System Information

**Endpoint**: `/maximo/api/systeminfo`

**Method**: GET

**curl Example**:
```bash
curl -k \
  -H "apikey: 46skcdle5m1qt1u36b0dovbia8dtcq2iamucm6i3" \
  -H "Accept: application/json" \
  "https://demo.manage.instance.apps.sc-ncee-demo.pok-lb.techzone.ibm.com/maximo/api/systeminfo"
```

**Node.js Example**:
```javascript
const response = await axios.get(
  'https://demo.manage.instance.apps.sc-ncee-demo.pok-lb.techzone.ibm.com/maximo/api/systeminfo',
  {
    headers: {
      'apikey': '46skcdle5m1qt1u36b0dovbia8dtcq2iamucm6i3',
      'Accept': 'application/json'
    },
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    }),
    timeout: 10000
  }
);
```

**Response Structure**:
```json
{
  "appServer": "IBM WebSphere Liberty Server 25.0.0.12",
  "database": {
    "dbProductName": "DB2/LINUXX8664",
    "dbVersion": "SQL110590",
    "dbMajorVersion": 11,
    "dbMinorVersion": 5
  },
  "os": {
    "osName": "Linux",
    "osVersion": "5.14.0-427.96.1.el9_4.x86_64",
    "architecture": "amd64",
    "availableProcessors": 6
  },
  "operator": {
    "opVersion": "9.1.12"
  },
  "appVersion": {
    "rdfs:member": [
      {
        "spi:versionKey": "Maximo Manage 9.1.339 Build 20260216-0549"
      }
    ]
  }
}
```

### 3. MXAPI Endpoints (Object Structure API)

**Base Path**: `/maximo/oslc/os/`

**Examples**:
- Vendors: `/maximo/oslc/os/mxapivendor`
- Purchase Orders: `/maximo/oslc/os/mxapipo`
- Invoices: `/maximo/oslc/os/mxapiinvoice`

**Authentication**: Same API key header method

**Note**: These endpoints may return empty arrays if no test data exists in the demo environment.

## Implementation in Node.js/Express

### Environment Configuration

**.env file**:
```env
MAS_BASE_URL=https://demo.manage.instance.apps.sc-ncee-demo.pok-lb.techzone.ibm.com
MAS_API_KEY=46skcdle5m1qt1u36b0dovbia8dtcq2iamucm6i3
MAS_REJECT_UNAUTHORIZED=false
```

### Service Implementation

**masApiService.js**:
```javascript
const axios = require('axios');
const https = require('https');

class MASApiService {
  constructor() {
    this.baseURL = process.env.MAS_BASE_URL;
    this.apiKey = process.env.MAS_API_KEY;
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: process.env.MAS_REJECT_UNAUTHORIZED === 'false'
    });
  }

  async get(endpoint) {
    try {
      const response = await axios.get(
        `${this.baseURL}${endpoint}`,
        {
          headers: {
            'apikey': this.apiKey,
            'Accept': 'application/json'
          },
          httpsAgent: this.httpsAgent,
          timeout: 10000
        }
      );
      return response.data;
    } catch (error) {
      console.error(`MAS API Error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new MASApiService();
```

### Express Route Example

```javascript
const express = require('express');
const axios = require('axios');
const https = require('https');

const router = express.Router();

router.get('/whoami', async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.MAS_BASE_URL}/maximo/api/whoami`,
      {
        headers: {
          'apikey': process.env.MAS_API_KEY,
          'Accept': 'application/json'
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        timeout: 10000
      }
    );
    
    res.json({
      success: true,
      data: response.data,
      source: 'maximo'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

## Common Issues and Solutions

### Issue 1: SSL Certificate Error
**Error**: `SSL certificate problem: self signed certificate in certificate chain`

**Solution**: Disable SSL verification
```javascript
httpsAgent: new https.Agent({
  rejectUnauthorized: false
})
```

### Issue 2: Wrong API Path
**Error**: 404 Not Found or HTML login page returned

**Solution**: Use `/maximo/api/` instead of `/maximo/oslc/`
- ✅ Correct: `/maximo/api/whoami`
- ❌ Wrong: `/maximo/oslc/whoami`

### Issue 3: Authentication Header
**Error**: 401 Unauthorized or HTML login page

**Solution**: Use `apikey` header (not `maxauth` or `Authorization`)
```javascript
headers: {
  'apikey': 'YOUR_API_KEY',  // ✅ Correct
  'maxauth': 'YOUR_API_KEY'  // ❌ Wrong
}
```

### Issue 4: Empty Data Returns
**Error**: Empty arrays from MXAPI endpoints

**Explanation**: Demo environment may not have test data populated. This is expected behavior, not an implementation error.

## Testing

### Quick Test with curl

**Test whoami**:
```bash
curl -k \
  -H "apikey: 46skcdle5m1qt1u36b0dovbia8dtcq2iamucm6i3" \
  -H "Accept: application/json" \
  "https://demo.manage.instance.apps.sc-ncee-demo.pok-lb.techzone.ibm.com/maximo/api/whoami" | jq
```

**Test systeminfo**:
```bash
curl -k \
  -H "apikey: 46skcdle5m1qt1u36b0dovbia8dtcq2iamucm6i3" \
  -H "Accept: application/json" \
  "https://demo.manage.instance.apps.sc-ncee-demo.pok-lb.techzone.ibm.com/maximo/api/systeminfo" | jq
```

### Test Server
A test server is included in `test-api-server.js` that demonstrates the connection:

```bash
cd "MAS Vendor page"
PORT=3000 node test-api-server.js
```

Then open: http://localhost:3000/maximo-data-sync-test.html

## Best Practices

1. **Always use HTTPS** - Never downgrade to HTTP
2. **Store credentials securely** - Use environment variables, never hardcode
3. **Handle timeouts** - Set reasonable timeout values (10-30 seconds)
4. **Error handling** - Always wrap API calls in try-catch blocks
5. **Rate limiting** - Implement rate limiting for production use
6. **Logging** - Log API calls for debugging and monitoring
7. **Response validation** - Validate response structure before using data

## Production Considerations

For production environments:

1. **Use valid SSL certificates** - Enable `rejectUnauthorized: true`
2. **Secure API keys** - Use secrets management (AWS Secrets Manager, Azure Key Vault, etc.)
3. **Implement caching** - Cache responses to reduce API calls
4. **Add retry logic** - Implement exponential backoff for failed requests
5. **Monitor API usage** - Track API calls and response times
6. **Use connection pooling** - Reuse HTTP connections for better performance

## References

- IBM Maximo REST API Documentation
- IBM Maximo Application Suite Documentation
- OSLC (Open Services for Lifecycle Collaboration) Specification

## Version History

- **2026-03-18**: Initial documentation - Successful connection to demo server
  - Verified whoami endpoint with real user data
  - Verified systeminfo endpoint with real system data
  - Documented correct authentication method (apikey header)
  - Documented correct API path (/maximo/api/)