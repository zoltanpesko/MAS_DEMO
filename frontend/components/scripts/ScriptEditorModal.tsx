import React, { memo, useState, useEffect, useCallback, useRef } from "react";
import { X, Save, Download, RefreshCw, FileCode, Sparkles, AlertCircle, CheckCircle, Info } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { ScriptEditorModalProps, OptimizationSuggestion } from "./types";
import { useOptimizeScript } from "./hooks";

/**
 * Script Editor Modal component
 * Full-screen modal with CodeMirror editor for viewing and editing scripts
 */
export const ScriptEditorModal: React.FC<ScriptEditorModalProps> = memo(({
  script,
  isOpen,
  onClose,
  onSave,
  onDownload,
  saving,
}) => {
  const [editedSource, setEditedSource] = useState(script.source || "");
  const [fontSize, setFontSize] = useState(14);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationSuggestion[] | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const optimizeMutation = useOptimizeScript();

  // Update edited source when script changes
  useEffect(() => {
    setEditedSource(script.source || "");
  }, [script.source]);

  // Focus trap and escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTabKey);
    
    // Focus close button on open
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTabKey);
    };
  }, [isOpen, onClose]);

  // Get language extension for CodeMirror
  const getLanguageExtension = useCallback((lang: string) => {
    const lowerLang = lang?.toLowerCase() || "";
    if (lowerLang.includes("python") || lowerLang.includes("jython")) {
      return [python()];
    }
    return [javascript()];
  }, []);

  const handleSave = useCallback(async () => {
    await onSave(editedSource);
  }, [editedSource, onSave]);

  const handleDownload = useCallback(() => {
    onDownload(script);
  }, [script, onDownload]);

  const handleOptimize = useCallback(async () => {
    try {
      const result = await optimizeMutation.mutateAsync({ script });
      setOptimizationResults(result.suggestions);
      setShowOptimizations(true);
    } catch (error) {
      console.error("Optimization error:", error);
    }
  }, [script, optimizeMutation]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "High":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "Medium":
        return <Info className="w-4 h-4 text-yellow-400" />;
      case "Low":
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Performance":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "Security":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "Error Handling":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "Code Quality":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "Best Practices":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "Maintainability":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const hasChanges = editedSource !== script.source;
  const lineCount = editedSource.split('\n').length;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-gray-900 rounded-lg shadow-2xl border border-white/20 w-full max-w-[95vw] h-[95vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 
              id="modal-title"
              className="text-2xl font-bold text-white flex items-center gap-2"
            >
              <FileCode className="w-6 h-6 text-indigo-400" />
              {script.autoscript}
            </h2>
            <p className="text-sm text-white/60 mt-1">
              {script.description || "No description"}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close editor"
          >
            <X className="w-6 h-6 text-white/80" />
          </button>
        </div>

        {/* Modal Body - Code Editor and Optimizations */}
        <div className="flex-1 overflow-hidden p-6 flex gap-4">
          {/* Left Side - Code Editor */}
          <div className="flex-1 flex flex-col gap-4">
          {/* Font Size Controls */}
          <div className="flex items-center gap-4 px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg">
            <span className="text-sm text-white/60">Font Size:</span>
            <button
              onClick={() => setFontSize(Math.max(10, fontSize - 2))}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Decrease font size"
              aria-label="Decrease font size"
            >
              A-
            </button>
            <span className="text-sm text-white font-mono min-w-[3rem] text-center">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize(Math.min(24, fontSize + 2))}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Increase font size"
              aria-label="Increase font size"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize(14)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Reset to default"
              aria-label="Reset font size to default"
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
              extensions={getLanguageExtension(script.scriptlanguage)}
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

          {/* Right Side - Optimization Suggestions */}
          {showOptimizations && (
            <div className="w-96 flex flex-col gap-4 border-l border-white/10 pl-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Optimization Suggestions
                </h3>
                <button
                  onClick={() => setShowOptimizations(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  aria-label="Close suggestions"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {optimizeMutation.isPending ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                  <span className="ml-2 text-white/60">Analyzing script...</span>
                </div>
              ) : optimizeMutation.isError ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-300 text-sm">
                    Failed to analyze script. Please try again.
                  </p>
                </div>
              ) : optimizationResults && optimizationResults.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-3">
                  {optimizationResults.map((suggestion, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/50 border border-white/10 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(suggestion.priority)}
                          <span className="font-semibold text-white text-sm">
                            {suggestion.title}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded border ${getCategoryColor(suggestion.category)}`}>
                          {suggestion.category}
                        </span>
                      </div>
                      
                      <p className="text-sm text-white/70">
                        {suggestion.description}
                      </p>

                      {suggestion.lineNumber && (
                        <p className="text-xs text-white/50">
                          Line {suggestion.lineNumber}
                        </p>
                      )}

                      {suggestion.currentCode && (
                        <div className="space-y-1">
                          <p className="text-xs text-white/50">Current:</p>
                          <pre className="bg-gray-900/50 border border-white/10 rounded p-2 text-xs text-white/80 overflow-x-auto">
                            {suggestion.currentCode}
                          </pre>
                        </div>
                      )}

                      {suggestion.suggestedCode && (
                        <div className="space-y-1">
                          <p className="text-xs text-green-400">Suggested:</p>
                          <pre className="bg-gray-900/50 border border-green-500/30 rounded p-2 text-xs text-green-300 overflow-x-auto">
                            {suggestion.suggestedCode}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-300 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    No optimization suggestions found. Script looks good!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>Language: {script.scriptlanguage}</span>
            <span>Status: {script.status}</span>
            <span>Lines: {lineCount}</span>
            {hasChanges && (
              <span className="text-yellow-400 font-semibold">• Unsaved changes</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOptimize}
              disabled={optimizeMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label={optimizeMutation.isPending ? "Analyzing script" : "Optimize script"}
            >
              {optimizeMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Optimize
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Download script"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label={saving ? "Saving changes" : "Save changes"}
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
  );
});

ScriptEditorModal.displayName = "ScriptEditorModal";

// Made with Bob
