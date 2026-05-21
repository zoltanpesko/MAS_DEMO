# Sample Java Classes for Testing Script Generation

This document contains example Java classes that you can use to test the Java-to-Maximo script generation feature.

## How to Use These Examples

1. Navigate to the Scripts page at http://localhost:3000/scripts
2. Click "Create New Script"
3. Click "Generate from Java"
4. Copy one of the examples below and paste it into the Java source code textarea
5. Select your target language (Python or JavaScript)
6. Configure generation options as needed
7. Click "Generate Script"

---

## Example 1: Simple Asset Validator (Basic)

**Complexity:** ⭐ Basic  
**Use Case:** Simple validation logic with getters/setters

```java
public class AssetValidator {
    private String assetNum;
    private String status;
    
    public String getAssetNum() {
        return assetNum;
    }
    
    public void setAssetNum(String assetNum) {
        this.assetNum = assetNum;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public boolean validateAsset() {
        return assetNum != null && !assetNum.isEmpty();
    }
    
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }
}
```

---

## Example 2: Work Order Calculator (Medium)

**Complexity:** ⭐⭐ Medium  
**Use Case:** Business logic with calculations and multiple methods

```java
public class WorkOrderCalculator {
    private double laborCost;
    private double materialCost;
    private double taxRate;
    
    public WorkOrderCalculator() {
        this.taxRate = 0.08;
    }
    
    public void setLaborCost(double laborCost) {
        this.laborCost = laborCost;
    }
    
    public void setMaterialCost(double materialCost) {
        this.materialCost = materialCost;
    }
    
    public void setTaxRate(double taxRate) {
        this.taxRate = taxRate;
    }
    
    public double calculateSubtotal() {
        return laborCost + materialCost;
    }
    
    public double calculateTax() {
        return calculateSubtotal() * taxRate;
    }
    
    public double calculateTotal() {
        return calculateSubtotal() + calculateTax();
    }
    
    public String getFormattedTotal() {
        return String.format("$%.2f", calculateTotal());
    }
}
```

---

## Example 3: Asset Status Manager (Medium-Advanced)

**Complexity:** ⭐⭐⭐ Medium-Advanced  
**Use Case:** State management with validation and business rules

```java
public class AssetStatusManager {
    private String currentStatus;
    private String previousStatus;
    private boolean maintenanceRequired;
    
    public AssetStatusManager(String initialStatus) {
        this.currentStatus = initialStatus;
        this.previousStatus = null;
        this.maintenanceRequired = false;
    }
    
    public boolean canTransitionTo(String newStatus) {
        if (currentStatus == null || newStatus == null) {
            return false;
        }
        
        // Define valid transitions
        if ("ACTIVE".equals(currentStatus)) {
            return "INACTIVE".equals(newStatus) || "MAINTENANCE".equals(newStatus);
        } else if ("INACTIVE".equals(currentStatus)) {
            return "ACTIVE".equals(newStatus) || "DECOMMISSIONED".equals(newStatus);
        } else if ("MAINTENANCE".equals(currentStatus)) {
            return "ACTIVE".equals(newStatus) || "INACTIVE".equals(newStatus);
        }
        
        return false;
    }
    
    public void updateStatus(String newStatus) {
        if (canTransitionTo(newStatus)) {
            this.previousStatus = this.currentStatus;
            this.currentStatus = newStatus;
            
            if ("MAINTENANCE".equals(newStatus)) {
                this.maintenanceRequired = true;
            } else if ("ACTIVE".equals(newStatus)) {
                this.maintenanceRequired = false;
            }
        }
    }
    
    public String getCurrentStatus() {
        return currentStatus;
    }
    
    public String getPreviousStatus() {
        return previousStatus;
    }
    
    public boolean isMaintenanceRequired() {
        return maintenanceRequired;
    }
    
    public String getStatusHistory() {
        if (previousStatus != null) {
            return previousStatus + " -> " + currentStatus;
        }
        return currentStatus;
    }
}
```

---

## Example 4: Maximo MBO Helper (Maximo-Specific)

**Complexity:** ⭐⭐⭐⭐ Advanced  
**Use Case:** Maximo Business Object operations simulation

