import { NextRequest, NextResponse } from "next/server";

// Disable SSL verification for demo purposes
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface AutoScript {
  autoscript: string;
  description?: string;
  scriptlanguage?: string;
  source?: string;
  active?: boolean;
  status?: string;
  [key: string]: any;
}

interface CreateScriptRequest {
  autoscript: string;
  description?: string;
  scriptlanguage?: string;
  source?: string;
}

interface MaximoApiResponse {
  member?: AutoScript[];
  [key: string]: any;
}

interface ApiSuccessResponse {
  success: true;
  data: AutoScript;
  message: string;
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
const MAX_SOURCE_SIZE_BYTES = 1048576; // 1MB limit for source code
const MAX_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;
const SCRIPT_NAME_PATTERN = /^[A-Z0-9_]+$/; // Uppercase alphanumeric and underscores only
const VALID_LANGUAGES = ['python', 'javascript', 'jython', 'nashorn', 'groovy'];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates script name format
 * @param name - Script name to validate
 * @returns Validation result with error message if invalid
 */
function validateScriptName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Script name is required' };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Script name is too long (max ${MAX_NAME_LENGTH} characters)` };
  }

  if (!SCRIPT_NAME_PATTERN.test(name)) {
    return {
      valid: false,
      error: 'Script name must contain only uppercase letters, numbers, and underscores',
    };
  }

  return { valid: true };
}

/**
 * Validates script language
 * @param language - Script language to validate
 * @returns Validation result with error message if invalid
 */
function validateScriptLanguage(language: string): { valid: boolean; error?: string } {
  if (!language) {
    return { valid: true }; // Optional, will default to 'python'
  }

  const normalizedLanguage = language.toLowerCase();
  
  if (!VALID_LANGUAGES.includes(normalizedLanguage)) {
    return {
      valid: false,
      error: `Invalid script language. Must be one of: ${VALID_LANGUAGES.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validates description length
 * @param description - Description to validate
 * @returns Validation result with error message if invalid
 */
function validateDescription(description?: string): { valid: boolean; error?: string } {
  if (!description) {
    return { valid: true }; // Optional field
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      error: `Description is too long (max ${MAX_DESCRIPTION_LENGTH} characters)`,
    };
  }

  return { valid: true };
}

/**
 * Validates source code size
 * @param source - Source code to validate
 * @returns Validation result with error message if invalid
 */
function validateSourceCode(source?: string): { valid: boolean; error?: string } {
  if (!source) {
    return { valid: true }; // Optional field for creation
  }

  const sizeInBytes = new Blob([source]).size;
  
  if (sizeInBytes > MAX_SOURCE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Source code is too large (${(sizeInBytes / 1024).toFixed(2)}KB, max ${MAX_SOURCE_SIZE_BYTES / 1024}KB)`,
    };
  }

  return { valid: true };
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

/**
 * Checks if a script with the given name already exists
 * @param scriptName - Name of the script to check
 * @param serverUrl - Maximo server URL
 * @param apiKey - API key for authentication
 * @param signal - AbortSignal for timeout
 * @returns True if script exists, false otherwise
 */
async function checkScriptExists(
  scriptName: string,
  serverUrl: string,
  apiKey: string,
  signal: AbortSignal
): Promise<boolean> {
  try {
    const checkUrl = `${serverUrl}/maximo/api/os/MXAPIAUTOSCRIPT?apikey=${apiKey}&lean=1&oslc.select=autoscript&oslc.where=autoscript="${scriptName}"&oslc.pageSize=1`;
    
    const response = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal,
    });

    if (!response.ok) {
      // If we can't check, assume it doesn't exist to allow creation attempt
      console.warn('Unable to check for duplicate script:', response.status);
      return false;
    }

    const data: MaximoApiResponse = await response.json();
    return !!(data.member && data.member.length > 0);
  } catch (error) {
    // If check fails, log and allow creation attempt
    console.warn('Error checking for duplicate script:', error);
    return false;
  }
}

// ============================================================================
// POST Handler - Create Automation Script
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<ApiSuccessResponse | ApiErrorResponse>> {
  const { controller, cleanup } = createTimeoutController(REQUEST_TIMEOUT_MS);

  try {
    // Extract authentication credentials from headers (standardized)
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
    const body: CreateScriptRequest = await request.json();
    const { autoscript, description, scriptlanguage, source } = body;

    // Validate script name
    const nameValidation = validateScriptName(autoscript);
    if (!nameValidation.valid) {
      return createErrorResponse(
        { message: nameValidation.error },
        400,
        'INVALID_SCRIPT_NAME'
      );
    }

    // Validate script language
    const languageValidation = validateScriptLanguage(scriptlanguage || 'python');
    if (!languageValidation.valid) {
      return createErrorResponse(
        { message: languageValidation.error },
        400,
        'INVALID_SCRIPT_LANGUAGE'
      );
    }

    // Validate description
    const descriptionValidation = validateDescription(description);
    if (!descriptionValidation.valid) {
      return createErrorResponse(
        { message: descriptionValidation.error },
        400,
        'INVALID_DESCRIPTION'
      );
    }

    // Validate source code
    const sourceValidation = validateSourceCode(source);
    if (!sourceValidation.valid) {
      return createErrorResponse(
        { message: sourceValidation.error },
        400,
        'INVALID_SOURCE'
      );
    }

    // Normalize script name to uppercase
    const normalizedScriptName = autoscript.toUpperCase();

    // Check for duplicate script name
    const scriptExists = await checkScriptExists(
      normalizedScriptName,
      serverUrl,
      apiKey,
      controller.signal
    );

    if (scriptExists) {
      return createErrorResponse(
        { message: `Script '${normalizedScriptName}' already exists` },
        409,
        'DUPLICATE_SCRIPT'
      );
    }

    // Prepare script data
    const scriptData: AutoScript = {
      autoscript: normalizedScriptName,
      description: description || "",
      scriptlanguage: (scriptlanguage || "python").toLowerCase(),
      active: false,
      status: "DRAFT",
      source: source || "",
    };

    // Construct Maximo API URL
    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIAUTOSCRIPT`;
    const url = `${maximoUrl}?apikey=${apiKey}&lean=1`;

    // Make request to Maximo API with timeout
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(scriptData),
      signal: controller.signal,
    });

    // Handle non-OK responses from Maximo API
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Maximo API error:", errorText);
      
      // Check if error is due to duplicate (in case our check missed it)
      if (response.status === 409 || errorText.toLowerCase().includes('duplicate')) {
        return createErrorResponse(
          {
            message: `Script '${normalizedScriptName}' already exists`,
            details: errorText,
          },
          409,
          'DUPLICATE_SCRIPT'
        );
      }
      
      return createErrorResponse(
        {
          message: `Maximo API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        response.status,
        'MAXIMO_API_ERROR'
      );
    }

    // Parse response data
    const result: AutoScript = await response.json();

    return NextResponse.json({
      success: true,
      data: result,
      message: "Script created successfully",
    });
  } catch (error: any) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      console.error('Request timeout creating script');
      return createErrorResponse(
        { message: 'Request timeout - the server took too long to respond' },
        504,
        'REQUEST_TIMEOUT'
      );
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('Network error creating script:', error);
      return createErrorResponse(
        { message: 'Unable to connect to Maximo server' },
        503,
        'NETWORK_ERROR'
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      console.error('Invalid JSON in request body:', error);
      return createErrorResponse(
        { message: 'Invalid request body - must be valid JSON' },
        400,
        'INVALID_JSON'
      );
    }

    // Handle all other errors
    console.error("Error creating script:", error);
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
