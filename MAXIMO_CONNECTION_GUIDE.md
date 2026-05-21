# Maximo Connection Guide

## 1. Overview

This document provides comprehensive guidance on connecting to IBM Maximo Application Suite (MAS) from the MAS Demo Vendor Portal application. The integration uses **REST/JSON API** to communicate with Maximo, providing a modern, type-safe approach to accessing Maximo data.

### Key Features
- ✅ REST/JSON API integration (not XML-based)
- ✅ API key authentication
- ✅ Support for multiple Maximo object sets (MXAPIASSET, MXAPIWO, MXAPIDB)
- ✅ TypeScript type safety
- ✅ Next.js API routes as backend proxy
- ✅ Self-signed certificate support for development

### Architecture
```
┌─────────────────────┐
│   React Frontend    │
│   (Browser)         │
└──────────┬──────────┘
           │ HTTP Request with headers
           │ (x-mas-api-key, x-mas-server-url)
           │
┌──────────▼──────────┐
│  Next.js API Routes │
│  (Backend Proxy)    │
└──────────┬──────────┘
           │ REST API (JSON)
           │ with API key
           │
┌──────────▼──────────┐
│   Maximo Server     │
│   REST API          │
└─────────────────────┘
```

## 2. Prerequisites

### Required Credentials
- **Maximo Server URL**: The base URL of your Maximo instance (e.g., `https://your-maximo-server.com`)
- **API Key**: A valid Maximo API key with appropriate permissions

### Required Permissions
Your Maximo API key must have permissions to:
- Read assets (MXAPIASSET)
- Read and write work orders (MXAPIWO)
- Read database relationships (MXAPIDB)
- Access system information endpoints (`/whoami`, `/systeminfo`)

### System Requirements
- Node.js 18+ (for Next.js)
- Modern web browser with JavaScript enabled
- Network access to Maximo server (HTTPS)

## 3. Environment Configuration

### Environment Variables

The application uses the following Maximo-related environment variables:

| Variable Name | Description | Example Value | Required |
|--------------|-------------|---------------|----------|
| `MAS_BASE_URL` | Base URL of your Maximo server | `https://your-maximo-server.com` | Optional* |
| `MAS_API_KEY` | Your Maximo API key | `your-api-key-here` | Optional* |
| `MAS_TENANT_ID` | Tenant identifier (if multi-tenant) | `tenant123` | Optional |
| `MAS_TIMEOUT` | Request timeout in milliseconds | `30000` | Optional |
| `MAS_REJECT_UNAUTHORIZED` | Reject self-signed certificates | `false` | Optional |

**Note**: These variables can be set in `.env` file OR configured through the application UI. The UI configuration takes precedence.

### Configuration File

Create a `.env` file in the project root (see [`.env.example`](.env.example)):

```bash
# MAS API Configuration
MAS_BASE_URL=https://your-maximo-server.com
MAS_API_KEY=your-api-key-here
MAS_TENANT_ID=
MAS_TIMEOUT=30000
MAS_REJECT_UNAUTHORIZED=false
```

### SSL Certificate Handling

For development environments with self-signed certificates, the application disables SSL verification:

```typescript
// In API route files
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

⚠️ **Security Warning**: This should only be used in development. In production, use valid SSL certificates and set `MAS_REJECT_UNAUTHORIZED=true`.

## 4. Authentication Methods

### API Key Authentication

The application uses **API key authentication** passed via query parameters to the Maximo REST API.

#### Authentication Flow

1. **Client sends request** to Next.js API route with headers:
   ```typescript
   headers: {
     'x-mas-api-key': 'your-api-key',
     'x-mas-server-url': 'https://your-maximo-server.com'
   }
   ```

2. **API route validates** credentials:
   ```typescript
   const apiKey = request.headers.get('x-mas-api-key');
   const serverUrl = request.headers.get('x-mas-server-url');
   
   if (!apiKey || !serverUrl) {
     return NextResponse.json(
       { success: false, error: 'Missing API credentials' },
       { status: 401 }
     );
   }
   ```

3. **API route constructs** Maximo URL with API key:
   ```typescript
   const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIWO?apikey=${apiKey}&lean=1`;
   ```

