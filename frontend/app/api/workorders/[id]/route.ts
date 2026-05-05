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

interface ApiSuccessResponse {
  success: true;
  data?: WorkOrder;
  message?: string;
  source?: string;
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

// ============================================================================
// Utility Functions
// ============================================================================

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
// GET Handler - Retrieve Single Work Order
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccessResponse | ApiErrorResponse>> {
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

    // Resolve and get work order number from params
    const resolvedParams = await params;
    const wonum = resolvedParams.id;

    if (!wonum) {
      return createErrorResponse(
        { message: 'Missing work order number' },
        400,
        'VALIDATION_ERROR'
      );
    }

    // Encode wonum as base64 for resource ID
    const resourceId = Buffer.from(wonum).toString('base64');

    // Construct Maximo API URL (using MXAPIWO object structure)
    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIWO/_${resourceId}?apikey=${apiKey}&lean=1`;

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
    const data: WorkOrder = await response.json();

    // Return successful response
    return NextResponse.json({
      success: true,
      data: data,
      source: 'maximo',
    });
  } catch (error: any) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      console.error('Request timeout fetching work order');
      return createErrorResponse(
        { message: 'Request timeout - the server took too long to respond' },
        504,
        'REQUEST_TIMEOUT'
      );
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('Network error fetching work order:', error);
      return createErrorResponse(
        { message: 'Unable to connect to Maximo server' },
        503,
        'NETWORK_ERROR'
      );
    }

    // Handle all other errors
    console.error('Error fetching work order:', error);
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
// PATCH Handler - Update Work Order Fields
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiSuccessResponse | ApiErrorResponse>> {
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

    // Resolve and get work order number from params
    const resolvedParams = await params;
    const wonum = resolvedParams.id;

    if (!wonum) {
      return createErrorResponse(
        { message: 'Missing work order number' },
        400,
        'VALIDATION_ERROR'
      );
    }

    // Parse request body
    const body = await request.json();
    const { field, value } = body;

    // Validate required fields
    if (!field || value === undefined) {
      return createErrorResponse(
        { message: 'Missing required fields: field and value' },
        400,
        'VALIDATION_ERROR'
      );
    }

    // Encode wonum as base64 for resource ID
    const resourceId = Buffer.from(wonum).toString('base64');

    // Construct Maximo API URL (using MXAPIWO object structure)
    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIWO/_${resourceId}?apikey=${apiKey}`;

    // Prepare update payload with SPI namespace
    const updatePayload = {
      [`spi:${field}`]: value
    };

    // Make request to Maximo API with timeout
    // Use POST with x-method-override header for PATCH operation
    const response = await fetch(maximoUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-method-override': 'PATCH',
        'patchtype': 'MERGE',
        'Properties': `spi:${field}`,
      },
      body: JSON.stringify(updatePayload),
      signal: controller.signal,
    });

    // Handle non-OK responses from Maximo API
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Maximo API error:', response.status, errorText);
      
      return createErrorResponse(
        {
          message: `Failed to update work order: ${response.status}`,
          details: errorText.substring(0, 1000),
        },
        response.status,
        'MAXIMO_API_ERROR'
      );
    }

    // Handle 204 No Content response (successful update with no body)
    if (response.status === 204) {
      return NextResponse.json({
        success: true,
        message: 'Work order updated successfully',
        wonum: wonum,
      });
    }

    // Parse response data if available
    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      return NextResponse.json({
        success: true,
        message: 'Work order updated successfully',
      });
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      console.error('Request timeout updating work order');
      return createErrorResponse(
        { message: 'Request timeout - the server took too long to respond' },
        504,
        'REQUEST_TIMEOUT'
      );
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('Network error updating work order:', error);
      return createErrorResponse(
        { message: 'Unable to connect to Maximo server' },
        503,
        'NETWORK_ERROR'
      );
    }

    // Handle all other errors
    console.error('Error updating work order:', error);
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
