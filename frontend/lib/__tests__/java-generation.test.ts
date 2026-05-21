// ============================================================================
// Java Generation Test - Simple validation test
// ============================================================================

import { parseJavaClass } from '../java-parser';
import { generateScript } from '../script-generator';

// Simple test Java class
const SIMPLE_JAVA_CLASS = `
public class AssetValidator {
    private String assetType;
    private int maxValue;
    
    public AssetValidator(String assetType) {
        this.assetType = assetType;
    }
    
    public boolean validate(String assetNum) {
        return assetNum != null && !assetNum.isEmpty();
    }
    
    public String getAssetType() {
        return assetType;
    }
    
    public void setAssetType(String assetType) {
        this.assetType = assetType;
    }
}
`;

/**
 * Simple test to verify the Java parser and script generator work
 */
function testJavaGeneration() {
  console.log('='.repeat(80));
  console.log('Testing Java to Maximo Script Generation');
  console.log('='.repeat(80));
  console.log();
  
  // Test 1: Parse Java class
  console.log('Test 1: Parsing Java class...');
  const parseResult = parseJavaClass(SIMPLE_JAVA_CLASS);
  
  if (!parseResult.success) {
    console.error('❌ FAILED: Could not parse Java class');
    console.error('Error:', parseResult.error);
    return false;
  }
  
  console.log('✅ PASSED: Java class parsed successfully');
  console.log('Class name:', parseResult.classInfo?.className);
  console.log('Methods:', parseResult.classInfo?.methods.length);
  console.log('Fields:', parseResult.classInfo?.fields.length);
  console.log();
  
  // Test 2: Generate Python script
  console.log('Test 2: Generating Python script...');
  const pythonResult = generateScript(parseResult.classInfo!, {
    targetLanguage: 'python',
    includeComments: true,
  });
  
  if (!pythonResult.success) {
    console.error('❌ FAILED: Could not generate Python script');
    console.error('Error:', pythonResult.error);
    return false;
  }
  
  console.log('✅ PASSED: Python script generated successfully');
  console.log('Script name:', pythonResult.script?.scriptName);
  console.log('Language:', pythonResult.script?.scriptLanguage);
  console.log('Warnings:', pythonResult.script?.warnings.length);
  console.log();
  console.log('Generated Python Script:');
  console.log('-'.repeat(80));
  console.log(pythonResult.script?.source);
  console.log('-'.repeat(80));
  console.log();
  
  // Test 3: Generate JavaScript script
  console.log('Test 3: Generating JavaScript script...');
  const jsResult = generateScript(parseResult.classInfo!, {
    targetLanguage: 'javascript',
    includeComments: true,
  });
  
  if (!jsResult.success) {
    console.error('❌ FAILED: Could not generate JavaScript script');
    console.error('Error:', jsResult.error);
    return false;
  }
  
  console.log('✅ PASSED: JavaScript script generated successfully');
  console.log('Script name:', jsResult.script?.scriptName);
  console.log('Language:', jsResult.script?.scriptLanguage);
  console.log('Warnings:', jsResult.script?.warnings.length);
  console.log();
  console.log('Generated JavaScript Script:');
  console.log('-'.repeat(80));
  console.log(jsResult.script?.source);
  console.log('-'.repeat(80));
  console.log();
  
  // Test 4: Display warnings
  if (pythonResult.script?.warnings && pythonResult.script.warnings.length > 0) {
    console.log('Conversion Warnings:');
    pythonResult.script.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. [${warning.type.toUpperCase()}] ${warning.message}`);
      if (warning.suggestion) {
        console.log(`   Suggestion: ${warning.suggestion}`);
      }
    });
    console.log();
  }
  
  console.log('='.repeat(80));
  console.log('✅ All tests passed!');
  console.log('='.repeat(80));
  
  return true;
}

// Run the test if this file is executed directly
if (require.main === module) {
  const success = testJavaGeneration();
  process.exit(success ? 0 : 1);
}

export { testJavaGeneration };

// Made with Bob