4. **Request sent** to Maximo with proper headers:
   ```typescript
   const response = await fetch(maximoUrl, {
     method: 'GET',
     headers: {
       'Accept': 'application/json',
       'Content-Type': 'application/json',
     },
   });
   ```

### Header Configuration

All API routes expect these custom headers:

| Header Name | Description | Example |
|------------|-------------|---------|
| `x-mas-api-key` | Maximo API key | `abc123xyz` |
| `x-mas-server-url` | Maximo server base URL | `https://maximo.example.com` |

## 5. Connection Setup

### Step-by-Step Setup

#### Step 1: Obtain Maximo Credentials

1. Log in to your Maximo instance as an administrator
2. Navigate to **System Configuration** → **Platform Configuration** → **API Keys**
3. Create a new API key or use an existing one
4. Copy the API key value
5. Note your Maximo server URL (e.g., `https://maximo.yourcompany.com`)

#### Step 2: Configure Environment Variables

**Option A: Using .env file**
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your credentials
MAS_BASE_URL=https://your-maximo-server.com
MAS_API_KEY=your-api-key-here
```

**Option B: Using Application UI**
1. Start the application
2. Navigate to the configuration page
3. Enter your Maximo server URL and API key
4. Click "Save Configuration"

#### Step 3: Verify Connection

Test the connection using the whoami endpoint:

```bash
curl -X GET http://localhost:8080/api/whoami \
  -H "x-mas-api-key: your-api-key" \
  -H "x-mas-server-url: https://your-maximo-server.com"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "username": "your-username",
    "personid": "PERSON123",
    "displayname": "Your Name"
  }
}
```

#### Step 4: Test System Information

```bash
curl -X GET http://localhost:8080/api/systeminfo \
  -H "x-mas-api-key: your-api-key" \
  -H "x-mas-server-url: https://your-maximo-server.com"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "version": "7.6.1.2",
    "build": "V7611-03",
    "maximoversion": "7.6.1.2"
  }
}
```

## 6. API Endpoints

### Overview of Maximo Object Sets

| Object Set | Purpose | API Route |
|-----------|---------|-----------|
| MXAPIASSET | Asset management | [`/api/assets`](frontend/app/api/assets/route.ts) |
| MXAPIWO | Work order management | [`/api/workorders`](frontend/app/api/workorders/route.ts) |
| MXAPIDB | Database relationships | [`/api/relationships`](frontend/app/api/relationships/route.ts) |

### 6.1 Assets API (MXAPIASSET)

**Endpoint**: `/api/assets`  
**File**: [`frontend/app/api/assets/route.ts`](frontend/app/api/assets/route.ts)

#### GET - List Assets

**Request**:
```http
GET /api/assets?pageSize=10
Headers:
  x-mas-api-key: your-api-key
  x-mas-server-url: https://your-maximo-server.com
```

**Maximo URL Constructed**:
```
{serverUrl}/maximo/api/os/MXAPIASSET?apikey={apiKey}&lean=1
  &oslc.select=assetnum,description,status,siteid,location,assettype,manufacturer,serialnum,installdate
  &oslc.pageSize=10
```

**Response**:
```json
{
  "success": true,
  "source": "maximo",
  "data": {
    "member": [
      {
        "assetnum": "ASSET001",
        "description": "Pump Motor",
        "status": "OPERATING",
        "siteid": "BEDFORD",
        "location": "BR100",
        "assettype": "PRODUCTION",
        "manufacturer": "ACME Corp",
        "serialnum": "SN123456",
        "installdate": "2023-01-15T00:00:00Z"
      }
    ],
    "responseInfo": {
      "totalCount": 100
    }
  }
}
```

#### PATCH - Update Asset

**Endpoint**: `/api/assets/update`  
**File**: [`frontend/app/api/assets/update/route.ts`](frontend/app/api/assets/update/route.ts)

**Request**:
```http
PATCH /api/assets/update
Content-Type: application/json

