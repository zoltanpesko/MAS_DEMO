"use client";

import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import Link from "next/link";
import { Package, Code2, Settings, Save, User, Server, RefreshCw, Database } from "lucide-react";
import { useState, useEffect } from "react";

interface WhoAmI {
  personid?: string;
  displayname?: string;
  userid?: string;
  defaultsite?: string;
  defaultstoreroom?: string;
  emailaddress?: string;
}

interface SystemInfo {
  appServer?: string;
  database?: {
    dbProductName?: string;
    dbVersion?: string;
    dbMajorVersion?: number;
    dbMinorVersion?: number;
  };
  os?: {
    osName?: string;
    osVersion?: string;
    architecture?: string;
    availableProcessors?: number;
  };
  operator?: {
    opVersion?: string;
    latestComponent?: string;
  };
  appVersion?: {
    "rdfs:member"?: Array<{
      "spi:versionKey"?: string;
    }>;
  };
  [key: string]: any;
}

export default function Home() {
  const [serverUrl, setServerUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [whoami, setWhoami] = useState<WhoAmI | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  useEffect(() => {
    // Load saved configuration
    const savedUrl = localStorage.getItem("mas_server_url") || "";
    const savedKey = localStorage.getItem("mas_api_key") || "";
    setServerUrl(savedUrl);
    setApiKey(savedKey);

    // Auto-load user info if credentials exist
    if (savedUrl && savedKey) {
      loadUserInfo(savedUrl, savedKey);
    }
  }, []);

  const saveConfig = () => {
    localStorage.setItem("mas_server_url", serverUrl);
    localStorage.setItem("mas_api_key", apiKey);
    setStatus({
      type: "success",
      message: "✅ Configuration saved successfully!",
    });
    setTimeout(() => setStatus({ type: null, message: "" }), 3000);
    
    // Load user info after saving
    if (serverUrl && apiKey) {
      loadUserInfo(serverUrl, apiKey);
    }
  };

  const loadUserInfo = async (url?: string, key?: string) => {
    const useUrl = url || serverUrl;
    const useKey = key || apiKey;

    if (!useUrl || !useKey) {
      setStatus({
        type: "error",
        message: "⚠️ Please configure API settings first",
      });
      return;
    }

    setLoading(true);
    setStatus({ type: "info", message: "⏳ Loading user and system information..." });

    try {
      // Fetch whoami
      const whoamiResponse = await fetch("/api/whoami", {
        method: "GET",
        headers: {
          "x-mas-api-key": useKey,
          "x-mas-server-url": useUrl,
          Accept: "application/json",
        },
      });

      if (whoamiResponse.ok) {
        const whoamiResult = await whoamiResponse.json();
        if (whoamiResult.success) {
          setWhoami(whoamiResult.data);
        }
      }

      // Fetch systeminfo
      const systeminfoResponse = await fetch("/api/systeminfo", {
        method: "GET",
        headers: {
          "x-mas-api-key": useKey,
          "x-mas-server-url": useUrl,
          Accept: "application/json",
        },
      });

      if (systeminfoResponse.ok) {
        const systeminfoResult = await systeminfoResponse.json();
        if (systeminfoResult.success) {
          setSystemInfo(systeminfoResult.data);
        }
      }

      setStatus({
        type: "success",
        message: "✅ Successfully loaded user and system information",
      });
    } catch (error: any) {
      console.error("Error loading info:", error);
      setStatus({ type: "error", message: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative">
      {/* Fixed Background Hero */}
      <div className="fixed inset-0 z-0">
        <HeroGeometric
          badge="MAS Management Portal"
          title1="Maximo Application Suite"
          title2="Asset & Script Manager"
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Section - API Configuration */}
        <div className="container mx-auto px-4 pt-8 pb-4 max-w-6xl">
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

            <div className="flex gap-2">
              <button
                onClick={saveConfig}
                className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
              <button
                onClick={() => loadUserInfo()}
                disabled={loading || !serverUrl || !apiKey}
                className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Loading..." : "Load Info"}
              </button>
            </div>

            {/* Status Messages */}
            {status.message && (
              <div
                className={`mt-4 p-4 rounded-lg border-l-4 backdrop-blur-sm ${
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
          </div>

          {/* User Info Card */}
          {whoami && (
            <div className="bg-gray-900/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-semibold text-white">
                  Logged In User
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {whoami.displayname && (
                  <div>
                    <p className="text-sm text-white/60">Display Name</p>
                    <p className="text-white font-medium">{whoami.displayname}</p>
                  </div>
                )}
                {whoami.userid && (
                  <div>
                    <p className="text-sm text-white/60">User ID</p>
                    <p className="text-white font-medium">{whoami.userid}</p>
                  </div>
                )}
                {whoami.personid && (
                  <div>
                    <p className="text-sm text-white/60">Person ID</p>
                    <p className="text-white font-medium">{whoami.personid}</p>
                  </div>
                )}
                {whoami.defaultsite && (
                  <div>
                    <p className="text-sm text-white/60">Default Site</p>
                    <p className="text-white font-medium">{whoami.defaultsite}</p>
                  </div>
                )}
                {whoami.defaultstoreroom && (
                  <div>
                    <p className="text-sm text-white/60">Default Storeroom</p>
                    <p className="text-white font-medium">{whoami.defaultstoreroom}</p>
                  </div>
                )}
                {whoami.emailaddress && (
                  <div>
                    <p className="text-sm text-white/60">Email</p>
                    <p className="text-white font-medium">{whoami.emailaddress}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Info Card */}
          {systemInfo && (
            <div className="bg-gray-900/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">
                  System Information
                </h3>
              </div>
              
              {/* Server & Operator Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {systemInfo.appServer && (
                  <div>
                    <p className="text-sm text-white/60">Application Server</p>
                    <p className="text-white font-medium">{systemInfo.appServer}</p>
                  </div>
                )}
                {systemInfo.operator?.opVersion && (
                  <div>
                    <p className="text-sm text-white/60">Operator Version</p>
                    <p className="text-white font-medium">{systemInfo.operator.opVersion}</p>
                  </div>
                )}
                {systemInfo.database?.dbProductName && (
                  <div>
                    <p className="text-sm text-white/60">Database</p>
                    <p className="text-white font-medium">{systemInfo.database.dbProductName}</p>
                  </div>
                )}
                {systemInfo.database?.dbVersion && (
                  <div>
                    <p className="text-sm text-white/60">DB Version</p>
                    <p className="text-white font-medium">
                      {systemInfo.database.dbVersion} ({systemInfo.database.dbMajorVersion}.{systemInfo.database.dbMinorVersion})
                    </p>
                  </div>
                )}
                {systemInfo.os?.osName && (
                  <div>
                    <p className="text-sm text-white/60">Operating System</p>
                    <p className="text-white font-medium">{systemInfo.os.osName} ({systemInfo.os.architecture})</p>
                  </div>
                )}
                {systemInfo.os?.availableProcessors && (
                  <div>
                    <p className="text-sm text-white/60">CPU Cores</p>
                    <p className="text-white font-medium">{systemInfo.os.availableProcessors} processors</p>
                  </div>
                )}
              </div>

              {/* Installed Components */}
              {systemInfo.appVersion?.["rdfs:member"] && systemInfo.appVersion["rdfs:member"].length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-white/80 mb-3">Installed Components</h4>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {systemInfo.appVersion["rdfs:member"].map((component, index) => {
                      const versionKey = component["spi:versionKey"] || "";
                      // Extract component name and version
                      const match = versionKey.match(/^(.+?)\s+(\d+\.\d+\.\d+)/);
                      const name = match ? match[1] : versionKey.split(' Build')[0];
                      const version = match ? match[2] : "";
                      
                      return (
                        <div key={index} className="bg-gray-800/30 rounded px-3 py-2 border border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="text-white/90 text-sm font-medium">{name}</span>
                            {version && <span className="text-indigo-400 text-xs">{version}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section - Navigation Buttons */}
        <div className="flex-1 flex items-end justify-center pb-8">
          <div className="flex gap-4">
            <Link
              href="/assets"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-indigo-600/90 backdrop-blur-md border border-indigo-500/50 text-white hover:bg-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl text-lg font-medium"
            >
              <Package className="w-5 h-5" />
              <span>Assets</span>
            </Link>
            <Link
              href="/scripts"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-purple-600/90 backdrop-blur-md border border-purple-500/50 text-white hover:bg-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl text-lg font-medium"
            >
              <Code2 className="w-5 h-5" />
              <span>Scripts</span>
            </Link>
            <Link
              href="/relationships"
              className="flex items-center gap-3 px-6 py-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300 text-white"
            >
              <Database className="w-5 h-5" />
              <span>Relationships</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

// Made with Bob
