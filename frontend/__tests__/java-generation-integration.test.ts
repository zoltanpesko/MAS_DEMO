/**
 * Integration tests for Java-to-Script generation feature
 * 
 * These tests verify the complete workflow from Java parsing to script generation.
 * Run with: npm test (if Jest is configured)
 */

import { parseJavaClass } from '../lib/java-parser';
import { generateScript } from '../lib/script-generator';

describe('Java Generation Integration Tests', () => {
  describe('Simple Java Class Parsing', () => {
    const simpleJavaClass = `
public class AssetValidator {
    private String assetNum;
    
    public String getAssetNum() {
        return assetNum;
    }
    
    public void setAssetNum(String assetNum) {
        this.assetNum = assetNum;
    }
    
    public boolean validateAsset() {
        return assetNum != null && !assetNum.isEmpty();
    }
}`;

    test('should successfully parse simple Java class', () => {
      const result = parseJavaClass(simpleJavaClass);
      
      expect(result.success).toBe(true);
      expect(result.classInfo).toBeDefined();
      expect(result.classInfo?.className).toBe('AssetValidator');
      expect(result.classInfo?.fields).toHaveLength(1);
      expect(result.classInfo?.methods).toHaveLength(3);
    });

    test('should generate Python script from simple class', () => {
      const parseResult = parseJavaClass(simpleJavaClass);
      expect(parseResult.success).toBe(true);
      
      const genResult = generateScript(parseResult.classInfo!, {
        targetLanguage: 'python',
        includeComments: true,
      });
      
      expect(genResult.success).toBe(true);
      expect(genResult.script).toBeDefined();
      expect(genResult.script?.scriptName).toBe('ASSET_VALIDATOR');
      expect(genResult.script?.scriptLanguage).toBe('python');
      expect(genResult.script?.source).toContain('def getAssetNum');
      expect(genResult.script?.source).toContain('def setAssetNum');
      expect(genResult.script?.source).toContain('def validateAsset');
    });

    test('should generate JavaScript script from simple class', () => {
      const parseResult = parseJavaClass(simpleJavaClass);
      expect(parseResult.success).toBe(true);
      
      const genResult = generateScript(parseResult.classInfo!, {
        targetLanguage: 'javascript',
        includeComments: true,
      });
      
      expect(genResult.success).toBe(true);
      expect(genResult.script).toBeDefined();
      expect(genResult.script?.scriptLanguage).toBe('javascript');
      expect(genResult.script?.source).toContain('function getAssetNum');
      expect(genResult.script?.source).toContain('function setAssetNum');
      expect(genResult.script?.source).toContain('function validateAsset');
    });
  });

  describe('Complex Java Class with Package and Imports', () => {
    const complexJavaClass = `
package com.example.maximo;

import java.util.Date;
import psdi.mbo.MboRemote;

public class WorkOrderHelper {
    private String woNum;
    private Date createdDate;
    
    public WorkOrderHelper(String woNum) {
        this.woNum = woNum;
    }
    
    public String getWoNum() {
        return woNum;
    }
    
    public void setCreatedDate(Date date) {
        this.createdDate = date;
    }
}`;

    test('should parse class with package and imports', () => {
      const result = parseJavaClass(complexJavaClass);
      
      expect(result.success).toBe(true);
      expect(result.classInfo?.className).toBe('WorkOrderHelper');
      expect(result.classInfo?.packageName).toBe('com.example.maximo');
      expect(result.classInfo?.imports).toContain('java.util.Date');
      expect(result.classInfo?.imports).toContain('psdi.mbo.MboRemote');
      expect(result.classInfo?.constructors).toHaveLength(1);
    });

    test('should generate script with metadata', () => {
      const parseResult = parseJavaClass(complexJavaClass);
      const genResult = generateScript(parseResult.classInfo!);
      
      expect(genResult.success).toBe(true);
      expect(genResult.script?.metadata.originalClassName).toBe('WorkOrderHelper');
      expect(genResult.script?.metadata.generatedAt).toBeDefined();
      expect(genResult.script?.metadata.conversionNotes).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    test('should handle empty Java source', () => {
      const result = parseJavaClass('');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    test('should handle invalid Java syntax', () => {
      const invalidJava = 'this is not valid java code';
      const result = parseJavaClass(invalidJava);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle Java without class declaration', () => {
      const noClass = `
public void someMethod() {
    System.out.println("Hello");
}`;
      const result = parseJavaClass(noClass);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No class declaration');
    });
  });

  describe('Generation Options', () => {
    const testClass = `
public class TestClass {
    private int value;
    
    public int getValue() {
        return value;
    }
}`;

    test('should respect includeComments option', () => {
      const parseResult = parseJavaClass(testClass);
      
      const withComments = generateScript(parseResult.classInfo!, {
        includeComments: true,
      });
      const withoutComments = generateScript(parseResult.classInfo!, {
        includeComments: false,
      });
      
      expect(withComments.script?.source).toContain('#');
      expect(withoutComments.script?.source.split('#').length).toBeLessThan(
        withComments.script?.source.split('#').length
      );
    });

    test('should respect includeImports option', () => {
      const parseResult = parseJavaClass(testClass);
      
      const withImports = generateScript(parseResult.classInfo!, {
        includeImports: true,
        applyMaximoBestPractices: true,
      });
      const withoutImports = generateScript(parseResult.classInfo!, {
        includeImports: false,
      });
      
      expect(withImports.script?.source).toContain('import');
      expect(withoutImports.script?.source).not.toContain('import');
    });
  });

  describe('Warnings Generation', () => {
    test('should generate warnings for inheritance', () => {
      const inheritanceClass = `
public class MyClass extends BaseClass {
    public void method() {}
}`;
      
      const parseResult = parseJavaClass(inheritanceClass);
      const genResult = generateScript(parseResult.classInfo!);
      
      expect(genResult.script?.warnings).toBeDefined();
      const hasInheritanceWarning = genResult.script?.warnings.some(
        w => w.message.includes('extends')
      );
      expect(hasInheritanceWarning).toBe(true);
    });

    test('should generate info for getter/setter methods', () => {
      const getterSetterClass = `
public class DataClass {
    private String name;
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
}`;
      
      const parseResult = parseJavaClass(getterSetterClass);
      const genResult = generateScript(parseResult.classInfo!);
      
      const hasGetterSetterInfo = genResult.script?.warnings.some(
        w => w.message.includes('getter/setter')
      );
      expect(hasGetterSetterInfo).toBe(true);
    });
  });

  describe('API Endpoint Simulation', () => {
    test('should simulate successful API request/response', async () => {
      const request = {
        javaSource: `
public class TestClass {
    public void test() {}
}`,
        options: {
          targetLanguage: 'python' as const,
          includeComments: true,
        },
      };
      
      // Simulate API processing
      const parseResult = parseJavaClass(request.javaSource);
      expect(parseResult.success).toBe(true);
      
      const genResult = generateScript(parseResult.classInfo!, request.options);
      expect(genResult.success).toBe(true);
      
      // Simulate API response
      const response = {
        success: true,
        data: genResult.script,
        message: `Script generated successfully from ${parseResult.classInfo?.className}`,
      };
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.message).toContain('TestClass');
    });

    test('should simulate error response for invalid input', () => {
      const request = {
        javaSource: '',
        options: {
          targetLanguage: 'python' as const,
        },
      };
      
      const parseResult = parseJavaClass(request.javaSource);
      expect(parseResult.success).toBe(false);
      
      const response = {
        success: false,
        error: parseResult.error,
        errorCode: 'PARSE_ERROR',
      };
      
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.errorCode).toBe('PARSE_ERROR');
    });
  });

  describe('Script Name Generation', () => {
    test('should convert camelCase to UPPER_SNAKE_CASE', () => {
      const testCases = [
        { input: 'AssetValidator', expected: 'ASSET_VALIDATOR' },
        { input: 'WorkOrderHelper', expected: 'WORK_ORDER_HELPER' },
        { input: 'PMScheduler', expected: 'P_M_SCHEDULER' },
      ];
      
      testCases.forEach(({ input, expected }) => {
        const javaClass = `public class ${input} {}`;
        const parseResult = parseJavaClass(javaClass);
        const genResult = generateScript(parseResult.classInfo!);
        
        expect(genResult.script?.scriptName).toBe(expected);
      });
    });
  });
});

// Export for use in other test files
export { parseJavaClass, generateScript };

// Made with Bob
