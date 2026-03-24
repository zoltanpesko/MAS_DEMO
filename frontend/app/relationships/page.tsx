"use client";

import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  RefreshCw, 
  Save, 
  Database,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Edit3,
  X
} from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface Relationship {
  name: string;
  parent: string;
  child: string;
  whereclause: string;
  cardinality: string;
  remarks: string;
  maxrelationshipid: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    member: Relationship[];
  };
  source: string;
}

interface OptimizationAnalysis {
  originalClause: string;
  hasIssues: boolean;
  recommendations: string[];
  optimizedClause?: string;
  score: string;
}

export default function RelationshipsPage() {
  const [serverUrl, setServerUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [editedWhereClause, setEditedWhereClause] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<OptimizationAnalysis | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParent, setSelectedParent] = useState("");
  const [parentList, setParentList] = useState<string[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [parentSearchTerm, setParentSearchTerm] = useState("");
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const parentDropdownRef = useRef<HTMLDivElement>(null);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [topIssues, setTopIssues] = useState<Array<{
    relationship: Relationship;
    analysis: OptimizationAnalysis;
    issueCount: number;
  }>>([]);
  const [showTopIssues, setShowTopIssues] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (parentDropdownRef.current && !parentDropdownRef.current.contains(event.target as Node)) {
        setShowParentDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const savedUrl = localStorage.getItem("mas_server_url") || "";
    const savedKey = localStorage.getItem("mas_api_key") || "";
    setServerUrl(savedUrl);
    setApiKey(savedKey);
  }, []);

  const loadParentObjects = async () => {
    if (!serverUrl || !apiKey) {
      setStatus({
        type: "error",
        message: "⚠️ Please configure API settings on the home page first",
      });
      return;
    }

    setLoadingParents(true);
    setStatus({ type: "info", message: "⏳ Loading parent objects..." });

    try {
      // Fetch all relationships to get unique parent objects
      const response = await fetch("/api/relationships?pageSize=10000", {
        method: "GET",
        headers: {
          "x-mas-api-key": apiKey,
          "x-mas-server-url": serverUrl,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (
        result.success &&
        result.data &&
        result.data.member &&
        result.data.member.length > 0
      ) {
        // Extract unique parent objects
        const uniqueParents = Array.from(
          new Set(result.data.member.map((r) => r.parent))
        ).sort();
        
        setParentList(uniqueParents);
        setStatus({
          type: "success",
          message: `✅ Found ${uniqueParents.length} parent objects`,
        });
      } else {
        setStatus({ type: "error", message: "⚠️ No parent objects found" });
      }
    } catch (error: any) {
      setStatus({ type: "error", message: `❌ Error: ${error.message}` });
    } finally {
      setLoadingParents(false);
    }
  };

  const loadRelationships = async () => {
    if (!serverUrl || !apiKey) {
      setStatus({
        type: "error",
        message: "⚠️ Please configure API settings on the home page first",
      });
      return;
    }

    if (!selectedParent) {
      setStatus({
        type: "error",
        message: "⚠️ Please select a parent object first",
      });
      return;
    }

    setLoading(true);
    setStatus({ type: "info", message: `⏳ Loading all relationships for ${selectedParent}...` });
    setRelationships([]);

    try {
      // Load ALL relationships for the selected parent (no page size limit)
      const response = await fetch(`/api/relationships?parent=${encodeURIComponent(selectedParent)}&pageSize=10000`, {
        method: "GET",
        headers: {
          "x-mas-api-key": apiKey,
          "x-mas-server-url": serverUrl,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (
        result.success &&
        result.data &&
        result.data.member &&
        result.data.member.length > 0
      ) {
        setRelationships(result.data.member);
        setLastRefreshed(
          new Date().toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
        );
        setStatus({
          type: "success",
          message: `✅ Successfully loaded ${result.data.member.length} database relationships`,
        });
      } else {
        setStatus({ type: "error", message: "⚠️ No relationships found" });
      }
    } catch (error: any) {
      setStatus({ type: "error", message: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const viewRelationship = (relationship: Relationship) => {
    setSelectedRelationship(relationship);
    setEditedWhereClause(relationship.whereclause || "");
    setAnalysis(null);
  };

  const closeRelationshipView = () => {
    setSelectedRelationship(null);
    setEditedWhereClause("");
    setAnalysis(null);
  };

  const analyzeWhereClause = async () => {
    if (!editedWhereClause) {
      setStatus({
        type: "error",
        message: "⚠️ No WHERE clause to analyze",
      });
      return;
    }

    setAnalyzing(true);
    setStatus({ type: "info", message: "⏳ Analyzing WHERE clause for DB2 optimization..." });

    try {
      const response = await fetch("/api/relationships/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whereclause: editedWhereClause,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setAnalysis(result.analysis);
        setStatus({
          type: result.analysis.hasIssues ? "info" : "success",
          message: result.analysis.hasIssues 
            ? "💡 Optimization recommendations available" 
            : "✅ WHERE clause looks optimized!",
        });
        
        // If there's an optimized version, offer to use it
        if (result.analysis.optimizedClause) {
          setEditedWhereClause(result.analysis.optimizedClause);
        }
      } else {
        throw new Error(result.error || "Failed to analyze WHERE clause");
      }
    } catch (error: any) {
      console.error("Error analyzing WHERE clause:", error);
      setStatus({ type: "error", message: `❌ Analysis error: ${error.message}` });
    } finally {
      setAnalyzing(false);
    }
  };

  const saveRelationship = async () => {
    if (!selectedRelationship) return;

    setSaving(true);
    setStatus({ 
      type: "info", 
      message: `⏳ Saving ${selectedRelationship.name}...` 
    });

    try {
      const response = await fetch(`/api/relationships/${selectedRelationship.name}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whereclause: editedWhereClause,
          serverUrl,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setRelationships((prevRelationships) =>
          prevRelationships.map((r) =>
            r.name === selectedRelationship.name
              ? { ...r, whereclause: editedWhereClause }
              : r
          )
        );
        setSelectedRelationship({ ...selectedRelationship, whereclause: editedWhereClause });
        setStatus({
          type: "success",
          message: `✅ Relationship saved successfully!`,
        });
      } else {
        throw new Error(result.error || "Failed to save relationship");
      }
    } catch (error: any) {
      setStatus({ type: "error", message: `❌ Save error: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const analyzeAllRelationships = async () => {
    if (relationships.length === 0) {
      setStatus({
        type: "error",
        message: "⚠️ No relationships loaded. Please load relationships first.",
      });
      return;
    }

    setAnalyzingAll(true);
    setStatus({
      type: "info",
      message: `⏳ Analyzing ${relationships.length} relationships for optimization opportunities...`
    });

    try {
      const analysisResults: Array<{
        relationship: Relationship;
        analysis: OptimizationAnalysis;
        issueCount: number;
      }> = [];

      // Analyze each relationship
      for (const relationship of relationships) {
        if (!relationship.whereclause) continue;

        try {
          const response = await fetch("/api/relationships/optimize", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              whereclause: relationship.whereclause,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.analysis.hasIssues) {
              analysisResults.push({
                relationship,
                analysis: result.analysis,
                issueCount: result.analysis.recommendations.length,
              });
            }
          }
        } catch (error) {
          // Skip failed analyses
        }
      }

      // Sort by issue count (descending) and take top 10
      const top10 = analysisResults
        .sort((a, b) => b.issueCount - a.issueCount)
        .slice(0, 10);

      setTopIssues(top10);
      setShowTopIssues(true);
      setStatus({
        type: "success",
        message: `✅ Analysis complete! Found ${analysisResults.length} relationships with optimization opportunities. Showing top 10.`,
      });
    } catch (error: any) {
      setStatus({ type: "error", message: `❌ Analysis error: ${error.message}` });
    } finally {
      setAnalyzingAll(false);
    }
  };

  const filteredRelationships = relationships.filter(rel =>
    rel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rel.parent.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rel.child.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen relative">
      {/* Fixed Background Hero */}
      <div className="fixed inset-0 z-0">
        <HeroGeometric
          badge="MAS Database Manager"
          title1="Database Relationships"
          title2="WHERE Clause Optimizer"
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="container mx-auto px-4 pt-8 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Relationships Card */}
          <div className="bg-gray-900/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Database className="w-5 h-5" />
                Database Relationships (MXAPIDB)
              </h3>
              
              {/* Parent Selector and Buttons */}
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative" ref={parentDropdownRef}>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Select Parent Object (type to filter)
                  </label>
                  <input
                    type="text"
                    value={parentSearchTerm || selectedParent}
                    onChange={(e) => {
                      setParentSearchTerm(e.target.value);
                      setShowParentDropdown(true);
                      if (!e.target.value) {
                        setSelectedParent("");
                      }
                    }}
                    onFocus={() => setShowParentDropdown(true)}
                    placeholder="Type to search parent objects..."
                    disabled={loadingParents || loading || parentList.length === 0}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {showParentDropdown && parentList.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {parentList
                        .filter((parent) =>
                          parent.toLowerCase().includes((parentSearchTerm || selectedParent).toLowerCase())
                        )
                        .map((parent) => (
                          <div
                            key={parent}
                            onClick={() => {
                              setSelectedParent(parent);
                              setParentSearchTerm("");
                              setShowParentDropdown(false);
                            }}
                            className={`px-4 py-2 cursor-pointer hover:bg-indigo-600/50 transition-colors ${
                              selectedParent === parent ? "bg-indigo-600/30 text-indigo-200" : "text-white"
                            }`}
                          >
                            {parent}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={loadParentObjects}
                  disabled={loadingParents}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingParents ? "animate-spin" : ""}`} />
                  {loadingParents ? "Loading..." : "Load Parents"}
                </button>
                <button
                  onClick={loadRelationships}
                  disabled={loading || !selectedParent}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Loading..." : "Load All"}
                </button>
                <button
                  onClick={analyzeAllRelationships}
                  disabled={analyzingAll || relationships.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <Lightbulb className={`w-4 h-4 ${analyzingAll ? "animate-pulse" : ""}`} />
                  {analyzingAll ? "Analyzing..." : "Find Issues"}
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {status.message && (
              <div
                className={`p-4 rounded-lg mb-4 border-l-4 backdrop-blur-sm ${
                  status.type === "success"
                    ? "bg-green-500/20 border-green-500 text-green-200"
                    : status.type === "error"
                    ? "bg-red-500/20 border-red-500 text-red-200"
                    : "bg-blue-500/20 border-blue-500 text-blue-200"
                }`}
              >
                {status.message}
              </div>
            )}

            {/* Top Issues Display */}
            {showTopIssues && topIssues.length > 0 && (
              <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-yellow-200 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Top {topIssues.length} Relationships Needing Optimization
                  </h4>
                  <button
                    onClick={() => setShowTopIssues(false)}
                    className="text-yellow-200 hover:text-yellow-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {topIssues.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-900/50 border border-yellow-500/30 rounded-lg p-3 hover:bg-gray-900/70 transition-all cursor-pointer"
                      onClick={() => viewRelationship(item.relationship)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-semibold text-white mb-1">
                            #{index + 1}: {item.relationship.name}
                          </h5>
                          <div className="text-xs text-white/60">
                            {item.relationship.parent} → {item.relationship.child}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-yellow-600/50 text-yellow-200 text-xs rounded">
                            {item.issueCount} issue{item.issueCount > 1 ? 's' : ''}
                          </span>
                          <span className="text-xs text-white/60">{item.analysis.score}</span>
                        </div>
                      </div>
                      <div className="text-xs text-white/80 font-mono bg-gray-800/50 p-2 rounded mb-2 truncate">
                        {item.relationship.whereclause}
                      </div>
                      <div className="space-y-1">
                        {item.analysis.recommendations.slice(0, 2).map((rec, idx) => (
                          <div key={idx} className="text-xs text-yellow-200/80 pl-2 border-l-2 border-yellow-500/50">
                            {rec}
                          </div>
                        ))}
                        {item.analysis.recommendations.length > 2 && (
                          <div className="text-xs text-yellow-200/60 pl-2">
                            +{item.analysis.recommendations.length - 2} more issues...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Refreshed */}
            {lastRefreshed && (
              <div className="mb-4 p-3 bg-indigo-500/20 border-l-4 border-indigo-500 text-sm text-indigo-200 backdrop-blur-sm">
                🕒 Last Refreshed: {lastRefreshed}
              </div>
            )}

            {/* Search */}
            {relationships.length > 0 && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by name, parent, or child table..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
                />
              </div>
            )}

            {/* Relationships List */}
            {filteredRelationships.length > 0 && (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredRelationships.map((relationship, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/50 border border-white/10 rounded-lg p-4 hover:bg-gray-800/70 transition-all cursor-pointer group"
                    onClick={() => viewRelationship(relationship)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors mb-2">
                          {relationship.name}
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-white/60">Parent:</span>
                            <span className="text-white ml-2">{relationship.parent}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Child:</span>
                            <span className="text-white ml-2">{relationship.child}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Cardinality:</span>
                            <span className="text-white ml-2">{relationship.cardinality}</span>
                          </div>
                        </div>
                        {relationship.whereclause && (
                          <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs font-mono text-white/80 truncate">
                            {relationship.whereclause}
                          </div>
                        )}
                      </div>
                      <Edit3 className="w-4 h-4 text-white/40 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Relationship Editor Modal */}
      {selectedRelationship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg shadow-2xl border border-white/20 w-full max-w-[95vw] h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Database className="w-6 h-6 text-indigo-400" />
                  {selectedRelationship.name}
                </h2>
                <p className="text-sm text-white/60 mt-1">
                  {selectedRelationship.parent} → {selectedRelationship.child}
                </p>
              </div>
              <button
                onClick={closeRelationshipView}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white/80" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden p-6 flex flex-col gap-4">
              {/* Info Section */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800/50 border border-white/20 rounded-lg">
                <div>
                  <p className="text-sm text-white/60">Cardinality</p>
                  <p className="text-white font-medium">{selectedRelationship.cardinality}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Relationship ID</p>
                  <p className="text-white font-medium">{selectedRelationship.maxrelationshipid}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Remarks</p>
                  <p className="text-white font-medium">{selectedRelationship.remarks || "N/A"}</p>
                </div>
              </div>

              {/* WHERE Clause Editor */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white/80">
                    WHERE Clause (DB2 SQL)
                  </label>
                  <button
                    onClick={analyzeWhereClause}
                    disabled={analyzing || !editedWhereClause}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-4 h-4" />
                        Optimize
                      </>
                    )}
                  </button>
                </div>
                
                <div className="flex-1 border border-white/20 rounded-lg overflow-hidden">
                  <CodeMirror
                    value={editedWhereClause}
                    height="100%"
                    theme={vscodeDark}
                    extensions={[sql()]}
                    onChange={(value) => setEditedWhereClause(value)}
                    basicSetup={{
                      lineNumbers: true,
                      highlightActiveLineGutter: true,
                      highlightSpecialChars: true,
                      foldGutter: true,
                      drawSelection: true,
                      dropCursor: true,
                      allowMultipleSelections: true,
                      indentOnInput: true,
                      bracketMatching: true,
                      closeBrackets: true,
                      autocompletion: true,
                      rectangularSelection: true,
                      crosshairCursor: true,
                      highlightActiveLine: true,
                      highlightSelectionMatches: true,
                    }}
                    style={{
                      fontSize: "14px",
                      height: "100%",
                    }}
                  />
                </div>
              </div>

              {/* Analysis Results */}
              {analysis && (
                <div className="p-4 bg-gray-800/50 border border-white/20 rounded-lg max-h-60 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-3">
                    {analysis.hasIssues ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    <h4 className="font-semibold text-white">
                      Optimization Analysis: {analysis.score}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <div key={idx} className="text-sm text-white/80 pl-4 border-l-2 border-white/20">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-6 border-t border-white/10">
              <button
                onClick={closeRelationshipView}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveRelationship}
                disabled={saving || editedWhereClause === selectedRelationship.whereclause}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}