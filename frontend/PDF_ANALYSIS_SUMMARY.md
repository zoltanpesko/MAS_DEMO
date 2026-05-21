# ScriptingWithMaximo.pdf Analysis Summary

## Document Overview
- **Source**: ScriptingWithMaximo.pdf (32 pages)
- **Authors**: Anamitra Bhattacharyya (Lead Developer), Sampath Sriramadhesikan (Lead Designer)
- **Purpose**: Guide for Maximo 7.5+ scripting framework using JSR 223 compliant engines

## Key Findings and Patterns Extracted

### 1. Implicit Variables (Pages 5-6)
The PDF documents critical implicit variables that Maximo provides automatically to scripts:

**Always Available:**
- `mbo` - Current MBO in context (psdi.mbo.Mbo)
- `mboname` - Name of current MBO (String)
- `app` - Application name that initiated script (String)
- `user` - Logged-in user name (String)
- `errorkey` - Error key for MXException (String)
- `errorgroup` - Error group for MXException (String)
- `params` - Parameters array for error messages (Array)
- `evalresult` - Boolean result for condition launch points (Boolean)

**For Bound Variables:**
- `<varname>_readonly` - Set field as readonly (Boolean)
- `<varname>_required` - Set field as required (Boolean)
- `<varname>_hidden` - Set field as hidden (Boolean)
- `<varname>_previous` - Previous value before modification
- `<varname>_internal` - Internal value for synonym domains

### 2. Error Handling Pattern (Pages 16-17)
Instead of throwing exceptions directly, Maximo scripts use error flags:

**Java Pattern:**
```java
throw new MXApplicationException("asset", "invalidassetprefix", params);
```

**Jython Pattern:**
```python
errorgroup = "asset"
errorkey = "invalidassetprefix"
params = [prefix, assettype]
```

**Important Note:** Error flags are NOT real-time. The script continues executing after setting error flags, and the exception is thrown only after script completion.

### 3. MBO API Patterns (Pages 15-16)

**setFieldFlag Pattern:**
```java
mbo.setFieldFlag("vendor", MboConstants.READONLY, true);
```

**Jython Equivalent (using implicit variables):**
```python
vendor_readonly = True
```

**setValue with Flags:**
```java
mbo.setValue("sparepartqty", totalQty, MboConstants.NOACCESSCHECK);
```

**Jython Pattern:**
```python
# Set with NOACCESSCHECK flag
sparepartqty = totalQty
```

### 4. Type Conversions (Page 14)
Common type conversions needed in Jython:

```python
# String conversion
str(value)

# Numeric conversions
float(value)
int(value)

# Array operations with None checks
sum(float(x) for x in array if x is not None)
```

### 5. MboSet Iteration Pattern (Page 15)

**Java Pattern:**
```java
MboSetRemote sparepartSet = mbo.getMboSet("sparepart");
int i = 0;
MboRemote sparepartMbo = sparepartSet.getMbo(i);
double totalQty = 0;
while(sparepartMbo != null) {
    totalQty += sparepartMbo.getDouble("quantity");
    sparepartMbo = sparepartSet.getMbo(++i);
}
```

**Jython Pattern:**
```python
# Iterate over MboSet using Python pattern
for sparepartMbo in sparepartSet:
    totalQty += float(sparepartMbo.quantity)
```

### 6. Array Variables (Pages 9-10)
Array variables use `*` notation in bindings:

```python
# Binding: sparepart.quantity*
# Usage in script:
if qtys is not None:
    sptqt = sum(qtys)
```

### 7. Common Jython Imports (Page 16)
```python
from psdi.mbo import MboRemote
from psdi.mbo import MboSetRemote
from psdi.mbo import MboConstants
from psdi.util import MXApplicationException
from psdi.util import MXException
from psdi.server import MXServer
```

### 8. Launch Point Types (Pages 11-30)

**Object Launch Point:**
- Events: init, add, update, delete
- Use for: initialization logic, save point validations

**Attribute Launch Point:**
- Events: field modification
- Use for: field validation, calculated fields, conditional logic

**Action Launch Point:**
- Use for: workflow actions, escalations, UI buttons/menus
- Can be object-specific or generic

