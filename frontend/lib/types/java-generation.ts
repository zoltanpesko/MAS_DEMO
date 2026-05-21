// ============================================================================
// Java to Maximo Script Generation - Type Definitions
// ============================================================================

/**
 * Represents a parsed Java method
 */
export interface JavaMethod {
  name: string;
  returnType: string;
  parameters: JavaParameter[];
  modifiers: string[];
  annotations: string[];
  body?: string;
  isConstructor: boolean;
  isStatic: boolean;
  isPublic: boolean;
  isPrivate: boolean;
  isProtected: boolean;
}

/**
 * Represents a Java method parameter
 */
export interface JavaParameter {
  name: string;
  type: string;
  annotations: string[];
}

/**
 * Represents a parsed Java field
 */
export interface JavaField {
  name: string;
  type: string;
  modifiers: string[];
  annotations: string[];
  initialValue?: string;
  isStatic: boolean;
  isFinal: boolean;
  isPublic: boolean;
  isPrivate: boolean;
  isProtected: boolean;
}

/**
 * Represents a parsed Java class structure
 */
export interface JavaClassInfo {
  className: string;
  packageName?: string;
  imports: string[];
  extends?: string;
  implements: string[];
  modifiers: string[];
  annotations: string[];
  fields: JavaField[];
  methods: JavaMethod[];
  constructors: JavaMethod[];
  isInterface: boolean;
  isAbstract: boolean;
  isPublic: boolean;
}

/**
 * Options for script generation
 */
export interface GenerationOptions {
  targetLanguage: 'python' | 'javascript';
  includeComments: boolean;
  includeImports: boolean;
  applyMaximoBestPractices: boolean;
  generateDescription: boolean;
}

/**
 * Represents a conversion warning or suggestion
 */
export interface ConversionWarning {
  type: 'warning' | 'info' | 'error';
  message: string;
  line?: number;
  suggestion?: string;
}

/**
 * Represents the generated script output
 */
export interface GeneratedScript {
  scriptName: string;
  description: string;
  scriptLanguage: 'python' | 'javascript';
  source: string;
  warnings: ConversionWarning[];
  metadata: {
    originalClassName: string;
    generatedAt: string;
    conversionNotes: string[];
  };
}

/**
 * API request for generating script from Java
 */
export interface GenerateFromJavaRequest {
  javaSource: string;
  options?: Partial<GenerationOptions>;
}

/**
 * API response for successful script generation
 */
export interface GenerateFromJavaSuccessResponse {
  success: true;
  data: GeneratedScript;
  message: string;
}

/**
 * API response for failed script generation
 */
export interface GenerateFromJavaErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  details?: string;
}

/**
 * Combined API response type
 */
export type GenerateFromJavaResponse = 
  | GenerateFromJavaSuccessResponse 
  | GenerateFromJavaErrorResponse;

/**
 * Parsing result from Java parser
 */
export interface JavaParseResult {
  success: boolean;
  classInfo?: JavaClassInfo;
  error?: string;
  warnings?: ConversionWarning[];
}

/**
 * Script generation result
 */
export interface ScriptGenerationResult {
  success: boolean;
  script?: GeneratedScript;
  error?: string;
}

// Made with Bob
