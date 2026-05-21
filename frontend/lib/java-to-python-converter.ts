// ============================================================================
// Java to Python Syntax Converter
// Converts Java code syntax to Python/Jython syntax
// Based on patterns from ScriptingWithMaximo.pdf
// ============================================================================

/**
 * Converts Java method body to Python syntax
 */
export function convertJavaBodyToPython(javaBody: string, baseIndent = '    '): string {
  if (!javaBody || javaBody.trim().length === 0) {
    return `${baseIndent}pass`;
  }

  const lines = javaBody.split('\n');
  let indentLevel = 0;
  const convertedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line.length === 0) {
      if (convertedLines.length > 0 && convertedLines[convertedLines.length - 1].trim().length > 0) {
        convertedLines.push('');
      }
      continue;
    }

    if (line === '}' || line.startsWith('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    line = convertJavaLineToPython(line);

    if (line.trim().length === 0) {
      continue;
    }

    const pythonIndent = baseIndent + '    '.repeat(indentLevel);
    convertedLines.push(pythonIndent + line);

    if (line.endsWith(':')) {
      indentLevel++;
    }
  }

  while (convertedLines.length > 0 && convertedLines[convertedLines.length - 1].trim() === '') {
    convertedLines.pop();
  }

  return convertedLines.join('\n');
}

/**
 * Converts a single Java line to Python syntax
 */