{
  "assetnum": "ASSET001",
  "siteid": "BEDFORD",
  "field": "description",
  "value": "Updated Pump Motor",
  "serverUrl": "https://your-maximo-server.com",
  "apiKey": "your-api-key"
}
```

**Supported Fields**:
- `description`
- `status`
- `location`
- `assettype`
- `manufacturer`
- `serialnum`
- `installdate`

### 6.2 Work Orders API (MXAPIWO)

**Endpoint**: `/api/workorders`  
**File**: [`frontend/app/api/workorders/route.ts`](frontend/app/api/workorders/route.ts)

#### GET - List Work Orders

**Request**:
```http
GET /api/workorders?pageSize=20
Headers:
  x-mas-api-key: your-api-key
  x-mas-server-url: https://your-maximo-server.com
```

**Maximo URL Constructed**:
```
{serverUrl}/maximo/api/os/MXAPIWO?apikey={apiKey}&lean=1
  &oslc.select=wonum,description,status,worktype,assetnum,location,priority,wopriority,
    schedstart,schedfinish,actstart,actfinish,lead,supervisor,siteid,orgid,reportedby,
    reportdate,owner,statusdate,targstartdate,targcompdate,estlabcost,estmatcost,
    estservcost,esttoolcost,estlabhrs,actlabcost,actmatcost,actservcost,acttoolcost,actlabhrs
  &oslc.pageSize=20
```

**Response**:
```json
{
  "success": true,
  "source": "maximo",
  "data": {
    "member": [
      {
        "wonum": "WO001",
        "description": "Repair pump motor",
        "status": "INPRG",
        "worktype": "CM",
        "assetnum": "ASSET001",
        "location": "BR100",
        "priority": 1,
        "schedstart": "2024-01-15T08:00:00Z",
        "schedfinish": "2024-01-15T17:00:00Z",
        "lead": "JOHN",
        "supervisor": "JANE",
        "siteid": "BEDFORD",
        "orgid": "EAGLENA",
        "estlabcost": 500.00,
        "actlabcost": 450.00
      }
    ]
  }
}
```

#### POST - Create Work Order

**Request**:
```http
POST /api/workorders
Headers:
  x-mas-api-key: your-api-key
  x-mas-server-url: https://your-maximo-server.com
Content-Type: application/json

{
  "description": "New work order",
  "assetnum": "ASSET001",
  "worktype": "CM",
  "status": "WAPPR"
}
```

**Response**:
```json
{
  "success": true,
  "source": "maximo",
  "data": {
    "wonum": "WO002",
    "description": "New work order",
    "status": "WAPPR"
  }
}
```

#### PATCH - Update Work Order Status

**Endpoint**: `/api/workorders/update-status`  
**File**: [`frontend/app/api/workorders/update-status/route.ts`](frontend/app/api/workorders/update-status/route.ts)

**Request**:
```http
PATCH /api/workorders/update-status
Content-Type: application/json

{
  "wonum": "WO001",
  "status": "COMP",
  "serverUrl": "https://your-maximo-server.com",
  "apiKey": "your-api-key"
}
```

**Valid Status Values**:
- `WAPPR` - Waiting on Approval
- `APPR` - Approved
- `INPRG` - In Progress
- `COMP` - Complete
- `CLOSE` - Closed
- `CAN` - Canceled
- `WMATL` - Waiting on Material
- `WSCH` - Waiting to be Scheduled

### 6.3 Relationships API (MXAPIDB)

**Endpoint**: `/api/relationships`  
**File**: [`frontend/app/api/relationships/route.ts`](frontend/app/api/relationships/route.ts)

#### GET - List Database Relationships

**Request**:
```http
GET /api/relationships?pageSize=50&parent=ASSET
Headers:
  x-mas-api-key: your-api-key
  x-mas-server-url: https://your-maximo-server.com
