import { NextRequest, NextResponse } from "next/server";
import { parseJavaClass } from "@/lib/java-parser";
import { generateScript } from "@/lib/script-generator";
import type {
  GenerateFromJavaRequest,
  GenerateFromJavaSuccessResponse,
  GenerateFromJavaErrorResponse,
  GenerationOptions,
} from "@/lib/types/java-generation";

// Disable SSL verification for demo purposes
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ============================================================================
// Configuration Constants
// ============================================================================

const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const MAX_JAVA_SOURCE_SIZE_BYTES = 1048576; // 1MB limit for Java source
const VALID_TARGET_LANGUAGES = ['python', 'javascript'];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates Java source code
 * @param javaSource - Java source code to validate
 * @returns Validation result with error message if invalid
 */
function validateJavaSource(javaSource: string): { valid: boolean; error?: string } {
  if (!javaSource || javaSource.trim().length === 0) {
    return { valid: false, error: 'Java source code is required' };
  }

  const sizeInBytes = new Blob([javaSource]).size;
  
  if (sizeInBytes > MAX_JAVA_SOURCE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Java source is too large (${(sizeInBytes / 1024).toFixed(2)}KB, max ${MAX_JAVA_SOURCE_SIZE_BYTES / 1024}KB)`,
    };
  }

  // Basic Java class validation
  if (!javaSource.includes('class ') && !javaSource.includes('interface ')) {
    return {
      valid: false,
      error: 'Java source must contain a class or interface declaration',
    };
  }

  return { valid: true };
}

/**
 * Validates generation options
 * @param options - Generation options to validate
 * @returns Validation result with error message if invalid
 */
function validateOptions(options?: Partial<GenerationOptions>): { valid: boolean; error?: string } {
  if (!options) {
    return { valid: true }; // Options are optional
  }

  if (options.targetLanguage && !VALID_TARGET_LANGUAGES.includes(options.targetLanguage)) {
    return {
      valid: false,
      error: `Invalid target language. Must be one of: ${VALID_TARGET_LANGUAGES.join(', ')}`,
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
): NextResponse<GenerateFromJavaErrorResponse> {
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
// POST Handler - Generate Script from Java
// ============================================================================

/**
 * POST /api/scripts/generate-from-java
 * 
 * Generates a Maximo automation script from Java source code.
 * 
 * Request Body:
 * - javaSource: string (required) - Java source code
 * - options: object (optional) - Generation options
 *   - targetLanguage: 'python' | 'javascript' (default: 'python')
 *   - includeComments: boolean (default: true)
 *   - includeImports: boolean (default: true)
 *   - applyMaximoBestPractices: boolean (default: true)
 *   - generateDescription: boolean (default: true)
 * 
 * Response:
 * - success: boolean
 * - data: GeneratedScript (if successful)
 * - error: string (if failed)
 * - errorCode: string (if failed)
 */
export async function POST(request: NextRequest): Promise<NextResponse<GenerateFromJavaSuccessResponse | GenerateFromJavaErrorResponse>> {
  const { cleanup } = createTimeoutController(REQUEST_TIMEOUT_MS);

  try {
    // Parse request body
    const body: GenerateFromJavaRequest = await request.json();
    const { javaSource, options } = body;

    // Validate Java source code
    const sourceValidation = validateJavaSource(javaSource);
    if (!sourceValidation.valid) {
      return createErrorResponse(
        { message: sourceValidation.error },
        400,
        'INVALID_JAVA_SOURCE'
      );
    }

    // Validate generation options
    const optionsValidation = validateOptions(options);
    if (!optionsValidation.valid) {
      return createErrorResponse(
        { message: optionsValidation.error },
        400,
        'INVALID_OPTIONS'
      );
    }

    // Parse Java class
    console.log('Parsing Java class...');
    const parseResult = parseJavaClass(javaSource);

    if (!parseResult.success || !parseResult.classInfo) {
      return createErrorResponse(
        { 
          message: parseResult.error || 'Failed to parse Java class',
          details: 'The Java source code could not be parsed. Please check syntax and try again.',
        },
        400,
        'PARSE_ERROR'
      );
    }

    // Generate script
    console.log(`Generating ${options?.targetLanguage || 'python'} script from class: ${parseResult.classInfo.className}`);
    const generationResult = generateScript(parseResult.classInfo, options);

    if (!generationResult.success || !generationResult.script) {
      return createErrorResponse(
        { 
          message: generationResult.error || 'Failed to generate script',
          details: 'The script could not be generated from the parsed Java class.',
        },
        500,
        'GENERATION_ERROR'
      );
    }

    // Combine warnings from parsing and generation
    const allWarnings = [
      ...(parseResult.warnings || []),
      ...(generationResult.script.warnings || []),
    ];

    const finalScript = {
      ...generationResult.script,
      warnings: allWarnings,
    };

    // Return successful response
    return NextResponse.json({
      success: true,
      data: finalScript,
      message: `Script generated successfully from ${parseResult.classInfo.className}`,
    });

  } catch (error: any) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      console.error('Request timeout generating script from Java');
      return createErrorResponse(
        { message: 'Request timeout - the operation took too long to complete' },
        504,
        'REQUEST_TIMEOUT'
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
    console.error("Error generating script from Java:", error);
    return createErrorResponse(
      {
        message: error.message || 'An unexpected error occurred',
        details: error.stack,
      },
      500,
      'INTERNAL_ERROR'
    );
  } finally {
    // Clean up timeout
    cleanup();
  }
}

// ============================================================================
// GET Handler - API Documentation
// ============================================================================

/**
 * GET /api/scripts/generate-from-java
 * 
 * Returns API documentation and usage information.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/scripts/generate-from-java',
    method: 'POST',
    description: 'Generates a Maximo automation script from Java source code',
    requestBody: {
      javaSource: {
        type: 'string',
        required: true,
        description: 'Java source code to convert',
        maxSize: '1MB',
      },
      options: {
        type: 'object',
        required: false,
        description: 'Generation options',
        properties: {
          targetLanguage: {
            type: 'string',
            enum: ['python', 'javascript'],
            default: 'python',
            description: 'Target script language (Jython or Nashorn)',
          },
          includeComments: {
            type: 'boolean',
            default: true,
            description: 'Include explanatory comments in generated script',
          },
          includeImports: {
            type: 'boolean',
            default: true,
            description: 'Include Maximo-specific imports',
          },
          applyMaximoBestPractices: {
            type: 'boolean',
            default: true,
            description: 'Apply Maximo best practices to generated code',
          },
          generateDescription: {
            type: 'boolean',
            default: true,
            description: 'Generate script description from class info',
          },
        },
      },
    },
    response: {
      success: {
        type: 'boolean',
        description: 'Indicates if the operation was successful',
      },
      data: {
        type: 'object',
        description: 'Generated script information',
        properties: {
          scriptName: 'string - Maximo-compliant script name',
          description: 'string - Script description',
          scriptLanguage: 'string - Target language (python or javascript)',
          source: 'string - Generated script source code',
          warnings: 'array - Conversion warnings and suggestions',
          metadata: 'object - Additional metadata about the conversion',
        },
      },
      message: {
        type: 'string',
        description: 'Success or error message',
      },
    },
    examples: {
      request: {
        javaSource: 'public class AssetValidator { public boolean validate(String assetNum) { return assetNum != null && !assetNum.isEmpty(); } }',
        options: {
          targetLanguage: 'python',
          includeComments: true,
        },
      },
    },
    notes: [
      'The Java source must contain a valid class or interface declaration',
      'Complex Java features (inheritance, generics) may require manual adjustment',
      'Review generated scripts thoroughly before deploying to production',
      'Consider Maximo best practices when modifying generated code',
    ],
  });
}

// Made with Bob