function convertJavaLineToPython(line: string): string {
  if (line.startsWith('//')) {
    return '#' + line.substring(2);
  }

  if (line.startsWith('/*')) {
    return '# ' + line.substring(2).replace('*/', '').trim();
  }

  if (line.startsWith('*') && !line.startsWith('*/')) {
    return '# ' + line.substring(1).trim();
  }

  if (line.includes('*/')) {
    return '# ' + line.replace('*/', '').trim();
  }

  line = line.replace(/^\s*try\s*\{\s*$/, '# try block removed - Maximo scripts typically execute at top level');
  line = line.replace(/^\s*catch\s*\([^)]+\)\s*\{\s*$/, 'except Exception, e:');
  line = line.replace(/^\s*finally\s*\{\s*$/, 'finally:');
  line = line.replace(/^\s*super\.\w+\s*\([^)]*\)\s*;?\s*$/, '');

  line = convertVariableDeclarations(line);
  line = convertNullChecks(line);
  line = convertIfStatements(line);
  line = convertForLoops(line);
  line = convertWhileLoops(line);
  line = convertPrintStatements(line);
  line = convertStringMethods(line);
  line = convertBooleanOperators(line);
  line = convertMaximoApiPatterns(line);
  line = convertThrowsAndReturns(line);

  line = line.replace(/;\s*$/, '');

  if (line.trim() === '}') {
    return '';
  }

  if (!line.endsWith(':')) {
    line = line.replace(/\s*\{\s*$/, '');
  }

  return line.trimEnd();
}

/**
 * Converts Java variable declarations to Python
 */
function convertVariableDeclarations(line: string): string {
  const declarationPattern = /^\s*(?:final\s+)?(?:[\w.<>[\]]+)\s+(\w+)\s*=\s*(.+)$/;
  const declarationOnlyPattern = /^\s*(?:final\s+)?(?:[\w.<>[\]]+)\s+(\w+)\s*$/;

  const declarationMatch = line.match(declarationPattern);
  if (declarationMatch) {
    return `${declarationMatch[1]} = ${declarationMatch[2]}`;
  }

  const declarationOnlyMatch = line.match(declarationOnlyPattern);
  if (declarationOnlyMatch) {
    return `${declarationOnlyMatch[1]} = None`;
  }

  return line;
}

/**
 * Converts Java null checks to Python
 */
function convertNullChecks(line: string): string {
  // != null -> is not None
  line = line.replace(/\s*!=\s*null\b/g, ' is not None');
  
  // == null -> is None
  line = line.replace(/\s*==\s*null\b/g, ' is None');
  
  return line;
}

/**
 * Converts Java if statements to Python
 */
function convertIfStatements(line: string): string {
  const elseIfMatch = line.match(/^else\s+if\s*\((.+)\)\s*\{?\s*$/);
  if (elseIfMatch) {
    return `elif ${elseIfMatch[1]}:`;
  }

  const ifMatch = line.match(/^if\s*\((.+)\)\s*\{?\s*$/);
  if (ifMatch) {
    return `if ${ifMatch[1]}:`;
  }

  if (line.match(/^else\s*\{?\s*$/)) {
    return 'else:';
  }

  return line;
}

/**
 * Converts Java for loops to Python
 */
function convertForLoops(line: string): string {
  const enhancedForMatch = line.match(/^for\s*\(\s*[\w.<>[\]]+\s+(\w+)\s*:\s*(.+)\)\s*\{?\s*$/);
  if (enhancedForMatch) {
    return `for ${enhancedForMatch[1]} in ${enhancedForMatch[2]}:`;
  }

  const traditionalForMatch = line.match(/^for\s*\((.+)\)\s*\{?\s*$/);
  if (traditionalForMatch) {
    return `# TODO: Convert Java for-loop manually: for (${traditionalForMatch[1]})`;
  }

  return line;
}

/**
 * Converts Java while loops to Python
 */
function convertWhileLoops(line: string): string {
  const whileMatch = line.match(/^while\s*\((.+)\)\s*\{?\s*$/);
  if (whileMatch) {
    return `while ${whileMatch[1]}:`;
  }

  return line;
}

/**
 * Converts Java print statements to Python
 */
function convertPrintStatements(line: string): string {
  // System.out.println(...) -> print(...)
  line = line.replace(/System\.out\.println\s*\(/g, 'print(');
  
  // System.out.print(...) -> print(..., end='')
  line = line.replace(/System\.out\.print\s*\(/g, 'print(');
  
  return line;
}

/**
 * Converts Java string methods to Python
 */
function convertStringMethods(line: string): string {
  line = line.replace(/\.substring\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/g, '[$1:$2]');
  line = line.replace(/\.substring\s*\(\s*(\d+)\s*\)/g, '[$1:]');
  line = line.replace(/(\w+)\.length\s*\(\s*\)/g, 'len($1)');
  line = line.replace(/(\w+)\.toUpperCase\s*\(\s*\)/g, '$1.upper()');
  line = line.replace(/(\w+)\.toLowerCase\s*\(\s*\)/g, '$1.lower()');
  line = line.replace(/(\w+)\.trim\s*\(\s*\)/g, '$1.strip()');
  line = line.replace(/(\w+)\.equalsIgnoreCase\s*\(\s*("([^"]*)"|'([^']*)')\s*\)/g, (_match, variable, _quotedLiteral, doubleQuoted, singleQuoted) => {
    const value = (doubleQuoted ?? singleQuoted ?? '').toUpperCase();
    return `${variable}.upper() == "${value}"`;
  });
  line = line.replace(/(\w+)\.equalsIgnoreCase\s*\(\s*([^)]+)\)/g, '$1.upper() == str($2).upper()');
  line = line.replace(/(\w+)\.equals\s*\(\s*([^)]+)\)/g, '$1 == $2');

  return line;
}

/**
 * Converts Java boolean operators to Python
 */
function convertBooleanOperators(line: string): string {
  line = line.replace(/\s*&&\s*/g, ' and ');
  line = line.replace(/\s*\|\|\s*/g, ' or ');
  line = line.replace(/!\s*([a-zA-Z_(])/g, 'not $1');

  return line;
}

function convertMaximoApiPatterns(line: string): string {
  line = line.replace(/\bthis\./g, '');
  line = line.replace(/\bnull\b/g, 'None');
  line = line.replace(/\btrue\b/g, 'True');
  line = line.replace(/\bfalse\b/g, 'False');

  const mxAppExMatch = line.match(/throw\s+new\s+MXApplicationException\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"(?:\s*,\s*(.+))?\s*\)/);
  if (mxAppExMatch) {
    const errorgroup = mxAppExMatch[1];
    const errorkey = mxAppExMatch[2];
    const params = mxAppExMatch[3];
    return params
      ? `service.error("${errorgroup}", "${errorkey}", ${params})`
      : `service.error("${errorgroup}", "${errorkey}")`;
  }

  const mxExceptionMatch = line.match(/throw\s+new\s+MXException\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"(?:\s*,\s*(.+))?\s*\)/);
  if (mxExceptionMatch) {
    const errorgroup = mxExceptionMatch[1];
    const errorkey = mxExceptionMatch[2];
    const params = mxExceptionMatch[3];
    return params
      ? `service.error("${errorgroup}", "${errorkey}", ${params})`
      : `service.error("${errorgroup}", "${errorkey}")`;
  }

  line = line.replace(/raise\s+Exception\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"(?:\s*,\s*([^)]+))?\s*\)/g,
    (_match, group, key, params) => params
      ? `service.error("${group}", "${key}", ${params})`
      : `service.error("${group}", "${key}")`);

  line = line.replace(/(\w+)\.setFieldFlag\s*\(\s*"([^"]+)"\s*,\s*MboConstants\.READONLY\s*,\s*(true|false|True|False)\s*\)/g,
    (_match, _obj, field, value) => {
      const pyValue = value.toLowerCase() === 'true' ? 'True' : 'False';
      return `${field}_readonly = ${pyValue}`;
    });

  line = line.replace(/(\w+)\.setFieldFlag\s*\(\s*"([^"]+)"\s*,\s*MboConstants\.REQUIRED\s*,\s*(true|false|True|False)\s*\)/g,
    (_match, _obj, field, value) => {
      const pyValue = value.toLowerCase() === 'true' ? 'True' : 'False';
      return `${field}_required = ${pyValue}`;
    });

  line = line.replace(/(\w+)\.setFieldFlag\s*\(\s*"([^"]+)"\s*,\s*MboConstants\.HIDDEN\s*,\s*(true|false|True|False)\s*\)/g,
    (_match, _obj, field, value) => {
      const pyValue = value.toLowerCase() === 'true' ? 'True' : 'False';
      return `${field}_hidden = ${pyValue}`;
    });

  line = line.replace(/\.isEmpty\s*\(\s*\)/g, '.__len__() == 0');

  line = line.replace(/\(\s*(MboSetRemote|MboRemote|MboSet|Mbo|String|Integer|Long|Double|Float|Boolean|Object)\s*\)\s*/g, '');

  return line;
}

/**
 * Converts return/throw statements for top-level Jython compatibility
 */
function convertThrowsAndReturns(line: string): string {
  if (line.trim() === 'return') {
    return '# return';
  }

  const returnMatch = line.match(/^return\s+(.+)$/);
  if (returnMatch) {
    return `result = ${returnMatch[1]}`;
  }

  return line;
}

/**
 * Converts Java method call to Python
 */
export function convertMethodCall(methodCall: string): string {
  let converted = methodCall;
  converted = convertMaximoApiPatterns(converted);
  converted = converted.replace(/\(\s*\w+\s*\)\s*/g, '');

  return converted;
}

/**
 * Extracts and converts comments from Java code
 */
export function extractComments(javaCode: string): string[] {
  const comments: string[] = [];
  const lines = javaCode.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Single-line comment
    if (trimmed.startsWith('//')) {
      comments.push('#' + trimmed.substring(2));
    }
    
    // Multi-line comment or JavaDoc
    if (trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      const cleaned = trimmed
        .replace(/^\/\*+/, '')
        .replace(/\*+\/$/, '')
        .replace(/^\*/, '')
        .trim();
      
      if (cleaned) {
        comments.push('# ' + cleaned);
      }
    }
  }
  
  return comments;
}
/**
 * Generates common Jython imports for Maximo scripting
 * Based on patterns from ScriptingWithMaximo.pdf (page 16)
 */
export function generateJythonImports(javaCode: string): string[] {
  const imports: string[] = [];
  
  // Check if code uses MBO-related classes
  if (javaCode.includes('MboRemote') || javaCode.includes('Mbo')) {
    imports.push('from psdi.mbo import MboRemote');
  }
  
  if (javaCode.includes('MboSetRemote') || javaCode.includes('MboSet')) {
    imports.push('from psdi.mbo import MboSetRemote');
  }
  
  if (javaCode.includes('MboConstants')) {
    imports.push('from psdi.mbo import MboConstants');
  }
  
  // Check for exception handling
  if (javaCode.includes('MXApplicationException')) {
    imports.push('from psdi.util import MXApplicationException');
  }
  
  if (javaCode.includes('MXException')) {
    imports.push('from psdi.util import MXException');
  }
  
  // Check for server access
  if (javaCode.includes('MXServer')) {
    imports.push('from psdi.server import MXServer');
  }
  
  return imports;
}

/**
 * Generates documentation for implicit variables available in Maximo scripts
 * Based on ScriptingWithMaximo.pdf (pages 5-6)
 */
export function generateImplicitVariablesDoc(): string {
  return `# Implicit Variables Available in Maximo Scripts:
# - mbo: Current MBO in context (psdi.mbo.Mbo)
# - mboname: Name of the current MBO (String)
# - app: Name of the Maximo application (String)
# - user: Name of the logged-in user (String)
# - errorkey: Error key for MXException (String)
# - errorgroup: Error group for MXException (String)
# - params: Parameters array for error messages (Array)
# - evalresult: Boolean result for condition launch points (Boolean)
#
# For bound variables, additional implicit variables are available:
# - <varname>_readonly: Set field as readonly (Boolean)
# - <varname>_required: Set field as required (Boolean)
# - <varname>_hidden: Set field as hidden (Boolean)
# - <varname>_previous: Previous value before modification (varies)
# - <varname>_internal: Internal value for synonym domains (varies)
`;
}

/**
 * Adds type conversion hints for Maximo script variables
 * Based on ScriptingWithMaximo.pdf (page 14)
 */
export function addTypeConversionHints(line: string): string {
  // Add hints for common type conversions needed in Jython
  if (line.includes('sum(') && !line.includes('float(')) {
    line = line.replace(/sum\((\w+)\)/g, 'sum(float(x) for x in $1 if x is not None)');
  }
  
  return line;
}

/**
 * Converts Java iteration patterns to Python patterns
 * Based on ScriptingWithMaximo.pdf (page 15-16)
 */
export function convertIterationPatterns(javaCode: string): string {
  let converted = javaCode;
  
  // Convert MboSet iteration pattern from PDF example (page 15)
  // while(mbo != null) { ... mbo = mboSet.getMbo(++i); }
  const whileIterPattern = /while\s*\(\s*(\w+)\s*!=\s*null\s*\)\s*\{([^}]+)(\w+)\s*=\s*(\w+)\.getMbo\s*\(\s*\+\+(\w+)\s*\)\s*;?\s*\}/gs;
  converted = converted.replace(whileIterPattern, (_match, mboVar, body, _assignVar, setVar, _indexVar) => {
    return `# Iterate over MboSet using Python pattern
for ${mboVar} in ${setVar}:
${body.trim()}`;
  });
  
  return converted;
}

// Made with Bob