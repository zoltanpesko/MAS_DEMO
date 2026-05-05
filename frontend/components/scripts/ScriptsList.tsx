import React, { memo, useMemo, useState } from "react";
import { Code2, RefreshCw, Plus, Search, Filter } from "lucide-react";
import { ScriptsListProps, ScriptFilters } from "./types";
import { ScriptCard } from "./ScriptCard";

/**
 * Scripts list component with search and filter functionality
 * Displays a grid of script cards with filtering options
 */
export const ScriptsList: React.FC<ScriptsListProps> = memo(({
  scripts,
  loading,
  lastRefreshed,
  onRefresh,
  onCreate,
  onViewScript,
  onDownloadScript,
}) => {
  const [filters, setFilters] = useState<ScriptFilters>({
    searchQuery: "",
    language: "all",
    activeStatus: "all",
  });

  // Get unique languages from scripts
  const languages = useMemo(() => {
    const uniqueLangs = new Set(scripts.map(s => s.scriptlanguage).filter(Boolean));
    return Array.from(uniqueLangs).sort();
  }, [scripts]);

  // Filter scripts based on search and filters
  const filteredScripts = useMemo(() => {
    return scripts.filter(script => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = script.autoscript.toLowerCase().includes(query);
        const matchesDesc = script.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      // Language filter
      if (filters.language !== "all" && script.scriptlanguage !== filters.language) {
        return false;
      }

      // Active status filter
      if (filters.activeStatus !== "all") {
        const isActive = filters.activeStatus === "active";
        if (script.active !== isActive) return false;
      }

      return true;
    });
  }, [scripts, filters]);

  return (
    <div className="bg-gray-900/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Code2 className="w-5 h-5" />
          Automation Scripts
          {filteredScripts.length !== scripts.length && (
            <span className="text-sm text-white/60">
              ({filteredScripts.length} of {scripts.length})
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label="Create new script"
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label={loading ? "Loading scripts" : "Refresh scripts"}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading..." : "Load Scripts"}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      {scripts.length > 0 && (
        <div className="mb-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search scripts by name or description..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
              aria-label="Search scripts"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">Filters:</span>
            </div>
            
            <select
              value={filters.language}
              onChange={(e) => setFilters({ ...filters, language: e.target.value })}
              className="px-3 py-1.5 bg-gray-800/50 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              aria-label="Filter by language"
            >
              <option value="all">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>

            <select
              value={filters.activeStatus}
              onChange={(e) => setFilters({ ...filters, activeStatus: e.target.value })}
              className="px-3 py-1.5 bg-gray-800/50 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {(filters.searchQuery || filters.language !== "all" || filters.activeStatus !== "all") && (
              <button
                onClick={() => setFilters({ searchQuery: "", language: "all", activeStatus: "all" })}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                aria-label="Clear all filters"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Last Refreshed */}
      {lastRefreshed && (
        <div className="mb-4 p-3 bg-indigo-500/20 border-l-4 border-indigo-500 text-sm text-indigo-200 backdrop-blur-sm">
          🕒 Last Refreshed: {lastRefreshed}
        </div>
      )}

      {/* Scripts Grid */}
      {filteredScripts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScripts.map((script, index) => (
            <ScriptCard
              key={script.autoscriptid || index}
              script={script}
              onView={onViewScript}
              onDownload={onDownloadScript}
            />
          ))}
        </div>
      ) : scripts.length > 0 ? (
        <div className="text-center py-12 text-white/60">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No scripts match your filters</p>
          <button
            onClick={() => setFilters({ searchQuery: "", language: "all", activeStatus: "all" })}
            className="mt-2 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
});

ScriptsList.displayName = "ScriptsList";

// Made with Bob
