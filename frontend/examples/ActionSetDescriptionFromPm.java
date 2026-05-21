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

// Made with Bob
