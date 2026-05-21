// ============================================================================
// Java Parser - Extracts class information from Java source code
// ============================================================================

import { parse } from 'java-parser';
import type {
  JavaClassInfo,
  JavaMethod,
  JavaField,
  JavaParameter,
  JavaParseResult,
  ConversionWarning,
} from './types/java-generation';

// ============================================================================
// Constants
// ============================================================================

const MAX_JAVA_SOURCE_SIZE = 1048576; // 1MB limit

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates Java source code size
 */
function validateSourceSize(source: string): { valid: boolean; error?: string } {
  const sizeInBytes = new Blob([source]).size;
  
  if (sizeInBytes > MAX_JAVA_SOURCE_SIZE) {
    return {
      valid: false,
      error: `Java source is too large (${(sizeInBytes / 1024).toFixed(2)}KB, max ${MAX_JAVA_SOURCE_SIZE / 1024}KB)`,
    };
  }
  
  return { valid: true };
}

/**
 * Extracts modifiers from a declaration node
 */
function extractModifiers(node: any): string[] {
  if (!node.modifiers) return [];
  
  return node.modifiers.map((mod: any) => {
    if (typeof mod === 'string') return mod;
    if (mod.children?.Annotation) return '@' + extractAnnotationName(mod);
    return mod.name || '';
  }).filter(Boolean);
}

/**
 * Extracts annotation name from annotation node
 */
