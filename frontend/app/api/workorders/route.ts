import { NextRequest, NextResponse } from 'next/server';

// Disable SSL verification for demo purposes (self-signed certificates)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface WorkOrder {
  // Core identification fields
  wonum: string;
  description?: string;
  status?: string;
  worktype?: string;
  assetnum?: string;
  location?: string;
  priority?: number;
  wopriority?: number;
  
  // Scheduling fields
  schedstart?: string;
  schedfinish?: string;
  actstart?: string;
  actfinish?: string;
  
  // Personnel fields
  lead?: string;
  supervisor?: string;
  
  // MXAPIWO: Organizational fields
  siteid?: string;
  orgid?: string;
  
  // MXAPIWO: Tracking fields
  reportedby?: string;
  reportdate?: string;
  owner?: string;
  statusdate?: string;
  
  // MXAPIWO: Target dates
  targstartdate?: string;
  targcompdate?: string;
  
  // MXAPIWO: Cost management - Estimated
  estlabcost?: number;
  estmatcost?: number;
  estservcost?: number;
  esttoolcost?: number;
  estlabhrs?: number;
  
  // MXAPIWO: Cost management - Actual
  actlabcost?: number;
  actmatcost?: number;
  actservcost?: number;
  acttoolcost?: number;
  actlabhrs?: number;
  
  [key: string]: any;
}

interface MaximoApiResponse {
  member?: WorkOrder[];
  responseInfo?: {
    totalCount?: number;
    pagenum?: number;
  };
  [key: string]: any;
}

interface ApiSuccessResponse {
  success: true;
  data: MaximoApiResponse;
  source: string;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  details?: string;
}

// ============================================================================
// Configuration Constants
// ============================================================================

const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates and normalizes the pageSize parameter
 * @param value - The pageSize value from query params
 * @returns Validated page size number
 */
function validatePageSize(value: string | null): number {
  if (!value) {
    return DEFAULT_PAGE_SIZE;
  }

  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    return DEFAULT_PAGE_SIZE;
  }

  if (parsed < MIN_PAGE_SIZE) {
    return MIN_PAGE_SIZE;
  }

  if (parsed > MAX_PAGE_SIZE) {
    return MAX_PAGE_SIZE;
  }

  return parsed;
}

/**
 * Creates an AbortController with timeout
 * @param timeoutMs - Timeout in milliseconds
 * @returns AbortController and cleanup function
 */
function createTimeoutController(timeoutMs: number): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  return {
    controller,
    cleanup: () => clearTimeout(timeoutId),
  };
}

/**
 * Creates a standardized error response
 * @param error - Error object or message
 * @param status - HTTP status code
 * @param errorCode - Optional error code for client handling
 * @returns NextResponse with error details
 */
function createErrorResponse(
  error: any,
  status: number,
  errorCode?: string
): NextResponse<ApiErrorResponse> {
  const errorMessage = error?.message || String(error);
  
  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      errorCode,
      details: error?.details,
    },
    { status }
  );
}

// ============================================================================
// Route Configuration
// ============================================================================

// Enable caching for GET requests (revalidate every 60 seconds)
export const revalidate = 60;

// ============================================================================
// GET Handler - List Work Orders
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<ApiSuccessResponse | ApiErrorResponse>> {
  const { controller, cleanup } = createTimeoutController(REQUEST_TIMEOUT_MS);

  try {
    // Extract authentication credentials from headers
    const apiKey = request.headers.get('x-mas-api-key');
    const serverUrl = request.headers.get('x-mas-server-url');

    // Validate authentication credentials
    if (!apiKey || !serverUrl) {
      return createErrorResponse(
        { message: 'Missing API credentials' },
        401,
        'AUTH_MISSING_CREDENTIALS'
      );
    }

    // Extract and validate query parameters
    const { searchParams } = new URL(request.url);
    const pageSizeParam = searchParams.get('pageSize');
    const pageSize = validatePageSize(pageSizeParam);

    // Construct Maximo API URL with work order fields (using MXAPIWO object structure)
    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIWO?apikey=${apiKey}&lean=1&oslc.select=wonum,description,status,worktype,assetnum,location,priority,wopriority,schedstart,schedfinish,actstart,actfinish,lead,supervisor,siteid,orgid,reportedby,reportdate,owner,statusdate,targstartdate,targcompdate,estlabcost,estmatcost,estservcost,esttoolcost,estlabhrs,actlabcost,actmatcost,actservcost,acttoolcost,actlabhrs&oslc.pageSize=${pageSize}`;

    // Make request to Maximo API with timeout
    const response = await fetch(maximoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    // Handle non-OK responses from Maximo API
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Maximo API error:', response.status, errorText);
      
      return createErrorResponse(
        {
          message: `Maximo API error: ${response.status}`,
          details: errorText.substring(0, 1000),
        },
        response.status,
        'MAXIMO_API_ERROR'
      );
    }

    // Parse response data
    const data: MaximoApiResponse = await response.json();

    // Return successful response with cache headers
    return NextResponse.json(
      {
        success: true,
        data: data,
        source: 'maximo',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      console.error('Request timeout fetching work orders');
      return createErrorResponse(
        { message: 'Request timeout - the server took too long to respond' },
        504,
        'REQUEST_TIMEOUT'
      );
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('Network error fetching work orders:', error);
      return createErrorResponse(
        { message: 'Unable to connect to Maximo server' },
        503,
        'NETWORK_ERROR'
      );
    }

    // Handle all other errors
    console.error('Error fetching work orders:', error);
    return createErrorResponse(
      error,
      500,
      'INTERNAL_ERROR'
    );
  } finally {
    // Clean up timeout
    cleanup();
  }
}

// ============================================================================
// POST Handler - Create Work Order
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<ApiSuccessResponse | ApiErrorResponse>> {
  const { controller, cleanup } = createTimeoutController(REQUEST_TIMEOUT_MS);

  try {
    // Extract authentication credentials from headers
    const apiKey = request.headers.get('x-mas-api-key');
    const serverUrl = request.headers.get('x-mas-server-url');

    // Validate authentication credentials
    if (!apiKey || !serverUrl) {
      return createErrorResponse(
        { message: 'Missing API credentials' },
        401,
        'AUTH_MISSING_CREDENTIALS'
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields for work order creation
    if (!body.description) {
      return createErrorResponse(
        { message: 'Missing required field: description' },
        400,
        'VALIDATION_ERROR'
      );
    }

    // Construct Maximo API URL (using MXAPIWO object structure)
    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIWO?apikey=${apiKey}`;

    // Make request to Maximo API with timeout
    const response = await fetch(maximoUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    // Handle non-OK responses from Maximo API
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Maximo API error:', response.status, errorText);
      
      return createErrorResponse(
        {
          message: `Failed to create work order: ${response.status}`,
          details: errorText.substring(0, 1000),
        },
        response.status,
        'MAXIMO_API_ERROR'
      );
    }

    // Parse response data
    const data: MaximoApiResponse = await response.json();

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: data,
        source: 'maximo',
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      console.error('Request timeout creating work order');
      return createErrorResponse(
        { message: 'Request timeout - the server took too long to respond' },
        504,
        'REQUEST_TIMEOUT'
      );
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('Network error creating work order:', error);
      return createErrorResponse(
        { message: 'Unable to connect to Maximo server' },
        503,
        'NETWORK_ERROR'
      );
    }

    // Handle all other errors
    console.error('Error creating work order:', error);
    return createErrorResponse(
      error,
      500,
      'INTERNAL_ERROR'
    );
  } finally {
    // Clean up timeout
    cleanup();
  }
}

// Made with Bob
