// ============================================================================
// Java to Python Conversion Test
// Tests the actual conversion of Java code to Python
// ============================================================================

import { parseJavaClass } from '../java-parser';
import { generateScript } from '../script-generator';

describe('Java to Python Conversion', () => {
  it('should convert ActionSetDescriptionFromPm Java class to Python', () => {
    const javaSource = `
package cust.psdi.app.workorder;

import java.rmi.RemoteException;
import psdi.common.action.ActionCustomClass;
import psdi.mbo.MboConstants;
import psdi.mbo.MboRemote;
import psdi.mbo.MboSetRemote;
import psdi.util.MXException;

public class ActionSetDescriptionFromPm implements ActionCustomClass
{
  public void applyCustomAction(MboRemote mbo, Object[] params) throws MXException, RemoteException
  {
    String desc = "";
    
    MboSetRemote jp = mbo.getMboSet("WO_JOBPLAN");
    if (jp.getMbo(0)!=null)
    {
      desc = desc + jp.getMbo(0).getString("DESCRIPTION");
    }
    
    MboSetRemote pm = mbo.getMboSet("WO_PM");
    if (pm.getMbo(0)!=null)
    {
      MboSetRemote locations = pm.getMbo(0).getMboSet("LOCATIONS");
      if (locations.getMbo(0)!=null)
      {
        desc = desc + " - " + locations.getMbo(0).getString("DESCRIPTION");
      }
      
      MboSetRemote asset = pm.getMbo(0).getMboSet("ASSET");
      if (asset.getMbo(0)!=null)
      {
        desc = desc + " - " + asset.getMbo(0).getString("DESCRIPTION");
      }
    }
    
    desc = desc.substring(0, 100);
    System.out.println("Setting WO's " + mbo.getString("WONUM") + " description:" + desc);
    mbo.setValue("DESCRIPTION", desc, MboConstants.NOACCESSCHECK|MboConstants.NOVALIDATION_AND_NOACTION);
  }
}
`;

    // Parse the Java class
    const parseResult = parseJavaClass(javaSource);
    
    expect(parseResult.success).toBe(true);
    expect(parseResult.classInfo).toBeDefined();
    
    if (!parseResult.classInfo) {
      throw new Error('Failed to parse Java class');
    }
    
    // Check that method body was extracted
    expect(parseResult.classInfo.methods.length).toBe(1);
    expect(parseResult.classInfo.methods[0].name).toBe('applyCustomAction');
    expect(parseResult.classInfo.methods[0].body).toBeDefined();
    expect(parseResult.classInfo.methods[0].body).toContain('String desc = ""');
    
    // Generate Python script
    const generateResult = generateScript(parseResult.classInfo, {
      targetLanguage: 'python',
      includeComments: true,
      includeImports: true,
      applyMaximoBestPractices: true,
    });
    
    expect(generateResult.success).toBe(true);
    expect(generateResult.script).toBeDefined();
    
    if (!generateResult.script) {
      throw new Error('Failed to generate script');
    }
    
    const pythonCode = generateResult.script.source;
    
    // Check that Python code contains Maximo automation script conversions
    expect(pythonCode).toContain('# Maximo Automation Script');
    expect(pythonCode).not.toContain('def applyCustomAction(mbo, params):');
    expect(pythonCode).toContain('desc = ""');
    expect(pythonCode).toContain('jp = mbo.getMboSet("WO_JOBPLAN")');
    expect(pythonCode).toContain('if jp.getMbo(0) is not None:');
    expect(pythonCode).toContain('desc = desc + jp.getMbo(0).getString("DESCRIPTION")');
    expect(pythonCode).toContain('print(');
    expect(pythonCode).toContain('desc[:100]');
    expect(pythonCode).toContain('mbo.setValue("DESCRIPTION", desc, MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION)');
    
    // Check imports
    expect(pythonCode).toContain('from psdi.mbo import MboConstants');
    
    // Check that it doesn't contain broken Java-style or invalid patterns
    expect(pythonCode).not.toContain('String desc');
    expect(pythonCode).not.toContain('!= null');
    expect(pythonCode).not.toContain('System.out.println');
    expect(pythonCode).not.toContain('.substring(');
    expect(pythonCode).not.toContain('str(mbo.');
    expect(pythonCode).not.toContain('DESCRIPTION = desc');
    
    // Print the generated code for manual inspection
    console.log('\n=== Generated Python Code ===\n');
    console.log(pythonCode);
    console.log('\n=== End of Generated Code ===\n');
  });
});

// Made with Bob