```

**Response**:
```json
{
  "success": true,
  "source": "maximo",
  "data": {
    "member": [
      {
        "name": "WORKORDER",
        "parent": "ASSET",
        "child": "WORKORDER",
        "whereclause": "assetnum=:assetnum and siteid=:siteid",
        "cardinality": "MULTIPLE"
      }
    ]
  }
}
```

### 6.4 System Endpoints

#### GET /api/whoami

**Purpose**: Verify authentication and get current user information  
**File**: [`frontend/app/api/whoami/route.ts`](frontend/app/api/whoami/route.ts)

**Request**:
```http
GET /api/whoami
Headers:
  x-mas-api-key: your-api-key
  x-mas-server-url: https://your-maximo-server.com
```

#### GET /api/systeminfo

**Purpose**: Get Maximo system information and version  
**File**: [`frontend/app/api/systeminfo/route.ts`](frontend/app/api/systeminfo/route.ts)

**Request**:
```http
GET /api/systeminfo
Headers:
  x-mas-api-key: your-api-key
  x-mas-server-url: https://your-maximo-server.com
```

## 7. Code Examples

### 7.1 Making Authenticated Requests

#### From Frontend (React Component)

```typescript
// Example: Fetching work orders
const fetchWorkOrders = async () => {
  const response = await fetch('/api/workorders?pageSize=20', {
    headers: {
      'x-mas-api-key': apiKey,
      'x-mas-server-url': serverUrl,
    },
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Work orders:', data.data.member);
  } else {
    console.error('Error:', data.error);
  }
};
```

#### From API Route (Backend)

```typescript
// Example from frontend/app/api/assets/route.ts
export async function GET(request: NextRequest) {
  try {
    // Extract credentials from headers
    const apiKey = request.headers.get('x-mas-api-key');
    const serverUrl = request.headers.get('x-mas-server-url');
    
    // Validate credentials
    if (!apiKey || !serverUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing API key or server URL' },
        { status: 400 }
      );
    }
    
    // Construct Maximo URL
    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIASSET?apikey=${apiKey}&lean=1`;
    
    // Make request to Maximo
    const response = await fetch(maximoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: `Maximo API error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      source: 'maximo',
      data: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 7.2 Error Handling Pattern

```typescript
// Example from frontend/app/api/workorders/route.ts
try {
  const response = await fetch(maximoUrl, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    signal: controller.signal, // For timeout handling
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Maximo API error:', response.status, errorText);
    
    return NextResponse.json(
      {
        success: false,
        error: `Maximo API error: ${response.status}`,
        details: errorText.substring(0, 1000),
      },
      { status: response.status }
    );
  }
  
  const data = await response.json();
  return NextResponse.json({ success: true, data });
  
} catch (error: any) {
  // Handle timeout
  if (error.name === 'AbortError') {
    return NextResponse.json(
      { success: false, error: 'Request timeout' },
      { status: 504 }
    );
  }
  
  // Handle network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return NextResponse.json(
      { success: false, error: 'Unable to connect to Maximo server' },
      { status: 503 }
    );
  }
  
  // Handle other errors
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 500 }
  );
}
```

### 7.3 PATCH Operations with SPI Namespace

```typescript
// Example from frontend/app/api/assets/update/route.ts
const FIELD_MAPPING: Record<string, string> = {
  description: 'spi:description',
  status: 'spi:status',
  location: 'spi:location',
};

// Encode resource ID
const resourceId = Buffer.from(`${assetnum}/${siteid}`).toString('base64');
const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIASSET/_${resourceId}?apikey=${apiKey}`;

// Make PATCH request using POST with override
const response = await fetch(maximoUrl, {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'x-method-override': 'PATCH',
    'patchtype': 'MERGE',
    'Properties': 'spi:description',
  },
  body: JSON.stringify({
    'spi:description': 'Updated value'
  }),
});
```

### 7.4 Using OSLC Query Parameters

```typescript
// Select specific fields
const fields = 'wonum,description,status,assetnum';
const url = `${serverUrl}/maximo/api/os/MXAPIWO?oslc.select=${fields}`;

// Filter results
const filter = 'status="INPRG"';
const url = `${serverUrl}/maximo/api/os/MXAPIWO?oslc.where=${encodeURIComponent(filter)}`;

// Pagination
const pageSize = 20;
const url = `${serverUrl}/maximo/api/os/MXAPIWO?oslc.pageSize=${pageSize}`;

// Combine parameters
const url = `${serverUrl}/maximo/api/os/MXAPIWO?apikey=${apiKey}&lean=1&oslc.select=${fields}&oslc.where=${encodeURIComponent(filter)}&oslc.pageSize=${pageSize}`;
```

## 8. Testing the Connection

### 8.1 Using the whoami Endpoint

**Test with curl**:
```bash
curl -X GET http://localhost:8080/api/whoami \
  -H "x-mas-api-key: YOUR_API_KEY" \
  -H "x-mas-server-url: https://your-maximo-server.com"
```

**Expected Success Response**:
```json
{
  "success": true,
  "data": {
    "username": "maxadmin",
    "personid": "MAXADMIN",
    "displayname": "Maximo Administrator"
  }
}
```

**Expected Error Response** (invalid credentials):
```json
{
  "success": false,
  "error": "Maximo API error: 401 Unauthorized"
}
```

### 8.2 Using the systeminfo Endpoint

**Test with curl**:
```bash
curl -X GET http://localhost:8080/api/systeminfo \
  -H "x-mas-api-key: YOUR_API_KEY" \
  -H "x-mas-server-url: https://your-maximo-server.com"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "version": "7.6.1.2",
    "build": "V7611-03",
    "maximoversion": "7.6.1.2",
    "dbtype": "Oracle",
    "hostname": "maximo-server.example.com"
  }
}
```

### 8.3 Testing Through the UI

1. **Start the application**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Open browser**: Navigate to `http://localhost:3000`