```java
public class MaximoAssetHelper {
    private String assetNum;
    private String description;
    private String location;
    private String status;
    
    public MaximoAssetHelper() {
        this.status = "OPERATING";
    }
    
    public void initializeAsset(String assetNum, String description) {
        this.assetNum = assetNum;
        this.description = description;
    }
    
    public boolean validateAssetNumber() {
        if (assetNum == null || assetNum.isEmpty()) {
            return false;
        }
        // Asset number should be alphanumeric and max 12 chars
        return assetNum.matches("^[A-Z0-9]{1,12}$");
    }
    
    public void setLocation(String location) {
        if (location != null && !location.isEmpty()) {
            this.location = location;
        }
    }
    
    public void changeStatus(String newStatus) {
        String[] validStatuses = {"OPERATING", "NOT READY", "DECOMMISSIONED", "MISSING"};
        for (String validStatus : validStatuses) {
            if (validStatus.equals(newStatus)) {
                this.status = newStatus;
                return;
            }
        }
    }
    
    public String getAssetInfo() {
        StringBuilder info = new StringBuilder();
        info.append("Asset: ").append(assetNum).append("\n");
        info.append("Description: ").append(description).append("\n");
        info.append("Location: ").append(location != null ? location : "Not Set").append("\n");
        info.append("Status: ").append(status);
        return info.toString();
    }
    
    public boolean isOperational() {
        return "OPERATING".equals(status);
    }
}
```

---

## Example 5: Preventive Maintenance Scheduler (Complex)

**Complexity:** ⭐⭐⭐⭐⭐ Complex  
**Use Case:** Complex business logic with date calculations

```java
import java.util.Date;
import java.util.Calendar;

public class PMScheduler {
    private String pmNum;
    private int frequencyDays;
    private Date lastCompletedDate;
    private Date nextDueDate;
    private boolean isActive;
    
    public PMScheduler(String pmNum, int frequencyDays) {
        this.pmNum = pmNum;
        this.frequencyDays = frequencyDays;
        this.isActive = true;
    }
    
    public void setLastCompletedDate(Date completedDate) {
        this.lastCompletedDate = completedDate;
        calculateNextDueDate();
    }
    
    private void calculateNextDueDate() {
        if (lastCompletedDate != null) {
            Calendar cal = Calendar.getInstance();
            cal.setTime(lastCompletedDate);
            cal.add(Calendar.DAY_OF_MONTH, frequencyDays);
            this.nextDueDate = cal.getTime();
        }
    }
    
    public boolean isDue() {
        if (nextDueDate == null) {
            return false;
        }
        Date today = new Date();
        return today.after(nextDueDate) || today.equals(nextDueDate);
    }
    
    public boolean isOverdue() {
        if (nextDueDate == null) {
            return false;
        }
        Date today = new Date();
        Calendar cal = Calendar.getInstance();
        cal.setTime(nextDueDate);
        cal.add(Calendar.DAY_OF_MONTH, 7); // 7 days grace period
        return today.after(cal.getTime());
    }
    
    public int getDaysUntilDue() {
        if (nextDueDate == null) {
            return -1;
        }
        Date today = new Date();
        long diff = nextDueDate.getTime() - today.getTime();
        return (int) (diff / (1000 * 60 * 60 * 24));
    }
    
    public String getScheduleStatus() {
        if (!isActive) {
            return "INACTIVE";
        }
        if (isOverdue()) {
            return "OVERDUE";
        }
        if (isDue()) {
            return "DUE";
        }
        return "SCHEDULED";
    }
    
    public void activate() {
        this.isActive = true;
    }
    
    public void deactivate() {
        this.isActive = false;
    }
}
```

---

## Tips for Best Results

### ✅ Do's
- Use clear, descriptive class and method names
- Include proper Java syntax (class declaration, methods, etc.)
- Add comments to explain complex logic
- Use standard Java types (String, int, boolean, etc.)
- Keep classes focused on a single responsibility

### ❌ Don'ts
- Don't use advanced Java features (generics, lambdas, streams) - they may not convert well
- Avoid external library dependencies
- Don't use complex inheritance hierarchies
- Avoid static methods and fields when possible
- Don't use Java 8+ features if targeting Python

### 🎯 Generation Options

- **Include Comments**: Adds explanatory comments to the generated script
- **Apply Maximo Best Practices**: Optimizes code for Maximo environment
- **Include Imports**: Adds necessary import statements

### 📝 After Generation

1. **Review the Preview**: Check warnings and suggestions
2. **Edit if Needed**: Click "Edit in Editor" to make adjustments
3. **Test Thoroughly**: Always test generated scripts in a development environment first
4. **Save to Maximo**: Once satisfied, save the script to your Maximo instance

---

## Known Limitations

- Complex Java features may require manual adjustment
- Date/time handling may need review
- Exception handling is simplified
- Some Java idioms don't translate directly to Python/JavaScript
- External library calls cannot be converted automatically

---

## Need Help?

If you encounter issues with script generation:
1. Check the warnings and suggestions in the preview
2. Simplify your Java class if it's too complex
3. Review the generated code for any obvious issues
4. Test in a development environment before production use

---

**Last Updated:** 2026-05-21  
**Version:** 1.0.0