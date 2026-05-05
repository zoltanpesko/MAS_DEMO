import { NextRequest, NextResponse } from "next/server";

// Cache optimization results for 60 seconds
export const revalidate = 60;

interface OptimizationSuggestion {
  category: 
    | "Performance" 
    | "Code Quality" 
    | "Best Practices" 
    | "Security" 
    | "Error Handling" 
    | "Maintainability"
    | "MBO Operations"
    | "Resource Management"
    | "Transaction Management"
    | "Launch Point Specific";
  priority: "High" | "Medium" | "Low";
  title: string;
  description: string;
  currentCode?: string;
  suggestedCode?: string;
  lineNumber?: number;
  reference?: string;
}

interface OptimizationResponse {
  success: boolean;
  scriptId: string;
  scriptLanguage: string;
  suggestions: OptimizationSuggestion[];
  totalSuggestions: number;
  analyzedAt: string;
  error?: string;
}

/**
 * Analyze JavaScript/Jython script for optimization opportunities
 * Enhanced with official Maximo AutoScript best practices from:
 * https://ibm-maximo-dev.github.io/maximo-autoscript-documentation/
 */
function analyzeJavaScript(source: string): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  const lines = source.split('\n');

  // ============================================================================
  // MBO OPERATIONS - Maximo Business Object specific patterns
  // ============================================================================

  // Rule 1: Check for repeated getString/getValue calls (Enhanced)
  const getStringPattern = /mbo\.getString\(['"](\w+)['"]\)/g;
  const getStringMatches = [...source.matchAll(getStringPattern)];
  
  if (getStringMatches.length > 0) {
    const fieldCounts = new Map<string, number>();
    getStringMatches.forEach(match => {
      const field = match[1];
      fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
    });

    fieldCounts.forEach((count, field) => {
      if (count > 1) {
        suggestions.push({
          category: "MBO Operations",
          priority: "High",
          title: `Minimize MBO getString() calls for '${field}'`,
          description: `Field '${field}' is accessed ${count} times using getString(). Each call involves Java reflection and can impact performance, especially in loops or frequently called scripts. Cache the value in a variable.`,
          currentCode: `// Multiple calls detected:\nmbo.getString('${field}')\n// ... later ...\nmbo.getString('${field}')`,
          suggestedCode: `// Cache the value once:\nvar ${field.toLowerCase()} = mbo.getString('${field}');\n// Use the variable: ${field.toLowerCase()}`,
          reference: "Maximo AutoScript Best Practices - Performance Optimization"
        });
      }
    });
  }

  // Rule 2: Check for other MBO getter methods that should be cached
  const mboGetterPattern = /mbo\.(getDate|getInt|getLong|getDouble|getBoolean)\(['"](\w+)['"]\)/g;
  const getterMatches = [...source.matchAll(mboGetterPattern)];
  
  if (getterMatches.length > 2) {
    const methodFieldMap = new Map<string, Set<string>>();
    getterMatches.forEach(match => {
      const method = match[1];
      const field = match[2];
      const key = `${method}:${field}`;
      if (!methodFieldMap.has(key)) {
        methodFieldMap.set(key, new Set());
      }
      methodFieldMap.get(key)!.add(match[0]);
    });

    methodFieldMap.forEach((calls, key) => {
      if (calls.size > 1) {
        const [method, field] = key.split(':');
        suggestions.push({
          category: "MBO Operations",
          priority: "Medium",
          title: `Cache MBO ${method}() result for '${field}'`,
          description: `Multiple calls to ${method}('${field}') detected. Cache the result to reduce MBO access overhead.`,
          suggestedCode: `var ${field.toLowerCase()}Value = mbo.${method}('${field}');`,
          reference: "Maximo AutoScript Best Practices - MBO Operations"
        });
      }
    });
  }

  // Rule 3: Check for setValue without proper validation
  const setValuePattern = /mbo\.setValue\(['"](\w+)['"],\s*([^)]+)\)/g;
  const setValueMatches = [...source.matchAll(setValuePattern)];
  
  if (setValueMatches.length > 0) {
    const hasValidation = /if\s*\(.*\)/.test(source);
    if (!hasValidation) {
      suggestions.push({
        category: "MBO Operations",
        priority: "Medium",
        title: "Add validation before setValue operations",
        description: "setValue() operations should validate input data to prevent invalid states and improve data integrity.",
        currentCode: "mbo.setValue('STATUS', newStatus);",
        suggestedCode: "if (newStatus != null && newStatus.length() > 0) {\n  mbo.setValue('STATUS', newStatus);\n}",
        reference: "Maximo AutoScript Best Practices - MBO Operations"
      });
    }
  }

  // ============================================================================
  // RESOURCE MANAGEMENT - MboSet cleanup and memory management
  // ============================================================================

  // Rule 4: Check for MboSet without cleanup (Critical!)
  const mboSetPattern = /(?:var\s+)?(\w+)\s*=\s*(?:mbo\.getMboSet|MXServer\.getMXServer\(\)\.getMboSet|service\.getMboSet)\(/g;
  const mboSetMatches = [...source.matchAll(mboSetPattern)];
  
  if (mboSetMatches.length > 0) {
    const hasTryFinally = /try\s*\{[\s\S]*finally\s*\{[\s\S]*\.cleanup\(\)/i.test(source);
    const hasCleanup = /\.cleanup\(\)/i.test(source);
    
    if (!hasCleanup) {
      suggestions.push({
        category: "Resource Management",
        priority: "High",
        title: "Missing MboSet cleanup - Memory leak risk!",
        description: "MboSets created using getMboSet() must be closed with cleanup() in a finally block to prevent memory leaks and Out Of Memory (OOM) errors. The Maximo framework only releases MboSets created as related sets automatically.",
        currentCode: "var woSet = mbo.getMboSet('WORKORDER');\n// ... use woSet ...\n// Missing cleanup!",
        suggestedCode: "var woSet = null;\ntry {\n  woSet = mbo.getMboSet('WORKORDER');\n  // ... use woSet ...\n} finally {\n  if (woSet != null) {\n    woSet.cleanup();\n  }\n}",
        reference: "Maximo AutoScript Best Practices - Closing the MboSet"
      });
    } else if (!hasTryFinally) {
      suggestions.push({
        category: "Resource Management",
        priority: "High",
        title: "MboSet cleanup should be in finally block",
        description: "Always use try-finally to ensure MboSet cleanup happens even if an error occurs. This prevents resource leaks.",
        currentCode: "var woSet = mbo.getMboSet('WORKORDER');\n// ... use woSet ...\nwoSet.cleanup();",
        suggestedCode: "var woSet = null;\ntry {\n  woSet = mbo.getMboSet('WORKORDER');\n  // ... use woSet ...\n} finally {\n  if (woSet != null) {\n    woSet.cleanup();\n  }\n}",
        reference: "Maximo AutoScript Best Practices - Closing the MboSet"
      });
    }
  }

  // Rule 5: Check for repeated MboSet.count() calls
  const countPattern = /(\w+)\.count\(\)/g;
  const countMatches = [...source.matchAll(countPattern)];
  
  if (countMatches.length > 1) {
    const mboSetNames = new Map<string, number>();
    countMatches.forEach(match => {
      const mboSetName = match[1];
      mboSetNames.set(mboSetName, (mboSetNames.get(mboSetName) || 0) + 1);
    });

    mboSetNames.forEach((count, mboSetName) => {
      if (count > 1) {
        suggestions.push({
          category: "Performance",
          priority: "High",
          title: `Cache MboSet.count() result for '${mboSetName}'`,
          description: `Calling ${mboSetName}.count() ${count} times is inefficient. Each count() call fires a SQL query. Store the result in a variable and reuse it.`,
          currentCode: `if (${mboSetName}.count() > 0) {\n  service.log("Count: " + ${mboSetName}.count());\n}`,
          suggestedCode: `var cnt = ${mboSetName}.count();\nif (cnt > 0) {\n  service.log("Count: " + cnt);\n}`,
          reference: "Maximo AutoScript Best Practices - Calling MboSet.count() many times"
        });
      }
    });
  }

  // ============================================================================
  // TRANSACTION MANAGEMENT
  // ============================================================================

  // Rule 6: Check for save() in middle of transaction
  const hasSave = /mbo\.save\(\)/i.test(source);
  const hasGetMXTransaction = /getMXTransaction|getTransaction/i.test(source);
  
  if (hasSave && hasGetMXTransaction) {
    suggestions.push({
      category: "Transaction Management",
      priority: "High",
      title: "Avoid calling save() in middle of transaction",
      description: "When a Maximo transaction is in progress, calling save() can cause issues. MBOs created or updated by a script are automatically part of the encompassing transaction. Let the transaction commit naturally unless you explicitly add the MBO to a new transaction.",
      currentCode: "mbo.getMXTransaction().add(newMbo);\nnewMbo.save(); // Problematic!",
      suggestedCode: "// Remove explicit save() call\nmbo.getMXTransaction().add(newMbo);\n// The transaction will handle the save",
      reference: "Maximo AutoScript Best Practices - Avoid calling save in middle of a transaction"
    });
  }

  // ============================================================================
  // LAUNCH POINT SPECIFIC
  // ============================================================================

  // Rule 7: Check for Object Launch Point Init event usage
  const hasOLPInit = /Object.*Init|OLP.*Init/i.test(source) || source.includes('launchpoint') && source.includes('INIT');
  
  if (hasOLPInit) {
    suggestions.push({
      category: "Launch Point Specific",
      priority: "Medium",
      title: "Consider using Attribute Launch Point instead of OLP Init",
      description: "Object Launch Point (OLP) Init events execute for every MBO initialization, even from List tabs, which can cause performance issues. If you're initializing attribute values, use Attribute Launch Point with 'Initialize Value' event instead - it only fires when the attribute is actually referenced.",
      currentCode: "// OLP Init event\nif (mbo.getString('PRIORITY') == null) {\n  mbo.setValue('PRIORITY', 'Medium');\n}",
      suggestedCode: "// Use Attribute Launch Point for PRIORITY field\n// with 'Initialize Value' event instead",
      reference: "Maximo AutoScript Best Practices - Choosing the right launch point"
    });
  }

  // Rule 8: Check for costly operations in List context
  const hasListCheck = /isFromListTab|UIContext.*isFromListTab/i.test(source);
  
  if (!hasListCheck && (hasSave || /getMboSet|getRelated/i.test(source))) {
    suggestions.push({
      category: "Launch Point Specific",
      priority: "Medium",
      title: "Check context to avoid costly operations in List tab",
      description: "Object Init scripts execute for every MBO in List tabs. Avoid costly operations when invoked from List context to prevent performance degradation.",
      suggestedCode: "from psdi.common.context import UIContext\nif UIContext.getCurrentContext() != null && !UIContext.getCurrentContext().isFromListTab():\n    # Costly initialization here",
      reference: "Maximo AutoScript Best Practices - Avoid costly Object init events"
    });
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  // Rule 9: Check for missing try-catch blocks (Enhanced)
  const hasTryCatch = /try\s*\{/.test(source);
  const hasCriticalCalls = /mbo\.(save|delete|setValue|getMboSet|autoCreate)/i.test(source);
  
  if (hasCriticalCalls && !hasTryCatch) {
    suggestions.push({
      category: "Error Handling",
      priority: "High",
      title: "Add try-catch-finally error handling",
      description: "Critical MBO operations should be wrapped in try-catch-finally blocks to handle errors gracefully and ensure proper resource cleanup.",
      suggestedCode: "var mboSet = null;\ntry {\n  // Your MBO operations here\n  mboSet = mbo.getMboSet('WORKORDER');\n} catch(e) {\n  service.error('Error: ' + e.message);\n  throw e;\n} finally {\n  if (mboSet != null) {\n    mboSet.cleanup();\n  }\n}",
      reference: "Maximo AutoScript Best Practices - Error Handling"
    });
  }

  // Rule 10: Check for missing null checks
  if (/mbo\./.test(source) && !/if\s*\(\s*mbo\s*[!=]=/.test(source)) {
    suggestions.push({
      category: "Error Handling",
      priority: "Medium",
      title: "Add null checks for MBO objects",
      description: "Always check if MBO objects are not null before accessing their methods to prevent NullPointerException errors.",
      suggestedCode: "if (mbo != null && !mbo.isNull()) {\n  // Your MBO operations\n}",
      reference: "Maximo AutoScript Best Practices - Error Handling"
    });
  }

  // ============================================================================
  // BEST PRACTICES - Logging and debugging
  // ============================================================================

  // Rule 11: Check for console.log (should use service.log)
  if (/console\.log/i.test(source)) {
    suggestions.push({
      category: "Best Practices",
      priority: "Medium",
      title: "Use service.log instead of console.log",
      description: "In Maximo scripts, use service.log() for proper logging integration with Maximo's logging framework.",
      currentCode: "console.log('Debug message');",
      suggestedCode: "service.log('Debug message');",
      reference: "Maximo AutoScript Best Practices - Logging"
    });
  }

  // Rule 12: Check if logging level is checked before logging (Enhanced)
  const hasServiceLog = /service\.log\(/i.test(source);
  const hasLoggingCheck = /service\.isLoggingEnabled|isDebugEnabled|logger\.isDebugEnabled/i.test(source);
  
  if (hasServiceLog && !hasLoggingCheck) {
    const logCount = (source.match(/service\.log\(/gi) || []).length;
    if (logCount > 2) {
      suggestions.push({
        category: "Performance",
        priority: "Medium",
        title: "Check logging level before logging",
        description: "When logging is disabled, service.log() still evaluates its arguments (like mboset.count()), which can impact performance. Check if logging is enabled first, especially in loops or frequently called code.",
        currentCode: "service.log('count of mbos: ' + mboset.count());",
        suggestedCode: "if (service.isLoggingEnabled()) {\n  service.log('count of mbos: ' + mboset.count());\n}",
        reference: "Maximo AutoScript Best Practices - Check if logging is enabled"
      });
    }
  }

  // ============================================================================
  // SECURITY
  // ============================================================================

  // Rule 13: Check for SQL injection risks (Enhanced)
  const hasSQLConcatenation = /['"].*\+.*['"]/.test(source) && /where|select|insert|update|delete/i.test(source);
  
  if (hasSQLConcatenation) {
    suggestions.push({
      category: "Security",
      priority: "High",
      title: "Potential SQL injection risk",
      description: "String concatenation in SQL queries can lead to injection vulnerabilities. Use MboSet.setWhere() with proper parameters or parameterized queries instead.",
      currentCode: "var whereClause = \"WONUM = '\" + wonum + \"'\";\nmboSet.setWhere(whereClause);",
      suggestedCode: "// Use parameterized approach\nmboSet.setWhere(\"WONUM = :1\");\nmboSet.setWhereParam(1, wonum);",
      reference: "Maximo AutoScript Best Practices - Security"
    });
  }

  // Rule 14: Check for hardcoded credentials or sensitive data
  const sensitivePatterns = /password|pwd|secret|apikey|api_key|token|credential/i;
  if (sensitivePatterns.test(source) && /['"].*['"]/.test(source)) {
    suggestions.push({
      category: "Security",
      priority: "High",
      title: "Potential hardcoded sensitive data",
      description: "Avoid hardcoding passwords, API keys, or other sensitive data in scripts. Use Maximo properties or encrypted storage instead.",
      suggestedCode: "// Use Maximo properties\nvar apiKey = MXServer.getMXServer().getProperty('custom.apikey');",
      reference: "Maximo AutoScript Best Practices - Security"
    });
  }

  // ============================================================================
  // PERFORMANCE
  // ============================================================================

  // Rule 15: Check for inefficient loops
  lines.forEach((line, index) => {
    if (/for\s*\(.*\.length.*\)/.test(line) && !/var\s+\w+\s*=.*\.length/.test(line)) {
      suggestions.push({
        category: "Performance",
        priority: "Medium",
        title: "Cache array length in loops",
        description: "Accessing .length property in loop condition is inefficient for large arrays. Cache it in a variable.",
        currentCode: "for (var i = 0; i < array.length; i++)",
        suggestedCode: "for (var i = 0, len = array.length; i < len; i++)",
        lineNumber: index + 1,
        reference: "JavaScript Best Practices"
      });
    }

    // Check for MboSet iteration without moveNext()
    if (/while\s*\(.*\.moveNext\(\)/.test(line)) {
      const nextLines = lines.slice(index, index + 5).join('\n');
      if (!/\.getMbo\(\)/.test(nextLines)) {
        suggestions.push({
          category: "MBO Operations",
          priority: "Medium",
          title: "Use getMbo() when iterating MboSet",
          description: "When iterating through an MboSet with moveNext(), always call getMbo() to get the current MBO.",
          currentCode: "while (mboSet.moveNext()) {\n  // Missing getMbo() call\n}",
          suggestedCode: "while (mboSet.moveNext()) {\n  var currentMbo = mboSet.getMbo();\n  // Use currentMbo\n}",
          lineNumber: index + 1,
          reference: "Maximo AutoScript Best Practices - MboSet Operations"
        });
      }
    }
  });

  // Rule 16: Check for Mozilla Compatibility Script usage (Nashorn)
  if (/load\(['"]nashorn:mozilla_compat\.js['"]\)/i.test(source)) {
    suggestions.push({
      category: "Performance",
      priority: "High",
      title: "Avoid Mozilla Compatibility Script for Nashorn",
      description: "Moving from Rhino (Java 7) to Nashorn (Java 8) is recommended for performance. However, using the Mozilla compatibility script with Nashorn results in poor performance. Refactor code to use native Nashorn features instead.",
      currentCode: "load('nashorn:mozilla_compat.js');",
      suggestedCode: "// Remove Mozilla compatibility and use native Nashorn/JavaScript features",
      reference: "Maximo AutoScript Best Practices - Avoid Mozilla Compatibility Script"
    });
  }

  // ============================================================================
  // MAINTAINABILITY
  // ============================================================================

  // Rule 17: Check for hardcoded values
  const hardcodedStrings = source.match(/['"][A-Z_]{3,}['"]/g);
  if (hardcodedStrings && hardcodedStrings.length > 3) {
    suggestions.push({
      category: "Maintainability",
      priority: "Medium",
      title: "Consider using constants for hardcoded values",
      description: "Multiple hardcoded strings detected. Consider defining constants at the top of the script for better maintainability.",
      suggestedCode: "// Define constants at top\nvar STATUS_ACTIVE = 'ACTIVE';\nvar STATUS_INACTIVE = 'INACTIVE';\nvar STATUS_PENDING = 'PENDING';",
      reference: "Code Quality Best Practices"
    });
  }

  // Rule 18: Check for magic numbers
  const magicNumbers = source.match(/\b\d{2,}\b/g);
  if (magicNumbers && magicNumbers.length > 2) {
    suggestions.push({
      category: "Maintainability",
      priority: "Low",
      title: "Replace magic numbers with named constants",
      description: "Magic numbers make code harder to understand and maintain. Use named constants to explain their meaning.",
      currentCode: "if (priority > 5) { ... }",
      suggestedCode: "var MAX_PRIORITY = 5;\nif (priority > MAX_PRIORITY) { ... }",
      reference: "Code Quality Best Practices"
    });
  }

  // ============================================================================
  // CODE QUALITY
  // ============================================================================

  // Rule 19: Check for commented out code
  const commentedCodeLines = lines.filter(line => 
    /^\s*\/\/\s*(var|if|for|while|function|mbo\.|service\.)/.test(line)
  );
  
  if (commentedCodeLines.length > 3) {
    suggestions.push({
      category: "Code Quality",
      priority: "Low",
      title: "Remove commented out code",
      description: `Found ${commentedCodeLines.length} lines of commented code. Remove unused code to improve readability. Use version control for code history.`,
      reference: "Code Quality Best Practices"
    });
  }

  // Rule 20: Check for long functions (code smell)
  const functionMatches = source.match(/function\s+\w+\s*\([^)]*\)\s*\{/g);
  if (functionMatches && functionMatches.length > 0) {
    // Simple heuristic: if script is very long, suggest breaking it up
    if (lines.length > 100) {
      suggestions.push({
        category: "Maintainability",
        priority: "Low",
        title: "Consider breaking up long script",
        description: `Script has ${lines.length} lines. Consider breaking it into smaller, focused functions or using Library Scripts for reusable code.`,
        suggestedCode: "// Create Library Scripts for reusable functions\n// Use service.invokeScript() to call them",
        reference: "Maximo AutoScript Best Practices - Library Scripts"
      });
    }
  }

  return suggestions;
}

/**
 * Analyze Python/Jython script for optimization opportunities
 * Enhanced with official Maximo AutoScript best practices
 */
function analyzePython(source: string): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  const lines = source.split('\n');

  // ============================================================================
  // MBO OPERATIONS
  // ============================================================================

  // Rule 1: Check for repeated mbo.getString calls
  const getStringMatches = [...source.matchAll(/mbo\.getString\(['"](\w+)['"]\)/g)];
  
  if (getStringMatches.length > 0) {
    const fieldCounts = new Map<string, number>();
    getStringMatches.forEach(match => {
      const field = match[1];
      fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
    });

    fieldCounts.forEach((count, field) => {
      if (count > 1) {
        suggestions.push({
          category: "MBO Operations",
          priority: "High",
          title: `Cache MBO getString() result for '${field}'`,
          description: `Field '${field}' is accessed ${count} times. Each getString() call has overhead. Cache the value in a variable.`,
          currentCode: `# Multiple calls:\nmbo.getString('${field}')\n# ... later ...\nmbo.getString('${field}')`,
          suggestedCode: `# Cache once:\n${field.toLowerCase()} = mbo.getString('${field}')\n# Use variable: ${field.toLowerCase()}`,
          reference: "Maximo AutoScript Best Practices - Performance"
        });
      }
    });
  }

  // ============================================================================
  // RESOURCE MANAGEMENT
  // ============================================================================

  // Rule 2: Check for MboSet without cleanup
  const mboSetPattern = /(\w+)\s*=\s*(?:mbo\.getMboSet|service\.getMboSet)\(/g;
  const mboSetMatches = [...source.matchAll(mboSetPattern)];
  
  if (mboSetMatches.length > 0) {
    const hasTryFinally = /try:[\s\S]*finally:[\s\S]*\.cleanup\(\)/i.test(source);
    const hasCleanup = /\.cleanup\(\)/i.test(source);
    
    if (!hasCleanup) {
      suggestions.push({
        category: "Resource Management",
        priority: "High",
        title: "Missing MboSet cleanup - Memory leak risk!",
        description: "MboSets must be closed with cleanup() in a finally block to prevent memory leaks and OOM errors.",
        currentCode: "wo_set = mbo.getMboSet('WORKORDER')\n# ... use wo_set ...\n# Missing cleanup!",
        suggestedCode: "wo_set = None\ntry:\n    wo_set = mbo.getMboSet('WORKORDER')\n    # ... use wo_set ...\nfinally:\n    if wo_set is not None:\n        wo_set.cleanup()",
        reference: "Maximo AutoScript Best Practices - Closing the MboSet"
      });
    } else if (!hasTryFinally) {
      suggestions.push({
        category: "Resource Management",
        priority: "High",
        title: "MboSet cleanup should be in finally block",
        description: "Use try-finally to ensure cleanup happens even if errors occur.",
        suggestedCode: "wo_set = None\ntry:\n    wo_set = mbo.getMboSet('WORKORDER')\n    # ... use wo_set ...\nfinally:\n    if wo_set is not None:\n        wo_set.cleanup()",
        reference: "Maximo AutoScript Best Practices - Resource Management"
      });
    }
  }

  // Rule 3: Check for repeated count() calls
  const countMatches = [...source.matchAll(/(\w+)\.count\(\)/g)];
  
  if (countMatches.length > 1) {
    const mboSetNames = new Map<string, number>();
    countMatches.forEach(match => {
      const mboSetName = match[1];
      mboSetNames.set(mboSetName, (mboSetNames.get(mboSetName) || 0) + 1);
    });

    mboSetNames.forEach((count, mboSetName) => {
      if (count > 1) {
        suggestions.push({
          category: "Performance",
          priority: "High",
          title: `Cache MboSet.count() for '${mboSetName}'`,
          description: `Calling count() ${count} times fires multiple SQL queries. Cache the result.`,
          currentCode: `if ${mboSetName}.count() > 0:\n    service.log("Count: " + str(${mboSetName}.count()))`,
          suggestedCode: `cnt = ${mboSetName}.count()\nif cnt > 0:\n    service.log("Count: " + str(cnt))`,
          reference: "Maximo AutoScript Best Practices - Performance"
        });
      }
    });
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  // Rule 4: Check for missing try-except blocks
  const hasTryExcept = /try\s*:/.test(source);
  const hasCriticalCalls = /mbo\.(save|delete|setValue|getMboSet)/i.test(source);
  
  if (hasCriticalCalls && !hasTryExcept) {
    suggestions.push({
      category: "Error Handling",
      priority: "High",
      title: "Add try-except-finally error handling",
      description: "Critical MBO operations should be wrapped in try-except-finally blocks for proper error handling and resource cleanup.",
      suggestedCode: "mbo_set = None\ntry:\n    # Your MBO operations here\n    mbo_set = mbo.getMboSet('WORKORDER')\nexcept Exception as e:\n    service.error('Error: ' + str(e))\n    raise\nfinally:\n    if mbo_set is not None:\n        mbo_set.cleanup()",
      reference: "Maximo AutoScript Best Practices - Error Handling"
    });
  }

  // Rule 5: Check for missing None checks
  if (/mbo\./.test(source) && !/if\s+mbo\s+is\s+not\s+None/.test(source)) {
    suggestions.push({
      category: "Error Handling",
      priority: "Medium",
      title: "Add None checks for MBO objects",
      description: "Always check if MBO objects are not None before accessing their methods.",
      suggestedCode: "if mbo is not None:\n    # Your MBO operations",
      reference: "Maximo AutoScript Best Practices - Error Handling"
    });
  }

  // ============================================================================
  // BEST PRACTICES
  // ============================================================================

  // Rule 6: Check for print statements (should use service.log)
  if (/print\s*\(/.test(source)) {
    suggestions.push({
      category: "Best Practices",
      priority: "Medium",
      title: "Use service.log instead of print",
      description: "In Maximo scripts, use service.log() for proper logging integration.",
      currentCode: "print('Debug message')",
      suggestedCode: "service.log('Debug message')",
      reference: "Maximo AutoScript Best Practices - Logging"
    });
  }

  // Rule 7: Check logging level before logging
  const hasServiceLog = /service\.log\(/i.test(source);
  const hasLoggingCheck = /service\.isLoggingEnabled|isDebugEnabled/i.test(source);
  
  if (hasServiceLog && !hasLoggingCheck) {
    const logCount = (source.match(/service\.log\(/gi) || []).length;
    if (logCount > 2) {
      suggestions.push({
        category: "Performance",
        priority: "Medium",
        title: "Check logging level before logging",
        description: "Check if logging is enabled before expensive log operations to improve performance.",
        currentCode: "service.log('count: ' + str(mbo_set.count()))",
        suggestedCode: "if service.isLoggingEnabled():\n    service.log('count: ' + str(mbo_set.count()))",
        reference: "Maximo AutoScript Best Practices - Logging"
      });
    }
  }

  // ============================================================================
  // PERFORMANCE
  // ============================================================================

  // Rule 8: Check for inefficient string concatenation
  if (/\+\s*['"]/.test(source) && source.split('+').length > 3) {
    suggestions.push({
      category: "Performance",
      priority: "Medium",
      title: "Use string formatting instead of concatenation",
      description: "Multiple string concatenations are inefficient. Use format() or f-strings (Python 3.6+).",
      currentCode: "'Value: ' + str(value) + ' Status: ' + status",
      suggestedCode: "'Value: {} Status: {}'.format(value, status)\n# Or use f-string: f'Value: {value} Status: {status}'",
      reference: "Python Best Practices"
    });
  }

  // Rule 9: Check for list comprehension opportunities
  lines.forEach((line, index) => {
    if (/for\s+\w+\s+in\s+.*:\s*$/.test(line.trim())) {
      const nextLine = lines[index + 1];
      if (nextLine && /^\s+.*\.append\(/.test(nextLine)) {
        suggestions.push({
          category: "Code Quality",
          priority: "Low",
          title: "Consider using list comprehension",
          description: "Simple append loops can be replaced with more readable list comprehensions.",
          currentCode: "result = []\nfor item in items:\n    result.append(item.value)",
          suggestedCode: "result = [item.value for item in items]",
          lineNumber: index + 1,
          reference: "Python Best Practices"
        });
      }
    }
  });

  // ============================================================================
  // SECURITY
  // ============================================================================

  // Rule 10: Check for SQL injection risks
  if (/['"].*\+.*['"]/.test(source) && /where|select|insert|update|delete/i.test(source)) {
    suggestions.push({
      category: "Security",
      priority: "High",
      title: "Potential SQL injection risk",
      description: "String concatenation in SQL can lead to injection vulnerabilities. Use parameterized queries.",
      currentCode: "where_clause = \"WONUM = '\" + wonum + \"'\"",
      suggestedCode: "# Use parameterized approach\nmbo_set.setWhere(\"WONUM = :1\")\nmbo_set.setWhereParam(1, wonum)",
      reference: "Maximo AutoScript Best Practices - Security"
    });
  }

  // ============================================================================
  // MAINTAINABILITY
  // ============================================================================

  // Rule 11: Check for hardcoded values
  const hardcodedStrings = source.match(/['"][A-Z_]{3,}['"]/g);
  if (hardcodedStrings && hardcodedStrings.length > 3) {
    suggestions.push({
      category: "Maintainability",
      priority: "Medium",
      title: "Use constants for hardcoded values",
      description: "Define constants at the top of the script for better maintainability.",
      suggestedCode: "# Define constants\nSTATUS_ACTIVE = 'ACTIVE'\nSTATUS_INACTIVE = 'INACTIVE'\nSTATUS_PENDING = 'PENDING'",
      reference: "Code Quality Best Practices"
    });
  }

  // Rule 12: Check for long scripts
  if (lines.length > 100) {
    suggestions.push({
      category: "Maintainability",
      priority: "Low",
      title: "Consider breaking up long script",
      description: `Script has ${lines.length} lines. Consider using Library Scripts for reusable code.`,
      suggestedCode: "# Create Library Scripts for reusable functions\n# Use service.invokeScript() to call them",
      reference: "Maximo AutoScript Best Practices - Library Scripts"
    });
  }

  return suggestions;
}

/**
 * Main script analysis function
 * Routes to language-specific analyzers
 */
function analyzeScript(source: string, scriptLanguage: string): OptimizationSuggestion[] {
  if (!source || source.trim().length === 0) {
    return [{
      category: "Code Quality",
      priority: "High",
      title: "Empty script",
      description: "Script appears to be empty. Add implementation code.",
      reference: "Maximo AutoScript Documentation"
    }];
  }

  const language = scriptLanguage?.toLowerCase() || "";
  
  if (language.includes("python") || language.includes("jython")) {
    return analyzePython(source);
  } else {
    // Default to JavaScript analysis for JavaScript, Nashorn, or unknown languages
    return analyzeJavaScript(source);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Set timeout for the request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 30000);
    });

    const processRequest = async () => {
      const body = await request.json();
      const { script } = body;

      // Validate input
      if (!script) {
        return NextResponse.json(
          { success: false, error: "Script object is required" },
          { status: 400 }
        );
      }

      if (!script.autoscript) {
        return NextResponse.json(
          { success: false, error: "Script ID is required" },
          { status: 400 }
        );
      }

      if (!script.source) {
        return NextResponse.json(
          { success: false, error: "Script source code is required" },
          { status: 400 }
        );
      }

      // Analyze the script
      const suggestions = analyzeScript(
        script.source,
        script.scriptlanguage || "javascript"
      );

      const response: OptimizationResponse = {
        success: true,
        scriptId: script.autoscript,
        scriptLanguage: script.scriptlanguage || "javascript",
        suggestions,
        totalSuggestions: suggestions.length,
        analyzedAt: new Date().toISOString(),
      };

      return NextResponse.json(response);
    };

    // Race between request processing and timeout
    const result = await Promise.race([processRequest(), timeoutPromise]);
    return result as NextResponse;

  } catch (error: any) {
    console.error("Error analyzing script:", error);
    
    if (error.message === "Request timeout") {
      return NextResponse.json(
        {
          success: false,
          error: "Request timeout - script analysis took too long",
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to analyze script",
      },
      { status: 500 }
    );
  }
}

// Enhanced with official Maximo AutoScript best practices from:
// https://ibm-maximo-dev.github.io/maximo-autoscript-documentation/

// Made with Bob