3. **Configure credentials**: Enter your Maximo server URL and API key in the configuration panel

4. **Test connection**: Click "Test Connection" button

5. **View results**: Check for success message and system information display

### 8.4 Testing with Postman

**Collection Setup**:
1. Create a new collection named "Maximo API Tests"
2. Add environment variables:
   - `mas_server_url`: Your Maximo server URL
   - `mas_api_key`: Your API key

**Example Request**:
```
GET {{mas_server_url}}/maximo/api/whoami?apikey={{mas_api_key}}
Headers:
  Accept: application/json
```

## 9. Troubleshooting

### 9.1 Authentication Failures

**Problem**: `401 Unauthorized` or `Missing API credentials`

**Solutions**:
1. Verify API key is correct and active in Maximo
2. Check that API key has not expired
3. Ensure headers are being sent correctly:
   ```typescript
   headers: {
     'x-mas-api-key': 'your-key',
     'x-mas-server-url': 'https://your-server.com'
   }
   ```
4. Verify API key has necessary permissions in Maximo

### 9.2 Connection Timeouts

**Problem**: `504 Gateway Timeout` or `Request timeout`

**Solutions**:
1. Check network connectivity to Maximo server
2. Verify firewall rules allow HTTPS traffic
3. Increase timeout value in environment:
   ```bash
   MAS_TIMEOUT=60000  # 60 seconds
   ```
4. Check Maximo server performance and load

### 9.3 CORS Issues

**Problem**: CORS errors in browser console

