/**
 * Shared TypeScript interfaces for Scripts components
 */

export interface AutoScript {
  autoscript: string;
  description: string;
  scriptlanguage: string;
  active: boolean;
  status: string;
  source: string;
  autoscriptid?: number;
}

export interface ApiResponse {
  success: boolean;
  data: {
    member: AutoScript[];
  };
  source: string;
}

export interface ScriptLanguage {
  value: string;
  label: string;
  template: string;
}

export interface StatusMessageProps {
  type: "success" | "error" | "info" | null;
  message: string;
  onRetry?: () => void;
}

export interface ApiConfigCardProps {
  serverUrl: string;
  apiKey: string;
  onServerUrlChange: (url: string) => void;
  onApiKeyChange: (key: string) => void;
  onSave: () => void;
  onClear?: () => void;
}

export interface ScriptCardProps {
  script: AutoScript;
  onView: (script: AutoScript) => void;
  onDownload: (script: AutoScript) => void;
}

export interface ScriptsListProps {
  scripts: AutoScript[];
  loading: boolean;
  lastRefreshed: string;
  onRefresh: () => void;
  onCreate: () => void;
  onViewScript: (script: AutoScript) => void;
  onDownloadScript: (script: AutoScript) => void;
}

export interface ScriptEditorModalProps {
  script: AutoScript;
  isOpen: boolean;
  onClose: () => void;
  onSave: (source: string) => Promise<void>;
  onDownload: (script: AutoScript) => void;
  saving: boolean;
}

export interface CreateScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (script: NewScriptData) => Promise<void>;
  saving: boolean;
  scriptLanguages: ScriptLanguage[];
}

export interface NewScriptData {
  autoscript: string;
  description: string;
  scriptlanguage: string;
  source: string;
}

export interface ScriptFilters {
  searchQuery: string;
  language: string;
  activeStatus: string;
}

export interface OptimizationSuggestion {
  category: "Performance" | "Code Quality" | "Best Practices" | "Security" | "Error Handling" | "Maintainability";
  priority: "High" | "Medium" | "Low";
  title: string;
  description: string;
  currentCode?: string;
  suggestedCode?: string;
  lineNumber?: number;
}

export interface OptimizationResponse {
  success: boolean;
  scriptId: string;
  scriptLanguage: string;
  suggestions: OptimizationSuggestion[];
  totalSuggestions: number;
  analyzedAt: string;
  error?: string;
}

// Made with Bob