**Condition Launch Point:**
- Use for: workflow conditions, conditional UI
- Must set `evalresult` boolean variable

### 9. Best Practices from PDF

1. **Use Implicit Variables**: Prefer implicit variables over explicit MBO API calls
2. **Error Handling**: Use errorgroup/errorkey pattern, not direct exceptions
3. **Type Safety**: Always use appropriate type conversions (float, str, int)
4. **None Checks**: Always check for None before operations
5. **Iteration**: Use Python for-loops instead of while loops with getMbo()
6. **Field Flags**: Use implicit _readonly, _required, _hidden variables
7. **Array Variables**: Use * notation for relationship-based arrays

## Changes Made to Converter

### 1. Enhanced `convertMaximoApiPatterns()` function
- Added MXApplicationException to errorgroup/errorkey conversion
- Added setFieldFlag to implicit variable conversion
- Added setValue with flags pattern recognition
- Added getValue method conversions (getString, getDouble, getInt, getBoolean)
- Improved MBO API pattern recognition

### 2. New Helper Functions Added

**`generateJythonImports(javaCode: string)`**
- Automatically detects needed imports from Java code
- Returns array of Jython import statements

**`generateImplicitVariablesDoc()`**
- Returns comprehensive documentation of implicit variables
- Based on PDF pages 5-6

**`addTypeConversionHints(line: string)`**
- Adds proper type conversion for common patterns
- Handles None checks in sum() operations

**`convertIterationPatterns(javaCode: string)`**
- Converts Java while-loop MboSet iteration to Python for-loops
- Based on PDF page 15-16 examples

### 3. Updated `script-generator.ts`
- Integrated new helper functions
- Enhanced import detection using `generateJythonImports()`
- Added implicit variables documentation to generated scripts
- Applied iteration pattern conversions when `applyMaximoBestPractices` is enabled

## Testing Recommendations

1. Test error handling conversion with MXApplicationException
2. Test setFieldFlag to implicit variable conversion
3. Test MboSet iteration pattern conversion
4. Test array variable handling with * notation
5. Test type conversion hints for sum() operations
6. Verify implicit variables documentation in generated scripts

## Example Conversions

### Example 1: Field Validation (from PDF page 16-17)

**Java:**
```java
if (purchaseprice > 200) {
    throw new MXApplicationException("something", "else");
} else {
    if (purchaseprice >= 100) {
        mbo.setFieldFlag("vendor", MboConstants.REQUIRED, true);
    } else {
        mbo.setFieldFlag("vendor", MboConstants.REQUIRED, false);
    }
    mbo.setValue("replacementcost", purchaseprice/2);
}
```

**Converted Jython:**
```python
if purchaseprice > 200:
    errorgroup = "something"
    errorkey = "else"
else:
    if purchaseprice >= 100:
        vendor_required = True
    else:
        vendor_required = False
    replacementcost = purchaseprice/2
```

### Example 2: Calculated Field (from PDF page 14)

**Java:**
```java
MboSetRemote sparepartSet = mbo.getMboSet("sparepart");
int i = 0;
MboRemote sparepartMbo = sparepartSet.getMbo(i);
double totalQty = 0;
while(sparepartMbo != null) {
    totalQty += sparepartMbo.getDouble("quantity");
    sparepartMbo = sparepartSet.getMbo(++i);
}
mbo.setValue("sparepartqty", totalQty, MboConstants.NOACCESSCHECK);
mbo.setFieldFlag("sparepartqty", MboConstants.READONLY, true);
```

**Converted Jython:**
```python
# Using array variable binding: sparepart.quantity*
sparepartqty_readonly = True
if qtys is not None:
    sparepartqty = sum(qtys)
```

## References
- ScriptingWithMaximo.pdf - Complete 32-page guide
- IBM Maximo 7.5+ Scripting Framework
- JSR 223 Specification
- Jython 2.x Documentation

## Conclusion

The PDF provided invaluable insights into Maximo's scripting framework, particularly:
- The power of implicit variables to simplify code
- Proper error handling patterns
- MBO API best practices
- Type conversion requirements
- Iteration patterns

All these patterns have been integrated into the converter to produce more idiomatic and efficient Jython scripts that follow Maximo best practices.