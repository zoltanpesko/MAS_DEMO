"use client";

import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Save,
  Settings,
  Download,
  Code2,
  FileCode,
  X,
  Check,
  Plus
} from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface AutoScript {
  autoscript: string;
  description: string;
  scriptlanguage: string;
  active: boolean;
  status: string;
  source: string;
  autoscriptid?: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    member: AutoScript[];
  };
  source: string;
}

export default function ScriptsPage() {
  const [serverUrl, setServerUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [scripts, setScripts] = useState<AutoScript[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [selectedScript, setSelectedScript] = useState<AutoScript | null>(null);
  const [editedSource, setEditedSource] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [isCreating, setIsCreating] = useState(false);
  const [newScript, setNewScript] = useState({
    autoscript: "",
    description: "",
    scriptlanguage: "python",
    source: "# Write your Python code here\n\n",
  });

  // All supported script languages in Maximo
  const SCRIPT_LANGUAGES = [
    { value: "python", label: "Python (Jython 2.7.4)", template: "# Write your Python code here\n\n" },
    { value: "nashorn", label: "Nashorn (OpenJDK Nashorn 15.6)", template: "// Write your Nashorn code here\n\n" },
    { value: "jython", label: "Jython (Jython 2.7.4)", template: "# Write your Jython code here\n\n" },
    { value: "js", label: "JS (OpenJDK Nashorn 15.6)", template: "// Write your JavaScript code here\n\n" },
    { value: "javascript", label: "JavaScript (OpenJDK Nashorn 15.6)", template: "// Write your JavaScript code here\n\n" },
    { value: "ecmascript", label: "ECMAScript (OpenJDK Nashorn 15.6)", template: "// Write your ECMAScript code here\n\n" },
    { value: "Nashorn", label: "Nashorn (OpenJDK Nashorn 15.6)", template: "// Write your Nashorn code here\n\n" },
    { value: "MBR", label: "MBR (MaximoRules 1.0)", template: "// Write your MBR code here\n\n" },
    { value: "JavaScript", label: "JavaScript (OpenJDK Nashorn 15.6)", template: "// Write your JavaScript code here\n\n" },
    { value: "JS", label: "JS (OpenJDK Nashorn 15.6)", template: "// Write your JS code here\n\n" },
    { value: "ECMAScript", label: "ECMAScript (OpenJDK Nashorn 15.6)", template: "// Write your ECMAScript code here\n\n" },
  ];

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

  const loadScripts = async () => {
    if (!serverUrl || !apiKey) {
      setStatus({
        type: "error",
        message: "⚠️ Please configure API settings first",
      });
      return;
    }

    setLoading(true);
    setStatus({ type: "info", message: "⏳ Loading automation scripts..." });
    setScripts([]);

    try {
      const response = await fetch("/api/scripts?pageSize=50", {
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
        setScripts(result.data.member);
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
          message: `✅ Successfully loaded ${result.data.member.length} automation scripts from ${
            result.source === "maximo" ? "Maximo" : "Mock Data"
          }`,
        });
      } else {
        setStatus({ type: "error", message: "⚠️ No scripts found" });
      }
    } catch (error: any) {
      setStatus({ type: "error", message: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const viewScript = (script: AutoScript) => {
    setSelectedScript(script);
    setEditedSource(script.source || "");
    setIsCreating(false);
  };

  const closeScriptView = () => {
    setSelectedScript(null);
    setEditedSource("");
    setIsCreating(false);
  };

  // Helper function to get language extension for CodeMirror
  const getLanguageExtension = (lang: string) => {
    const lowerLang = lang?.toLowerCase() || "";
    if (lowerLang.includes("python") || lowerLang.includes("jython")) {
      return [python()];
    }
    // Default to JavaScript for all other languages (Nashorn, JS, ECMAScript, MBR)
    return [javascript()];
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setNewScript({
      autoscript: "",
      description: "",
      scriptlanguage: "python",
      source: "# Write your Python code here\n\n",
    });
  };

  const createNewScript = async () => {
    if (!newScript.autoscript.trim()) {
      setStatus({
        type: "error",
        message: "⚠️ Script name is required",
      });
      return;
    }

    setSaving(true);
    setStatus({
      type: "info",
      message: `⏳ Creating ${newScript.autoscript}...`
    });

    try {
      const response = await fetch("/api/scripts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newScript,
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
        setStatus({
          type: "success",
          message: `✅ Script created successfully!`,
        });
        setIsCreating(false);
        // Reload scripts to show the new one
        await loadScripts();
      } else {
        throw new Error(result.error || "Failed to create script");
      }
    } catch (error: any) {
      setStatus({ type: "error", message: `❌ Create error: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const downloadScript = (script: AutoScript) => {
    const blob = new Blob([script.source || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const extension = script.scriptlanguage?.toLowerCase() === "python" ? "py" : "js";
    link.download = `${script.autoscript}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setStatus({
      type: "success",
      message: `✅ Downloaded ${script.autoscript}`,
    });
    setTimeout(() => setStatus({ type: null, message: "" }), 3000);
  };

  const saveScript = async () => {
    if (!selectedScript) return;

    setSaving(true);
    setStatus({ 
      type: "info", 
      message: `⏳ Saving ${selectedScript.autoscript}...` 
    });

    try {
      const scriptId = selectedScript.autoscript;
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: editedSource,
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
        // Update local state
        setScripts((prevScripts) =>
          prevScripts.map((s) =>
            s.autoscript === selectedScript.autoscript
              ? { ...s, source: editedSource }
              : s
          )
        );
        setSelectedScript({ ...selectedScript, source: editedSource });
        setStatus({
          type: "success",
          message: `✅ Script saved successfully!`,
        });
      } else {
        throw new Error(result.error || "Failed to save script");
      }
    } catch (error: any) {
      setStatus({ type: "error", message: `❌ Save error: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Fixed Background Hero */}
      <div className="fixed inset-0 z-0">
        <HeroGeometric
          badge="MAS Automation Scripts"
          title1="Script Manager"
          title2="Python & JavaScript"
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

          {/* Scripts Card */}
          <div className="bg-gray-900/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                Automation Scripts
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create New
                </button>
                <button
                  onClick={loadScripts}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Loading..." : "Load Scripts"}
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

            {/* Scripts List */}
            {scripts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scripts.map((script, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/50 border border-white/10 rounded-lg p-4 hover:bg-gray-800/70 transition-all cursor-pointer group"
                    onClick={() => viewScript(script)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-5 h-5 text-indigo-400" />
                        <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {script.autoscript}
                        </h4>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          script.active
                            ? "bg-green-500/30 text-green-200"
                            : "bg-gray-500/30 text-gray-200"
                        }`}
                      >
                        {script.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mb-3 line-clamp-2">
                      {script.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">
                        {script.scriptlanguage || "Unknown"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadScript(script);
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Script Editor Modal */}
      {selectedScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg shadow-2xl border border-white/20 w-full max-w-[95vw] h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileCode className="w-6 h-6 text-indigo-400" />
                  {selectedScript.autoscript}
                </h2>
                <p className="text-sm text-white/60 mt-1">
                  {selectedScript.description}
                </p>
              </div>
              <button
                onClick={closeScriptView}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white/80" />
              </button>
            </div>

            {/* Modal Body - Code Editor */}
            <div className="flex-1 overflow-hidden p-6 flex flex-col gap-4">
              {/* Font Size Controls */}
              <div className="flex items-center gap-4 px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg">
                <span className="text-sm text-white/60">Font Size:</span>
                <button
                  onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors"
                  title="Decrease font size"
                >
                  A-
                </button>
                <span className="text-sm text-white font-mono min-w-[3rem] text-center">
                  {fontSize}px
                </span>
                <button
                  onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors"
                  title="Increase font size"
                >
                  A+
                </button>
                <button
                  onClick={() => setFontSize(14)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs transition-colors"
                  title="Reset to default"
                >
                  Reset
                </button>
              </div>
              
              {/* CodeMirror Editor with Syntax Highlighting */}
              <div className="flex-1 overflow-hidden border border-white/20 rounded-lg">
                <CodeMirror
                  value={editedSource}
                  height="100%"
                  theme={vscodeDark}
                  extensions={getLanguageExtension(selectedScript.scriptlanguage)}
                  onChange={(value) => setEditedSource(value)}
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
                    closeBracketsKeymap: true,
                    searchKeymap: true,
                    foldKeymap: true,
                    completionKeymap: true,
                    lintKeymap: true,
                  }}
                  style={{
                    fontSize: `${fontSize}px`,
                    height: "100%",
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-white/10">
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span>Language: {selectedScript.scriptlanguage}</span>
                <span>Status: {selectedScript.status}</span>
                <span>Lines: {editedSource.split('\n').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadScript(selectedScript)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={saveScript}
                  disabled={saving || editedSource === selectedScript.source}
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
        </div>
      )}

      {/* Create New Script Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-green-400" />
                Create New Automation Script
              </h2>
              <button
                onClick={() => setIsCreating(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white/80" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Script Name *
                </label>
                <input
                  type="text"
                  value={newScript.autoscript}
                  onChange={(e) => setNewScript({ ...newScript, autoscript: e.target.value })}
                  placeholder="MY_CUSTOM_SCRIPT"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newScript.description}
                  onChange={(e) => setNewScript({ ...newScript, description: e.target.value })}
                  placeholder="Brief description of what this script does"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Language *
                </label>
                <select
                  value={newScript.scriptlanguage}
                  onChange={(e) => {
                    const lang = e.target.value;
                    const langConfig = SCRIPT_LANGUAGES.find(l => l.value === lang);
                    setNewScript({
                      ...newScript,
                      scriptlanguage: lang,
                      source: langConfig?.template || "// Write your code here\n\n"
                    });
                  }}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white"
                >
                  {SCRIPT_LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Source Code
                </label>
                <div className="border border-white/20 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                  <CodeMirror
                    value={newScript.source}
                    height="400px"
                    theme={vscodeDark}
                    extensions={getLanguageExtension(newScript.scriptlanguage)}
                    onChange={(value) => setNewScript({ ...newScript, source: value })}
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
                      closeBracketsKeymap: true,
                      searchKeymap: true,
                      foldKeymap: true,
                      completionKeymap: true,
                      lintKeymap: true,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-6 border-t border-white/10">
              <button
                onClick={() => setIsCreating(false)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createNewScript}
                disabled={saving || !newScript.autoscript.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Script
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