**Solutions**:
1. Ensure requests go through Next.js API routes (not directly to Maximo)
2. Verify CORS configuration in `.env`:
   ```bash
   CORS_ORIGIN=http://localhost:8080
   CORS_CREDENTIALS=true
   ```
3. Check that Maximo server allows requests from your domain

### 9.4 SSL Certificate Errors

**Problem**: `UNABLE_TO_VERIFY_LEAF_SIGNATURE` or SSL errors

**Solutions**:
1. For development, disable SSL verification:
   ```bash
   MAS_REJECT_UNAUTHORIZED=false
   ```
2. For production, install proper SSL certificates
3. Add certificate to trusted store:
   ```bash
   export NODE_EXTRA_CA_CERTS=/path/to/certificate.pem
   ```

### 9.5 Invalid API Responses

**Problem**: `Invalid JSON response` or parsing errors

**Solutions**:
1. Check Maximo API version compatibility
2. Verify `lean=1` parameter is included in URL
3. Check response content-type is `application/json`
4. Enable debug logging to inspect raw response:
   ```typescript
   const responseText = await response.text();
   console.log('Raw response:', responseText);
   ```

### 9.6 Field Not Found Errors

**Problem**: Requested fields return null or are missing

**Solutions**:
1. Verify field names match Maximo schema exactly
2. Check field is included in `oslc.select` parameter
3. Ensure field exists in your Maximo version
4. Check field permissions for your API key

### 9.7 Rate Limiting

**Problem**: `429 Too Many Requests`

**Solutions**:
1. Implement request throttling in frontend
2. Use pagination to reduce request size
3. Cache responses where appropriate
4. Contact Maximo administrator to adjust rate limits

## 10. Reference Links