function extractAnnotationName(annotationNode: any): string {
  try {
    if (annotationNode.children?.typeName) {
      const typeName = annotationNode.children.typeName[0];
      if (typeName.children?.Identifier) {
        return typeName.children.Identifier.map((id: any) => id.image).join('.');
      }
    }
    return 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Extracts annotations from modifiers
 */
function extractAnnotations(modifiers: string[]): string[] {
  return modifiers.filter(mod => mod.startsWith('@'));
}

/**
 * Checks if modifiers contain a specific keyword
 */
function hasModifier(modifiers: string[], keyword: string): boolean {
  return modifiers.some(mod => mod.toLowerCase() === keyword.toLowerCase());
}

/**
 * Extracts type from type node
 */
function extractType(typeNode: any): string {
  try {
    if (!typeNode) return 'void';
    
    // Handle primitive types
    if (typeNode.children?.primitiveType) {
      const primitiveType = typeNode.children.primitiveType[0];
      if (primitiveType.children) {
        const typeKey = Object.keys(primitiveType.children)[0];
        return typeKey || 'unknown';
      }
    }
    
    // Handle reference types
    if (typeNode.children?.classOrInterfaceType) {
      const classType = typeNode.children.classOrInterfaceType[0];
      if (classType.children?.Identifier) {
        return classType.children.Identifier.map((id: any) => id.image).join('.');
      }
    }
    
    // Handle array types
    if (typeNode.children?.dims) {
      const baseType = extractType({ children: typeNode.children });
      const dims = typeNode.children.dims.length || 1;
      return baseType + '[]'.repeat(dims);
    }
    
    return 'Object';
  } catch (error) {
    return 'Object';
  }
}

/**
 * Extracts method parameters
 */
function extractParameters(formalParameterList: any): JavaParameter[] {
  try {
    if (!formalParameterList || !formalParameterList.children?.formalParameter) {
      return [];
    }
    
    return formalParameterList.children.formalParameter.map((param: any) => {
      const paramDecl = param.children?.variableParaRegularParameter?.[0];
      if (!paramDecl) return null;
      
      const type = extractType(paramDecl.children?.unannType?.[0]);
      const name = paramDecl.children?.variableDeclaratorId?.[0]?.children?.Identifier?.[0]?.image || 'param';
      const modifiers = extractModifiers(paramDecl);
      const annotations = extractAnnotations(modifiers);
      
      return {
        name,
        type,
        annotations,
      };
    }).filter(Boolean);
  } catch (error) {
    return [];
  }
}

/**
 * Extracts the raw source code for a method body
 */
function extractMethodBody(methodDecl: any, javaSource: string): string | undefined {
  try {
    const methodBody = methodDecl.children?.methodBody?.[0];
    if (!methodBody || !methodBody.children?.block) return undefined;
    
    const block = methodBody.children.block[0];
    if (!block.location) return undefined;
    
    // Get the location of the opening and closing braces
    const startOffset = block.location.startOffset;
    const endOffset = block.location.endOffset;
    
    if (startOffset !== undefined && endOffset !== undefined) {
      // Extract the body including braces, then remove them
      const bodyWithBraces = javaSource.substring(startOffset, endOffset + 1);
      // Remove outer braces and trim
      const body = bodyWithBraces.substring(1, bodyWithBraces.length - 1).trim();
      return body;
    }
    
    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Extracts methods from class body
 */
function extractMethods(classBody: any, javaSource: string): JavaMethod[] {
  try {
    if (!classBody || !classBody.children?.classBodyDeclaration) {
      return [];
    }
    
    const methods: JavaMethod[] = [];
    
    for (const decl of classBody.children.classBodyDeclaration) {
      const methodDecl = decl.children?.classMemberDeclaration?.[0]?.children?.methodDeclaration?.[0];
      if (!methodDecl) continue;
      
      const modifiers = extractModifiers(decl.children?.modifier || []);
      const annotations = extractAnnotations(modifiers);
      
      const methodHeader = methodDecl.children?.methodHeader?.[0];
      if (!methodHeader) continue;
      
      const returnType = extractType(methodHeader.children?.result?.[0]?.children?.unannType?.[0]);
      const name = methodHeader.children?.methodDeclarator?.[0]?.children?.Identifier?.[0]?.image || 'unknown';
      const parameters = extractParameters(
        methodHeader.children?.methodDeclarator?.[0]?.children?.formalParameterList?.[0]
      );
      
      // Extract method body
      const body = extractMethodBody(methodDecl, javaSource);
      
      methods.push({
        name,
        returnType,
        parameters,
        modifiers: modifiers.filter(m => !m.startsWith('@')),
        annotations,
        body,
        isConstructor: false,
        isStatic: hasModifier(modifiers, 'static'),
        isPublic: hasModifier(modifiers, 'public'),
        isPrivate: hasModifier(modifiers, 'private'),
        isProtected: hasModifier(modifiers, 'protected'),
      });
    }
    
    return methods;
  } catch (error) {
    console.error('Error extracting methods:', error);
    return [];
  }
}

/**
 * Extracts fields from class body
 */
function extractFields(classBody: any): JavaField[] {
  try {
    if (!classBody || !classBody.children?.classBodyDeclaration) {
      return [];
    }
    
    const fields: JavaField[] = [];
    
    for (const decl of classBody.children.classBodyDeclaration) {
      const fieldDecl = decl.children?.classMemberDeclaration?.[0]?.children?.fieldDeclaration?.[0];
      if (!fieldDecl) continue;
      
      const modifiers = extractModifiers(decl.children?.modifier || []);
      const annotations = extractAnnotations(modifiers);
      
      const type = extractType(fieldDecl.children?.unannType?.[0]);
      const variableDeclarators = fieldDecl.children?.variableDeclaratorList?.[0]?.children?.variableDeclarator || [];
      
      for (const varDecl of variableDeclarators) {
        const name = varDecl.children?.variableDeclaratorId?.[0]?.children?.Identifier?.[0]?.image || 'unknown';
        
        fields.push({
          name,
          type,
          modifiers: modifiers.filter(m => !m.startsWith('@')),
          annotations,
          isStatic: hasModifier(modifiers, 'static'),
          isFinal: hasModifier(modifiers, 'final'),
          isPublic: hasModifier(modifiers, 'public'),
          isPrivate: hasModifier(modifiers, 'private'),
          isProtected: hasModifier(modifiers, 'protected'),
        });
      }
    }
    
    return fields;
  } catch (error) {
    console.error('Error extracting fields:', error);
    return [];
  }
}

/**
 * Extracts constructors from class body
 */
function extractConstructors(classBody: any, className: string): JavaMethod[] {
  try {
    if (!classBody || !classBody.children?.classBodyDeclaration) {
      return [];
    }
    
    const constructors: JavaMethod[] = [];
    
    for (const decl of classBody.children.classBodyDeclaration) {
      const constructorDecl = decl.children?.classMemberDeclaration?.[0]?.children?.constructorDeclaration?.[0];
      if (!constructorDecl) continue;
      
      const modifiers = extractModifiers(decl.children?.modifier || []);
      const annotations = extractAnnotations(modifiers);
      
      const constructorDeclarator = constructorDecl.children?.constructorDeclarator?.[0];
      const parameters = extractParameters(constructorDeclarator?.children?.formalParameterList?.[0]);
      
      constructors.push({
        name: className,
        returnType: className,
        parameters,
        modifiers: modifiers.filter(m => !m.startsWith('@')),
        annotations,
        isConstructor: true,
        isStatic: false,
        isPublic: hasModifier(modifiers, 'public'),
        isPrivate: hasModifier(modifiers, 'private'),
        isProtected: hasModifier(modifiers, 'protected'),
      });
    }
    
    return constructors;
  } catch (error) {
    console.error('Error extracting constructors:', error);
    return [];
  }
}

/**
 * Extracts imports from compilation unit
 */
function extractImports(cst: any): string[] {
  try {
    const imports: string[] = [];
    const importDeclarations = cst.children?.importDeclaration || [];
    
    for (const importDecl of importDeclarations) {
      const packageOrTypeName = importDecl.children?.packageOrTypeName?.[0];
      if (packageOrTypeName?.children?.Identifier) {
        const importPath = packageOrTypeName.children.Identifier.map((id: any) => id.image).join('.');
        imports.push(importPath);
      }
    }
    
    return imports;
  } catch (error) {
    return [];
  }
}

/**
 * Extracts package name from compilation unit
 */
function extractPackageName(cst: any): string | undefined {
  try {
    const packageDecl = cst.children?.packageDeclaration?.[0];
    if (packageDecl?.children?.Identifier) {
      return packageDecl.children.Identifier.map((id: any) => id.image).join('.');
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
}

// ============================================================================
// Main Parser Function
// ============================================================================

/**
 * Parses Java source code and extracts class information
 * @param javaSource - Java source code as string
 * @returns Parse result with class information or error
 */
export function parseJavaClass(javaSource: string): JavaParseResult {
  const warnings: ConversionWarning[] = [];
  
  try {
    // Validate source size
    const sizeValidation = validateSourceSize(javaSource);
    if (!sizeValidation.valid) {
      return {
        success: false,
        error: sizeValidation.error,
      };
    }
    
    // Validate source is not empty
    if (!javaSource || javaSource.trim().length === 0) {
      return {
        success: false,
        error: 'Java source code is empty',
      };
    }
    
    // Parse Java source code
    const cst = parse(javaSource);
    
    if (!cst || !cst.children) {
      return {
        success: false,
        error: 'Failed to parse Java source code - invalid syntax',
      };
    }
    
    // Extract package and imports
    const packageName = extractPackageName(cst);
    const imports = extractImports(cst);
    
    // Find class declaration
    const typeDeclarations = cst.children.typeDeclaration || [];
    let classDeclaration = null;
    
    for (const typeDecl of typeDeclarations) {
      const typeDeclNode = typeDecl as any;
      
      // Try multiple paths to find the class declaration
      classDeclaration = typeDeclNode.children?.classDeclaration?.[0] ||
                        typeDeclNode.children?.normalClassDeclaration?.[0];
      
      // If not found directly, check nested structure
      if (!classDeclaration && typeDeclNode.children?.classOrInterfaceDeclaration) {
        const classOrInterface = typeDeclNode.children.classOrInterfaceDeclaration[0];
        classDeclaration = classOrInterface?.children?.classDeclaration?.[0] ||
                          classOrInterface?.children?.normalClassDeclaration?.[0];
      }
      
      if (classDeclaration) break;
    }
    
    // If still not found, try alternative structure
    if (!classDeclaration && cst.children.ordinaryCompilationUnit) {
      const ordinaryUnit = cst.children.ordinaryCompilationUnit[0] as any;
      const typeDeclsAlt = ordinaryUnit?.children?.typeDeclaration || [];
      
      for (const typeDecl of typeDeclsAlt) {
        const typeDeclNode = typeDecl as any;
        classDeclaration = typeDeclNode.children?.classDeclaration?.[0] ||
                          typeDeclNode.children?.normalClassDeclaration?.[0];
        
        if (!classDeclaration && typeDeclNode.children?.classOrInterfaceDeclaration) {
          const classOrInterface = typeDeclNode.children.classOrInterfaceDeclaration[0];
          classDeclaration = classOrInterface?.children?.classDeclaration?.[0] ||
                            classOrInterface?.children?.normalClassDeclaration?.[0];
        }
        
        if (classDeclaration) break;
      }
    }
    
    if (!classDeclaration) {
      return {
        success: false,
        error: 'No class declaration found in Java source',
      };
    }
    
    // Extract class information
    // The classDeclaration might contain normalClassDeclaration
    let actualClassDecl = classDeclaration;
    if (classDeclaration.children?.normalClassDeclaration) {
      actualClassDecl = classDeclaration.children.normalClassDeclaration[0];
    }
    
    const className = actualClassDecl.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image ||
                     actualClassDecl.children?.Identifier?.[0]?.image ||
                     'UnknownClass';
    
    const modifiers = extractModifiers(actualClassDecl.children?.classModifier || []);
    const annotations = extractAnnotations(modifiers);
    
    const classBody = actualClassDecl.children?.classBody?.[0];
    const methods = extractMethods(classBody, javaSource);
    const fields = extractFields(classBody);
    const constructors = extractConstructors(classBody, className);
    
    // Extract extends and implements
    const extendsClause = classDeclaration.children?.superclass?.[0]?.children?.classType?.[0];
    const extendsClass = extendsClause?.children?.Identifier?.[0]?.image;
    
    const implementsClause = classDeclaration.children?.superinterfaces?.[0]?.children?.interfaceTypeList?.[0];
    const implementsList: string[] = [];
    if (implementsClause?.children?.interfaceType) {
      for (const interfaceType of implementsClause.children.interfaceType) {
        const interfaceName = interfaceType.children?.classType?.[0]?.children?.Identifier?.[0]?.image;
        if (interfaceName) implementsList.push(interfaceName);
      }
    }
    
    // Add warnings for complex features
    if (constructors.length > 1) {
      warnings.push({
        type: 'info',
        message: 'Multiple constructors detected - only the default constructor will be converted',
      });
    }
    
    if (extendsClass) {
      warnings.push({
        type: 'warning',
        message: `Class extends '${extendsClass}' - inheritance may need manual adjustment in Maximo scripts`,
      });
    }
    
    if (implementsList.length > 0) {
      warnings.push({
        type: 'warning',
        message: `Class implements interfaces: ${implementsList.join(', ')} - interface methods may need manual implementation`,
      });
    }
    
    const classInfo: JavaClassInfo = {
      className,
      packageName,
      imports,
      extends: extendsClass,
      implements: implementsList,
      modifiers: modifiers.filter(m => !m.startsWith('@')),
      annotations,
      fields,
      methods,
      constructors,
      isInterface: false, // TODO: Add interface detection
      isAbstract: hasModifier(modifiers, 'abstract'),
      isPublic: hasModifier(modifiers, 'public'),
    };
    
    return {
      success: true,
      classInfo,
      warnings,
    };
  } catch (error: any) {
    console.error('Error parsing Java class:', error);
    
    return {
      success: false,
      error: `Failed to parse Java source: ${error.message || 'Unknown error'}`,
    };
  }
}

// Made with Bob
