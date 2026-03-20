"use client";

import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Save, Settings, Download, Edit2, Check, X } from "lucide-react";

interface Asset {
  assetnum: string;
  description: string;
  status: string;
  siteid: string;
  location: string;
  assettype: string;
  manufacturer: string;
  serialnum: string;
  installdate: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    member: Asset[];
  };
  source: string;
}

export default function AssetsPage() {
  const [serverUrl, setServerUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [showJson, setShowJson] = useState(false);
  const [fullData, setFullData] = useState<any>(null);
  const [editingCell, setEditingCell] = useState<{assetnum: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [downloadingLarge, setDownloadingLarge] = useState(false);
  const [lastUpdateResponse, setLastUpdateResponse] = useState<any>(null);

  useEffect(() => {
    // Load saved configuration
    const savedUrl = localStorage.getItem("mas_server_url") || "";
    const savedKey = localStorage.getItem("mas_api_key") || "";
    setServerUrl(savedUrl);
    setApiKey(savedKey);
  }, []);

  const saveConfig = () => {
    localStorage.setItem("mas_server_url", serverUrl);
    localStorage.setItem("mas_api_key", apiKey);
    setStatus({
      type: "success",
      message: "✅ Configuration saved successfully!",
    });
    setTimeout(() => setStatus({ type: null, message: "" }), 3000);
  };

  const loadAssets = async (pageSize: number = 10) => {
    if (!serverUrl || !apiKey) {
      setStatus({
        type: "error",
        message: "⚠️ Please configure API settings first",
      });
      return null;
    }

    setLoading(true);
    setStatus({ type: "info", message: `⏳ Loading ${pageSize} assets...` });
    if (pageSize === 10) {
      setAssets([]);
    }

    try {
      const response = await fetch(`/api/assets?pageSize=${pageSize}`, {
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
        if (pageSize === 10) {
          setAssets(result.data.member);
          setFullData(result.data);
        }
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
          message: `✅ Successfully loaded ${result.data.member.length} assets from ${
            result.source === "maximo" ? "Maximo" : "Mock Data"
          }`,
        });
        return result.data.member;
      } else {
        setStatus({ type: "error", message: "⚠️ No assets found" });
        return null;
      }
    } catch (error: any) {
      console.error("Error loading assets:", error);
      setStatus({ type: "error", message: `❌ Error: ${error.message}` });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const downloadLargeDataset = async () => {
    setDownloadingLarge(true);
    setStatus({ type: "info", message: "⏳ Downloading 100 assets..." });

    try {
      const largeAssets = await loadAssets(100);
      
      if (!largeAssets || largeAssets.length === 0) {
        setStatus({ type: "error", message: "⚠️ No assets to download" });
        return;
      }

      // Convert to CSV
      const headers = [
        "Asset Number",
        "Description",
        "Status",
        "Site",
        "Location",
        "Type",
        "Manufacturer",
        "Serial Number",
        "Install Date",
      ];
      
      const csvRows = [
        headers.join(","),
        ...largeAssets.map((asset: Asset) =>
          [
            asset.assetnum || "",
            `"${(asset.description || "").replace(/"/g, '""')}"`,
            asset.status || "",
            asset.siteid || "",
            asset.location || "",
            asset.assettype || "",
            asset.manufacturer || "",
            asset.serialnum || "",
            asset.installdate ? new Date(asset.installdate).toLocaleDateString() : "",
          ].join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `maximo_assets_${Date.now()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatus({
        type: "success",
        message: `✅ Successfully downloaded ${largeAssets.length} assets as CSV`,
      });
    } catch (error: any) {
      console.error("Error downloading assets:", error);
      setStatus({ type: "error", message: `❌ Download error: ${error.message}` });
    } finally {
      setDownloadingLarge(false);
    }
  };

  const startEdit = (assetnum: string, field: string, currentValue: string) => {
    setEditingCell({ assetnum, field });
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const updateAssetField = async (asset: Asset, field: keyof Asset) => {
    if (!editValue || editValue === asset[field]) {
      cancelEdit();
      return;
    }

    setUpdating(true);
    const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1);
    setStatus({ type: "info", message: `⏳ Updating ${fieldLabel} for ${asset.assetnum}...` });

    try {
      const response = await fetch("/api/assets/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetnum: asset.assetnum,
          siteid: asset.siteid,
          field: field,
          value: editValue,
          serverUrl,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Store the response for debugging
      setLastUpdateResponse({
        timestamp: new Date().toISOString(),
        request: {
          assetnum: asset.assetnum,
          siteid: asset.siteid,
          field: field,
          oldValue: asset[field],
          newValue: editValue,
        },
        response: result,
      });

      if (result.success) {
        // Update local state
        setAssets((prevAssets) =>
          prevAssets.map((a) =>
            a.assetnum === asset.assetnum ? { ...a, [field]: editValue } : a
          )
        );
        setStatus({
          type: "success",
          message: `✅ ${fieldLabel} updated successfully for ${asset.assetnum}`,
        });
        cancelEdit();
      } else {
        throw new Error(result.error || "Failed to update field");
      }
    } catch (error: any) {
      console.error("Error updating field:", error);
      setStatus({ type: "error", message: `❌ Update error: ${error.message}` });
    } finally {
      setUpdating(false);
    }
  };

  // Helper function to render editable cell
  const renderEditableCell = (asset: Asset, field: keyof Asset, className: string = "text-white/80") => {
    const isEditing = editingCell?.assetnum === asset.assetnum && editingCell?.field === field;
    const value = asset[field] as string;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="px-2 py-1 bg-gray-800/50 border border-white/20 rounded text-white text-xs flex-1 min-w-[100px]"
            placeholder={`New ${field}`}
            disabled={updating}
            autoFocus
          />
          <button
            onClick={() => updateAssetField(asset, field)}
            disabled={updating}
            className="p-1 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
            title="Save"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={cancelEdit}
            disabled={updating}
            className="p-1 bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
            title="Cancel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }
    
    return (
      <div
        className={`group flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded ${className}`}
        onClick={() => startEdit(asset.assetnum, field, value || "")}
        title={`Click to edit ${field}`}
      >
        <span className="flex-1">{value || "N/A"}</span>
        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>
    );
  };

  return (
    <div className="min-h-screen relative">
      {/* Fixed Background Hero */}
      <div className="fixed inset-0 z-0">
        <HeroGeometric
          badge="MAS Asset Viewer"
          title1="Maximo Assets"
          title2="Management Portal"
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
          {/* API Configuration Card */}
          <div className="bg-gray-900/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-white/80" />
              <h3 className="text-lg font-semibold text-white">
                API Configuration
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="serverUrl"
                  className="block text-sm font-medium text-white/80 mb-2"
                >
                  MAS Server URL
                </label>
                <input
                  type="text"
                  id="serverUrl"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://your-maximo-instance.com"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
                />
              </div>
              <div>
                <label
                  htmlFor="apiKey"
                  className="block text-sm font-medium text-white/80 mb-2"
                >
                  API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Your API Key"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
                />
              </div>
            </div>

            <button
              onClick={saveConfig}
              className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </div>

          {/* Assets Card */}
          <div className="bg-gray-900/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-semibold text-white">
                📦 Assets (First 10)
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loadAssets(10)}
                  disabled={loading || downloadingLarge}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Loading..." : "Load Assets"}
                </button>
                <button
                  onClick={downloadLargeDataset}
                  disabled={loading || downloadingLarge || !serverUrl || !apiKey}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className={`w-4 h-4 ${downloadingLarge ? "animate-bounce" : ""}`} />
                  {downloadingLarge ? "Downloading..." : "Download 100 Assets"}
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

            {/* Last Refreshed */}
            {lastRefreshed && (
              <div className="mb-4 p-3 bg-indigo-500/20 border-l-4 border-indigo-500 text-sm text-indigo-200 backdrop-blur-sm">
                🕒 Last Refreshed: {lastRefreshed}
              </div>
            )}

            {/* Assets Table */}
            {assets.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-800/50 border-b border-white/10">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white/90">
                        Asset Number
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white/90">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white/90">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white/90">
                        Site
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white/90">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white/90">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white/90">
                        Manufacturer
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white/90">
                        Serial Number
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white/90">
                        Install Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white/90">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset, index) => (
                      <tr
                        key={index}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-white">
                          {asset.assetnum || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {renderEditableCell(asset, "description")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {editingCell?.assetnum === asset.assetnum && editingCell?.field === "status" ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                                className="px-2 py-1 bg-gray-800/50 border border-white/20 rounded text-white text-xs w-32"
                                placeholder="NEW STATUS"
                                disabled={updating}
                                autoFocus
                              />
                              <button
                                onClick={() => updateAssetField(asset, "status")}
                                disabled={updating}
                                className="p-1 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
                                title="Save"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={updating}
                                className="p-1 bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                                title="Cancel"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              className="group cursor-pointer"
                              onClick={() => startEdit(asset.assetnum, "status", asset.status || "")}
                              title="Click to edit status"
                            >
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  asset.status === "OPERATING"
                                    ? "bg-indigo-500/30 text-indigo-200 border border-indigo-500/50"
                                    : asset.status === "ACTIVE"
                                    ? "bg-green-500/30 text-green-200 border border-green-500/50"
                                    : asset.status === "INACTIVE"
                                    ? "bg-red-500/30 text-red-200 border border-red-500/50"
                                    : asset.status === "NOT READY"
                                    ? "bg-yellow-500/30 text-yellow-200 border border-yellow-500/50"
                                    : "bg-gray-500/30 text-gray-200 border border-gray-500/50"
                                }`}
                              >
                                {asset.status || "N/A"}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-white/80">
                          {asset.siteid || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {renderEditableCell(asset, "location")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {renderEditableCell(asset, "assettype")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {renderEditableCell(asset, "manufacturer")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {renderEditableCell(asset, "serialnum")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {renderEditableCell(asset, "installdate")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Last Update Response (Debug) */}
            {lastUpdateResponse && (
              <div className="mt-6">
                <div className="p-4 bg-blue-500/20 border-l-4 border-blue-500 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-200 mb-2">
                    🔍 Last Update Response (Debug)
                  </h4>
                  <pre className="p-3 bg-gray-900/50 rounded text-xs text-white/80 overflow-x-auto border border-white/10">
                    {JSON.stringify(lastUpdateResponse, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* JSON Response */}
            {fullData && (
              <div className="mt-6">
                <button
                  onClick={() => setShowJson(!showJson)}
                  className="w-full px-4 py-2 bg-gray-800/50 hover:bg-gray-800/70 rounded-lg text-left font-semibold text-white/90 transition-colors border border-white/10"
                >
                  {showJson ? "▼" : "▶"} View Full JSON Response
                </button>
                {showJson && (
                  <pre className="mt-2 p-4 bg-gray-800/50 rounded-lg overflow-x-auto text-xs text-white/80 border border-white/10">
                    {JSON.stringify(fullData, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
