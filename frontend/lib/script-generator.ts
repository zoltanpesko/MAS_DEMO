// ============================================================================
// Script Generator - Converts Java classes to Maximo automation scripts
// ============================================================================

import type {
  JavaClassInfo,
  JavaMethod,
  GenerationOptions,
  GeneratedScript,
  ConversionWarning,
  ScriptGenerationResult,
} from './types/java-generation';
import {
  convertJavaBodyToPython,
  generateJythonImports,
  convertIterationPatterns
} from './java-to-python-converter';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: GenerationOptions = {
  targetLanguage: 'python',
  includeComments: true,
  includeImports: true,
  applyMaximoBestPractices: true,
  generateDescription: true,
};

// Java to Python type mappings
const JAVA_TO_PYTHON_TYPES: Record<string, string> = {
  'String': 'str',
  'int': 'int',
  'Integer': 'int',
  'long': 'int',
  'Long': 'int',
  'double': 'float',
  'Double': 'float',
  'float': 'float',
  'Float': 'float',
  'boolean': 'bool',
  'Boolean': 'bool',
  'void': 'None',
  'Object': 'object',
  'List': 'list',
  'ArrayList': 'list',
  'Map': 'dict',
  'HashMap': 'dict',
  'Set': 'set',
  'HashSet': 'set',
  'Date': 'datetime',
};

