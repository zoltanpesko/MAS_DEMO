import React, { memo, useCallback } from "react";
import { FileCode, Download } from "lucide-react";
import { ScriptCardProps } from "./types";

/**
 * Individual script card component
 * Displays script information with status badges and action buttons
 */
export const ScriptCard: React.FC<ScriptCardProps> = memo(({
  script,
  onView,
  onDownload,
}) => {
  const handleView = useCallback(() => {
    onView(script);
  }, [script, onView]);

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(script);
  }, [script, onDownload]);

  return (
    <div
      className="bg-gray-800/50 border border-white/10 rounded-lg p-4 hover:bg-gray-800/70 transition-all cursor-pointer group focus-within:ring-2 focus-within:ring-indigo-500"
      onClick={handleView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleView();
        }
      }}
      aria-label={`View script ${script.autoscript}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileCode className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
            {script.autoscript}
          </h4>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ml-2 ${
            script.active
              ? "bg-green-500/30 text-green-200"
              : "bg-gray-500/30 text-gray-200"
          }`}
          aria-label={script.active ? "Active script" : "Inactive script"}
        >
          {script.active ? "Active" : "Inactive"}
        </span>
      </div>
      
      <p className="text-sm text-white/60 mb-3 line-clamp-2" title={script.description || "No description"}>
        {script.description || "No description"}
      </p>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/40" aria-label={`Language: ${script.scriptlanguage || "Unknown"}`}>
          {script.scriptlanguage || "Unknown"}
        </span>
        <button
          onClick={handleDownload}
          className="p-1 hover:bg-white/10 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title="Download script"
          aria-label={`Download ${script.autoscript}`}
        >
          <Download className="w-4 h-4 text-white/60" />
        </button>
      </div>
    </div>
  );
});

ScriptCard.displayName = "ScriptCard";

// Made with Bob
