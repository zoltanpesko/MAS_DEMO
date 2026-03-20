import { NextRequest, NextResponse } from "next/server";

// DB2 optimization rules and recommendations
function analyzeDB2WhereClause(whereClause: string): {
  hasIssues: boolean;
  recommendations: string[];
  optimizedClause?: string;
} {
  const recommendations: string[] = [];
  let hasIssues = false;
  let optimizedClause = whereClause;

  // Rule 1: Check for leading wildcards in LIKE
  if (/LIKE\s+['"]%/i.test(whereClause)) {
    hasIssues = true;
    recommendations.push(
      "⚠️ Leading wildcard in LIKE clause prevents index usage. Consider using full-text search or restructuring the query."
    );
  }

  // Rule 2: Check for OR conditions (can prevent index usage)
  if (/\sOR\s/i.test(whereClause)) {
    hasIssues = true;
    recommendations.push(
      "⚠️ OR conditions may prevent index usage. Consider using IN clause or UNION instead."
    );
    // Suggest optimization
    const orPattern = /(\w+)\s*=\s*['"]?(\w+)['"]?\s+OR\s+\1\s*=\s*['"]?(\w+)['"]?/gi;
    if (orPattern.test(whereClause)) {
      optimizedClause = whereClause.replace(
        orPattern,
        "$1 IN ('$2', '$3')"
      );
      recommendations.push(`✅ Suggested: ${optimizedClause}`);
    }
  }

  // Rule 3: Check for functions on indexed columns
  if (/UPPER\(|LOWER\(|SUBSTR\(|TRIM\(/i.test(whereClause)) {
    hasIssues = true;
    recommendations.push(
      "⚠️ Functions on columns prevent index usage. Consider function-based indexes or storing computed values."
    );
  }

  // Rule 4: Check for NOT IN (inefficient)
  if (/NOT\s+IN\s*\(/i.test(whereClause)) {
    hasIssues = true;
    recommendations.push(
      "⚠️ NOT IN can be slow with large datasets. Consider using NOT EXISTS or LEFT JOIN with NULL check."
    );
  }

  // Rule 5: Check for implicit type conversions
  if (/=\s*\d+\s*AND.*=\s*['"]/i.test(whereClause) || /=\s*['"].*AND.*=\s*\d+/i.test(whereClause)) {
    recommendations.push(
      "💡 Ensure data types match to avoid implicit conversions that prevent index usage."
    );
  }

  // Rule 6: Check for SELECT * (not in WHERE but good practice)
  recommendations.push(
    "💡 Best Practice: Ensure indexes exist on columns used in WHERE clause for optimal performance."
  );

  // Rule 7: Check for complex expressions
  if (/\+|\-|\*|\//.test(whereClause.replace(/['"]/g, ""))) {
    hasIssues = true;
    recommendations.push(
      "⚠️ Arithmetic operations in WHERE clause may prevent index usage. Consider pre-computing values."
    );
  }

  // Rule 8: Check for LIKE without wildcards (use = instead)
  const likeWithoutWildcard = /LIKE\s+['"]([^%_]+)['"]/gi;
  if (likeWithoutWildcard.test(whereClause)) {
    hasIssues = true;
    optimizedClause = whereClause.replace(likeWithoutWildcard, "= '$1'");
    recommendations.push(
      `✅ LIKE without wildcards detected. Use = for better performance: ${optimizedClause}`
    );
  }

  // Rule 9: Check for redundant conditions
  if (/(\w+)\s*=\s*(['"]?\w+['"]?).*\1\s*=\s*\2/i.test(whereClause)) {
    recommendations.push(
      "⚠️ Redundant conditions detected. Remove duplicate comparisons."
    );
  }

  // Rule 10: Suggest using EXISTS instead of COUNT
  if (/COUNT\s*\(/i.test(whereClause)) {
    recommendations.push(
      "💡 If checking for existence, use EXISTS instead of COUNT for better performance."
    );
  }

  return {
    hasIssues,
    recommendations,
    optimizedClause: hasIssues && optimizedClause !== whereClause ? optimizedClause : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { whereclause } = body;

    if (!whereclause) {
      return NextResponse.json(
        { success: false, error: "WHERE clause is required" },
        { status: 400 }
      );
    }

    const analysis = analyzeDB2WhereClause(whereclause);

    return NextResponse.json({
      success: true,
      analysis: {
        originalClause: whereclause,
        hasIssues: analysis.hasIssues,
        recommendations: analysis.recommendations,
        optimizedClause: analysis.optimizedClause,
        score: analysis.hasIssues ? "Needs Optimization" : "Looks Good",
      },
    });
  } catch (error: any) {
    console.error("Error analyzing WHERE clause:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to analyze WHERE clause",
      },
      { status: 500 }
    );
  }
}
