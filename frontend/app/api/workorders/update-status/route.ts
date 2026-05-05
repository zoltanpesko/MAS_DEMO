import { NextRequest, NextResponse } from 'next/server';

// Disable SSL verification for demo purposes (self-signed certificates)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface UpdateStatusRequest {
  wonum: string;
  status: string;
  serverUrl: string;
  apiKey: string;
}

interface ApiSuccessResponse {
  success: true;
  message: string;
  wonum: string;
  status: string;
  data?: any;
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

// Common work order statuses in Maximo
const VALID_STATUSES = [
  'WAPPR',   // Waiting on Approval
  'APPR',    // Approved
  'INPRG',   // In Progress
  'COMP',    // Complete
  'CLOSE',   // Closed
  'CAN',     // Canceled
  'WMATL',   // Waiting on Material
  'WSCH',    // Waiting to be Scheduled
];

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

/**
 * Validates work order status
 * @param status - Status to validate
 * @returns True if valid, false otherwise
 */
function isValidStatus(status: string): boolean {
  return VALID_STATUSES.includes(status.toUpperCase());
}

// ============================================================================
// PATCH Handler - Update Work Order Status
// ============================================================================

export async function PATCH(request: NextRequest): Promise<NextResponse<ApiSuccessResponse | ApiErrorResponse>> {
  const { controller, cleanup } = createTimeoutController(REQUEST_TIMEOUT_MS);

  try {
    // Parse request body
    const body: UpdateStatusRequest = await request.json();
    const { wonum, status, serverUrl, apiKey } = body;

    // Validate required fields
    if (!wonum || !status || !serverUrl || !apiKey) {
      return createErrorResponse(
        { message: 'Missing required parameters: wonum, status, serverUrl, apiKey' },
        400,
        'VALIDATION_ERROR'
      );
    }

    // Validate status format (optional warning, not blocking)
    if (!isValidStatus(status)) {
      console.warn(`Status '${status}' is not a common Maximo work order status. Valid statuses: ${VALID_STATUSES.join(', ')}`);
    }

    // Encode wonum as base64 for resource ID
    const resourceId = Buffer.from(wonum).toString('base64');

    // Construct Maximo API URL (using MXAPIWO object structure)
    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIWO/_${resourceId}?apikey=${apiKey}`;

    // Prepare update payload with SPI namespace
    const updatePayload = {
      'spi:status': status
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
        'Properties': 'spi:status',
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
          message: `Failed to update work order status: ${response.status} ${response.statusText}`,
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
        message: 'Work order status updated successfully',
        wonum: wonum,
        status: status,
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
        message: 'Work order status updated successfully',
        wonum: wonum,
        status: status,
      });
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      message: 'Work order status updated successfully',
      wonum: wonum,
      status: status,
      data: data,
    });
  } catch (error: any) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      console.error('Request timeout updating work order status');
      return createErrorResponse(
        { message: 'Request timeout - the server took too long to respond' },
        504,
        'REQUEST_TIMEOUT'
      );
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('Network error updating work order status:', error);
      return createErrorResponse(
        { message: 'Unable to connect to Maximo server' },
        503,
        'NETWORK_ERROR'
      );
    }

    // Handle all other errors
    console.error('Error updating work order status:', error);
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