// Java to JavaScript type mappings
const JAVA_TO_JS_TYPES: Record<string, string> = {
  'String': 'string',
  'int': 'number',
  'Integer': 'number',
  'long': 'number',
  'Long': 'number',
  'double': 'number',
  'Double': 'number',
  'float': 'number',
  'Float': 'number',
  'boolean': 'boolean',
  'Boolean': 'boolean',
  'void': 'void',
  'Object': 'any',
  'List': 'Array',
  'ArrayList': 'Array',
  'Map': 'Object',
  'HashMap': 'Object',
  'Set': 'Set',
  'HashSet': 'Set',
  'Date': 'Date',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Converts Java type to target language type
 */
function convertType(javaType: string, targetLanguage: 'python' | 'javascript'): string {
  const typeMap = targetLanguage === 'python' ? JAVA_TO_PYTHON_TYPES : JAVA_TO_JS_TYPES;
  
  // Handle array types
  if (javaType.endsWith('[]')) {
    return targetLanguage === 'python' ? 'list' : 'Array';
  }
  
  // Handle generic types (e.g., List<String>)
  if (javaType.includes('<')) {
    const baseType = javaType.split('<')[0];
    return typeMap[baseType] || (targetLanguage === 'python' ? 'object' : 'any');
  }
  
  return typeMap[javaType] || (targetLanguage === 'python' ? 'object' : 'any');
}

/**
 * Generates a Maximo-compliant script name from class name
 */
function generateScriptName(className: string): string {
  // Convert camelCase to UPPER_SNAKE_CASE
  const snakeCase = className
    .replace(/([A-Z])/g, '_$1')
    .toUpperCase()
    .replace(/^_/, '');
  
  return snakeCase;
}

/**
 * Generates script description from class info
 */
function generateDescription(classInfo: JavaClassInfo): string {
  const parts: string[] = [];
  
  parts.push(`Converted from Java class: ${classInfo.className}`);
  
  if (classInfo.packageName) {
    parts.push(`Package: ${classInfo.packageName}`);
  }
  
  if (classInfo.methods.length > 0) {
    parts.push(`Methods: ${classInfo.methods.length}`);
  }
  
  if (classInfo.fields.length > 0) {
    parts.push(`Fields: ${classInfo.fields.length}`);
  }
  
  return parts.join(' | ');
}

// ============================================================================
// Python Generator
// ============================================================================

/**
 * Determines which imports are needed based on the Java class
 * Enhanced with patterns from ScriptingWithMaximo.pdf
 */
function determineNeededImports(classInfo: JavaClassInfo): string[] {
  const importSet = new Set<string>();
  
  // Use the new generateJythonImports function from converter
  const fullSource = classInfo.methods.map(m => m.body || '').join('\n') +
                     classInfo.imports.join('\n');
  const autoImports = generateJythonImports(fullSource);
  autoImports.forEach(imp => importSet.add(imp));
  
  // Legacy import detection for backwards compatibility
  for (const javaImport of classInfo.imports) {
    if (javaImport.includes('psdi.mbo.MboConstants')) {
      importSet.add('from psdi.mbo import MboConstants');
    }
    if (javaImport.includes('psdi.mbo.Mbo')) {
      importSet.add('from psdi.mbo import Mbo, MboSet');
    }
    if (javaImport.includes('psdi.server.MXServer')) {
      importSet.add('from psdi.server import MXServer');
    }
    if (javaImport.includes('java.util')) {
      importSet.add('from java.util import HashMap, Date');
    }
  }
  
  if (classInfo.methods.length > 0 && !Array.from(importSet).some(i => i.includes('MboConstants'))) {
    importSet.add('from psdi.mbo import MboConstants');
  }
  
  return Array.from(importSet).sort();
}

function selectPrimaryMethod(classInfo: JavaClassInfo): JavaMethod | undefined {
  return classInfo.methods.find(m =>
    m.name === 'applyCustomAction' ||
    m.name === 'execute' ||
    m.name === 'main'
  ) || classInfo.methods[0];
}

/**
 * Generates Python (Jython) script from Java class
 */
function generatePythonScript(
  classInfo: JavaClassInfo,
  options: GenerationOptions
): string {
  const lines: string[] = [];
  const primaryMethod = selectPrimaryMethod(classInfo);
  
  if (options.includeComments) {
    lines.push('# Maximo Automation Script');
    lines.push(`# Converted from Java class: ${classInfo.packageName ? `${classInfo.packageName}.` : ''}${classInfo.className}`);
    lines.push('# Executable top-level Jython using implicit variables such as mbo and service');
    lines.push('');
  }
  
  if (options.includeImports) {
    const neededImports = determineNeededImports(classInfo);
    
    if (neededImports.length > 0) {
      for (const imp of neededImports) {
        lines.push(imp);
      }
      lines.push('');
    }
  }
  
  if (classInfo.fields.length > 0 && options.includeComments) {
    lines.push('# Converted class fields retained as script variables');
    for (const field of classInfo.fields) {
      const comment = `  # ${field.type}`;
      if (field.isStatic && field.isFinal) {
        lines.push(`${field.name.toUpperCase()} = None${comment}`);
      } else {
        lines.push(`${field.name} = None${comment}`);
      }
    }
    lines.push('');
  }
  
  if (primaryMethod?.body && primaryMethod.body.trim().length > 0) {
    if (options.includeComments) {
      lines.push(`# Launch point logic converted from ${primaryMethod.name}`);
    }
    
    let methodBody = primaryMethod.body;
    if (options.applyMaximoBestPractices) {
      methodBody = convertIterationPatterns(methodBody);
    }
    
    lines.push(convertJavaBodyToPython(methodBody, ''));
    lines.push('');
  } else if (primaryMethod) {
    lines.push(`# TODO: No method body found for ${primaryMethod.name}`);
    lines.push('pass');
    lines.push('');
  } else {
    lines.push('# TODO: No convertible methods found in source class');
    lines.push('pass');
    lines.push('');
  }
  
  const helperMethods = classInfo.methods.filter(method => method.name !== primaryMethod?.name);
  if (helperMethods.length > 0 && options.includeComments) {
    lines.push('# Additional Java methods omitted from top-level automation script conversion:');
    for (const method of helperMethods) {
      lines.push(`# - ${method.name}`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}


// ============================================================================
// JavaScript Generator
// ============================================================================

/**
 * Generates JavaScript (Nashorn) script from Java class
 */
function generateJavaScriptScript(
  classInfo: JavaClassInfo,
  options: GenerationOptions
): string {
  const lines: string[] = [];
  
  // Add header comment
  if (options.includeComments) {
    lines.push('// ============================================================================');
    lines.push(`// Maximo Automation Script - ${classInfo.className}`);
    lines.push('// Generated from Java class');
    lines.push('// ============================================================================');
    lines.push('');
  }
  
  // Add Maximo imports
  if (options.includeImports && options.applyMaximoBestPractices) {
    lines.push('// Maximo Java imports');
    lines.push('var MboConstants = Java.type("psdi.mbo.MboConstants");');
    lines.push('var MXServer = Java.type("psdi.server.MXServer");');
    lines.push('var HashMap = Java.type("java.util.HashMap");');
    lines.push('');
  }
  
  // Add main script comment
  if (options.includeComments) {
    lines.push('// Main script logic');
    lines.push('// Access implicit variables: mbo, mboSet, service, etc.');
    lines.push('');
  }
  
  // Generate fields as variables
  if (classInfo.fields.length > 0) {
    if (options.includeComments) {
      lines.push('// Class fields converted to variables');
    }
    
    for (const field of classInfo.fields) {
      const comment = options.includeComments ? `  // ${field.type}` : '';
      
      if (field.isStatic && field.isFinal) {
        lines.push(`var ${field.name.toUpperCase()} = null;${comment}`);
      } else {
        lines.push(`var ${field.name} = null;${comment}`);
      }
    }
    
    lines.push('');
  }
  
  // Generate methods as functions
  if (classInfo.methods.length > 0) {
    if (options.includeComments) {
      lines.push('// Class methods converted to functions');
      lines.push('');
    }
    
    for (const method of classInfo.methods) {
      generateJavaScriptMethod(method, lines, options);
      lines.push('');
    }
  }
  
  // Add main execution block
  if (options.applyMaximoBestPractices) {
    lines.push('// Main execution');
    lines.push('// TODO: Implement main script logic here');
    lines.push('// Example: Update MBO attribute');
    lines.push('// mbo.setValue("ATTRIBUTE", "value", MboConstants.NOACCESSCHECK);');
  }
  
  return lines.join('\n');
}

/**
 * Generates a JavaScript function from Java method
 */
function generateJavaScriptMethod(
  method: JavaMethod,
  lines: string[],
  options: GenerationOptions
): void {
  // Generate function signature
  const params = method.parameters.map(p => p.name).join(', ');
  const funcParams = params ? `, ${params}` : '';
  
  if (options.includeComments) {
    lines.push(`/**`);
    lines.push(` * Converted from Java method: ${method.name}`);
    
    if (method.parameters.length > 0) {
      for (const param of method.parameters) {
        lines.push(` * @param {${convertType(param.type, 'javascript')}} ${param.name} - ${param.type}`);
      }
    }
    
    lines.push(` * @returns {${convertType(method.returnType, 'javascript')}}`);
    lines.push(` */`);
  }
  
  lines.push(`function ${method.name}(mbo${funcParams}) {`);
  
  // Add method body
  lines.push(`    // TODO: Implement ${method.name} logic`);
  
  if (method.returnType !== 'void') {
    lines.push(`    return null; // Should return ${convertType(method.returnType, 'javascript')}`);
  }
  
  lines.push(`}`);
}

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generates Maximo automation script from Java class information
 * @param classInfo - Parsed Java class information
 * @param options - Generation options
 * @returns Script generation result
 */
export function generateScript(
  classInfo: JavaClassInfo,
  options: Partial<GenerationOptions> = {}
): ScriptGenerationResult {
  try {
    // Merge with default options
    const fullOptions: GenerationOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    
    const warnings: ConversionWarning[] = [];
    
    // Add warnings for unsupported features
    if (classInfo.isAbstract) {
      warnings.push({
        type: 'warning',
        message: 'Abstract class detected - abstract methods will need manual implementation',
      });
    }
    
    if (classInfo.extends) {
      warnings.push({
        type: 'warning',
        message: `Class extends '${classInfo.extends}' - inheritance is not directly supported in Maximo scripts`,
        suggestion: 'Consider using composition or utility functions instead',
      });
    }
    
    if (classInfo.implements.length > 0) {
      warnings.push({
        type: 'warning',
        message: `Class implements interfaces: ${classInfo.implements.join(', ')}`,
        suggestion: 'Interface methods must be manually implemented',
      });
    }
    
    // Check for getter/setter patterns
    const getterSetterCount = classInfo.methods.filter(m => 
      m.name.startsWith('get') || m.name.startsWith('set') || m.name.startsWith('is')
    ).length;
    
    if (getterSetterCount > 0) {
      warnings.push({
        type: 'info',
        message: `${getterSetterCount} getter/setter methods detected`,
        suggestion: 'Consider using direct attribute access in Maximo scripts: mbo.getString("ATTR")',
      });
    }
    
    // Generate script based on target language
    let source: string;
    if (fullOptions.targetLanguage === 'python') {
      source = generatePythonScript(classInfo, fullOptions);
    } else {
      source = generateJavaScriptScript(classInfo, fullOptions);
    }
    
    // Generate script name and description
    const scriptName = generateScriptName(classInfo.className);
    const description = fullOptions.generateDescription 
      ? generateDescription(classInfo)
      : `Converted from ${classInfo.className}`;
    
    const script: GeneratedScript = {
      scriptName,
      description,
      scriptLanguage: fullOptions.targetLanguage,
      source,
      warnings,
      metadata: {
        originalClassName: classInfo.className,
        generatedAt: new Date().toISOString(),
        conversionNotes: [
          'This script was automatically generated from a Java class',
          'Review and test thoroughly before deploying to production',
          'Adjust Maximo-specific logic as needed (MBO operations, etc.)',
          'Consider Maximo best practices for performance and security',
        ],
      },
    };
    
    return {
      success: true,
      script,
    };
  } catch (error: any) {
    console.error('Error generating script:', error);
    
    return {
      success: false,
      error: `Failed to generate script: ${error.message || 'Unknown error'}`,
    };
  }
}

// Made with Bob