### Official Documentation
- [IBM Maximo REST API Documentation](https://www.ibm.com/docs/en/mam/7.6.1?topic=api-maximo-rest)
- [OSLC Query Syntax](https://www.ibm.com/docs/en/mam/7.6.1?topic=api-oslc-query-syntax)
- [Maximo Object Structures](https://www.ibm.com/docs/en/mam/7.6.1?topic=api-object-structures)
- [Maximo API Authentication](https://www.ibm.com/docs/en/mam/7.6.1?topic=api-authentication)

### Project Documentation
- [MXAPIWO Integration Guide](frontend/MXAPIWO_INTEGRATION.md) - Detailed work order integration documentation
- [OpenShift Deployment Guide](OPENSHIFT_DEPLOYMENT.md) - Deployment instructions
- [Frontend README](frontend/README.md) - Frontend setup and development

### API Route Files
- [Assets API](frontend/app/api/assets/route.ts)
- [Work Orders API](frontend/app/api/workorders/route.ts)
- [Relationships API](frontend/app/api/relationships/route.ts)
- [WhoAmI API](frontend/app/api/whoami/route.ts)
- [System Info API](frontend/app/api/systeminfo/route.ts)

## 11. Security Best Practices

### 11.1 API Key Management

✅ **DO**:
- Store API keys in environment variables, never in code
- Use different API keys for development and production
- Rotate API keys regularly
- Limit API key permissions to minimum required
- Use server-side API routes to proxy requests (never expose keys to browser)

❌ **DON'T**:
- Commit API keys to version control
- Share API keys via email or chat
- Use production keys in development
- Hardcode API keys in frontend code

### 11.2 HTTPS and SSL

✅ **DO**:
- Use HTTPS for all Maximo connections in production
- Validate SSL certificates in production (`MAS_REJECT_UNAUTHORIZED=true`)
- Use proper SSL certificates (not self-signed) in production

❌ **DON'T**:
- Disable SSL verification in production
- Use HTTP for sensitive data
- Ignore SSL certificate warnings

### 11.3 Request Validation

✅ **DO**:
- Validate all input parameters
- Sanitize user input before sending to Maximo
- Implement request timeouts
- Use TypeScript for type safety
- Validate response data structure

### 11.4 Error Handling

✅ **DO**:
- Log errors server-side for debugging
- Return generic error messages to clients
- Implement proper error codes
- Handle network failures gracefully

❌ **DON'T**:
- Expose internal error details to clients
- Return stack traces in production
- Ignore error cases

## 12. Performance Optimization

### 12.1 Query Optimization

**Use lean parameter**:
```typescript
const url = `${serverUrl}/maximo/api/os/MXAPIWO?lean=1`;
```
This reduces response payload by ~30-40%.

**Select only needed fields**:
```typescript
const fields = 'wonum,description,status'; // Only what you need
const url = `${serverUrl}/maximo/api/os/MXAPIWO?oslc.select=${fields}`;
```

**Use pagination**:
```typescript
const url = `${serverUrl}/maximo/api/os/MXAPIWO?oslc.pageSize=20`;
```

### 12.2 Caching Strategy

**API Route Caching** (Next.js):
```typescript
// Enable caching for GET requests
export const revalidate = 60; // Revalidate every 60 seconds

return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
  },
});
```

**Client-Side Caching**:
- Use React Query or SWR for automatic caching
- Implement local storage for configuration
- Cache static data (e.g., status lists)

### 12.3 Request Batching

For multiple related requests, consider:
- Combining queries using OSLC filters
- Using Maximo's bulk operations
- Implementing request queuing

### 12.4 Timeout Configuration

```typescript
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

const response = await fetch(url, {
  signal: controller.signal,
});
```

## 13. Development Workflow

### 13.1 Local Development Setup

```bash
# Clone repository
git clone <repository-url>
cd MAS-Demo-Shareable

# Install dependencies
cd frontend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Maximo credentials

# Start development server
npm run dev
```

### 13.2 Testing Workflow

1. **Unit Tests**: Test individual API route functions
2. **Integration Tests**: Test full request/response cycle
3. **Manual Testing**: Use Postman or curl for API testing
4. **UI Testing**: Test through the application interface

### 13.3 Debugging Tips

**Enable verbose logging**:
```typescript
console.log('Request URL:', maximoUrl);
console.log('Request headers:', headers);
console.log('Response status:', response.status);
console.log('Response data:', await response.text());
```

**Use browser DevTools**:
- Network tab to inspect requests/responses
- Console for error messages
- Application tab for stored credentials

**Check Next.js logs**:
```bash
# Terminal running npm run dev shows server-side logs
```

## 14. Appendix

### 14.1 Common Maximo Object Sets

| Object Set | Description | Common Use Cases |
|-----------|-------------|------------------|
| MXAPIASSET | Assets | Equipment, facilities, infrastructure |
| MXAPIWO | Work Orders | Maintenance tasks, repairs |
| MXAPIPM | Preventive Maintenance | Scheduled maintenance |
| MXAPISR | Service Requests | User-reported issues |
| MXAPIPO | Purchase Orders | Procurement |
| MXAPIINVBALANCES | Inventory | Stock levels, materials |
| MXAPILOCATION | Locations | Physical locations |
| MXAPIPERSON | People | Users, technicians |

### 14.2 OSLC Query Examples

**Filter by status**:
```
oslc.where=status="INPRG"
```

**Filter by date range**:
```
oslc.where=schedstart>="2024-01-01T00:00:00Z" and schedstart<="2024-12-31T23:59:59Z"
```

**Filter by multiple conditions**:
```
oslc.where=status="INPRG" and priority<=2
```

**Order results**:
```
oslc.orderBy=+priority,-schedstart
```

### 14.3 HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST request |
| 204 | No Content | Successful PATCH/DELETE |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Invalid API key |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Maximo server error |
| 503 | Service Unavailable | Maximo server down |
| 504 | Gateway Timeout | Request timeout |

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-05-13  
**Author**: Bob (AI Assistant)  
**Status**: Production Ready

For questions or issues, please refer to the project documentation or contact your Maximo administrator.