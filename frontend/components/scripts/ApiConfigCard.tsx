import React, { memo } from "react";
import { Settings, Save, Trash2, AlertTriangle } from "lucide-react";
import { ApiConfigCardProps } from "./types";

/**
 * API Configuration Card component
 * Handles API key and server URL inputs with localStorage persistence
 */
export const ApiConfigCard: React.FC<ApiConfigCardProps> = memo(({
  serverUrl,
  apiKey,
  onServerUrlChange,
  onApiKeyChange,
  onSave,
  onClear,
}) => {
  const hasCredentials = serverUrl || apiKey;

  return (
    <div className="bg-gray-900/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-white/80" />
        <h3 className="text-lg font-semibold text-white">
          API Configuration
        </h3>
      </div>

      {/* Security Warning */}
      <div className="mb-4 p-3 bg-yellow-500/20 border-l-4 border-yellow-500 rounded-r text-yellow-200 text-sm flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Security Notice</p>
          <p className="text-xs mt-1 text-yellow-200/80">
            Credentials are stored in browser localStorage. For production use, consider more secure storage methods.
          </p>
        </div>
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
            onChange={(e) => onServerUrlChange(e.target.value)}
            placeholder="https://your-maximo-instance.com"
            className="w-full px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
            aria-label="Maximo Server URL"
            aria-required="true"
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
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Your API Key"
            className="w-full px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
            aria-label="API Key"
            aria-required="true"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          aria-label="Save API configuration"
        >
          <Save className="w-4 h-4" />
          Save Configuration
        </button>
        
        {onClear && hasCredentials && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label="Clear stored credentials"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
});

ApiConfigCard.displayName = "ApiConfigCard";

// Made with Bob
