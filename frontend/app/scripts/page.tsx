"use client";

import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  StatusMessage,
  ApiConfigCard,
  ScriptsList,
  ScriptEditorModal,
  CreateScriptModal,
  AutoScript,
  ScriptLanguage,
  NewScriptData,
  useScripts,
  useUpdateScript,
  useCreateScript,
} from "@/components/scripts";

// All supported script languages in Maximo
const SCRIPT_LANGUAGES: ScriptLanguage[] = [
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

export default function ScriptsPage() {
  // API Configuration State
  const [serverUrl, setServerUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [shouldFetch, setShouldFetch] = useState(false);

  // Status State
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  // Modal State
  const [selectedScript, setSelectedScript] = useState<AutoScript | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // React Query hooks
  const { 
    data: scripts = [], 
    isLoading, 
    error, 
    refetch,
    dataUpdatedAt 
  } = useScripts({ 
    serverUrl, 
    apiKey, 
    enabled: shouldFetch 
  });

  const updateScriptMutation = useUpdateScript();
  const createScriptMutation = useCreateScript();

  // Load saved configuration on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem("mas_server_url") || "";
    const savedKey = localStorage.getItem("mas_api_key") || "";
    setServerUrl(savedUrl);
    setApiKey(savedKey);
  }, []);

  // Handle query errors
  useEffect(() => {
    if (error) {
      setStatus({
        type: "error",
        message: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }, [error]);

  // Handle successful data fetch
  useEffect(() => {
    if (scripts.length > 0 && !isLoading && !error) {
      const lastRefreshed = new Date(dataUpdatedAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setStatus({
        type: "success",
        message: `✅ Successfully loaded ${scripts.length} automation scripts`,
      });
    }
  }, [scripts.length, isLoading, error, dataUpdatedAt]);

  // Format last refreshed time
  const lastRefreshed = dataUpdatedAt 
    ? new Date(dataUpdatedAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : "";

  // Save API configuration
  const saveConfig = useCallback(() => {
    localStorage.setItem("mas_server_url", serverUrl);
    localStorage.setItem("mas_api_key", apiKey);
    setStatus({
      type: "success",
      message: "✅ Configuration saved successfully!",
    });
    setTimeout(() => setStatus({ type: null, message: "" }), 3000);
  }, [serverUrl, apiKey]);

  // Clear API configuration
  const clearConfig = useCallback(() => {
    localStorage.removeItem("mas_server_url");
    localStorage.removeItem("mas_api_key");
    setServerUrl("");
    setApiKey("");
    setShouldFetch(false);
    setStatus({
      type: "info",
      message: "🗑️ Configuration cleared",
    });
    setTimeout(() => setStatus({ type: null, message: "" }), 3000);
  }, []);

  // Load scripts from API
  const loadScripts = useCallback(async () => {
    if (!serverUrl || !apiKey) {
      setStatus({
        type: "error",
        message: "⚠️ Please configure API settings first",
      });
      return;
    }

    setStatus({ type: "info", message: "⏳ Loading automation scripts..." });
    setShouldFetch(true);
    await refetch();
  }, [serverUrl, apiKey, refetch]);

  // Download script
  const downloadScript = useCallback((script: AutoScript) => {
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
  }, []);

  // Save script changes
  const saveScript = useCallback(async (source: string) => {
    if (!selectedScript) return;

    setStatus({
      type: "info",
      message: `⏳ Saving ${selectedScript.autoscript}...`,
    });

    try {
      await updateScriptMutation.mutateAsync({
        scriptId: selectedScript.autoscript,
        source,
        serverUrl,
        apiKey,
      });

      setSelectedScript({ ...selectedScript, source });
      setStatus({
        type: "success",
        message: `✅ Script saved successfully!`,
      });
      setTimeout(() => setStatus({ type: null, message: "" }), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setStatus({ type: "error", message: `❌ Save error: ${errorMessage}` });
    }
  }, [selectedScript, serverUrl, apiKey, updateScriptMutation]);

  // Create new script
  const createNewScript = useCallback(async (newScript: NewScriptData) => {
    setStatus({
      type: "info",
      message: `⏳ Creating ${newScript.autoscript}...`,
    });

    try {
      await createScriptMutation.mutateAsync({
        ...newScript,
        serverUrl,
        apiKey,
      });

      setStatus({
        type: "success",
        message: `✅ Script created successfully!`,
      });
      setIsCreating(false);
      setTimeout(() => setStatus({ type: null, message: "" }), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setStatus({ type: "error", message: `❌ Create error: ${errorMessage}` });
    }
  }, [serverUrl, apiKey, createScriptMutation]);

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
          <ApiConfigCard
            serverUrl={serverUrl}
            apiKey={apiKey}
            onServerUrlChange={setServerUrl}
            onApiKeyChange={setApiKey}
            onSave={saveConfig}
            onClear={clearConfig}
          />

          {/* Status Messages */}
          {status.message && (
            <div className="mt-6">
              <StatusMessage
                type={status.type}
                message={status.message}
                onRetry={status.type === "error" ? loadScripts : undefined}
              />
            </div>
          )}

          {/* Scripts List */}
          <div className="mt-6">
            <ScriptsList
              scripts={scripts}
              loading={isLoading}
              lastRefreshed={lastRefreshed}
              onRefresh={loadScripts}
              onCreate={() => setIsCreating(true)}
              onViewScript={setSelectedScript}
              onDownloadScript={downloadScript}
            />
          </div>
        </div>
      </div>

      {/* Script Editor Modal */}
      {selectedScript && (
        <ScriptEditorModal
          script={selectedScript}
          isOpen={!!selectedScript}
          onClose={() => setSelectedScript(null)}
          onSave={saveScript}
          onDownload={downloadScript}
          saving={updateScriptMutation.isPending}
        />
      )}

      {/* Create New Script Modal */}
      <CreateScriptModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onCreate={createNewScript}
        saving={createScriptMutation.isPending}
        scriptLanguages={SCRIPT_LANGUAGES}
      />
    </div>
  );
}

// Made with Bob
