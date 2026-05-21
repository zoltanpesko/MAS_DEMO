import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import { X, Edit, Save, RefreshCw, AlertCircle, CheckCircle, Info, ChevronDown, ChevronUp, FileCode } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { GeneratedScriptPreviewProps } from "./types";

/**
 * Generated Script Preview component
 * Displays the generated script with analysis, warnings, and suggestions
 */
export const GeneratedScriptPreview: React.FC<GeneratedScriptPreviewProps> = memo(({
  isOpen,
  onClose,
  generatedScript,
  onEditInEditor,
  onSaveToMaximo,
  onRegenerate,
  saving,
}) => {
  const [showWarnings, setShowWarnings] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
    if (lang === "python") {
      return [python()];
    }
    return [javascript()];
  }, []);

  const handleEditInEditor = useCallback(() => {
    onEditInEditor(generatedScript);
  }, [generatedScript, onEditInEditor]);

  const handleSaveToMaximo = useCallback(async () => {
    await onSaveToMaximo(generatedScript);
  }, [generatedScript, onSaveToMaximo]);

  const getWarningIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getWarningColor = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-500/10 border-red-500/30 text-red-300";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-300";
      case "info":
        return "bg-blue-500/10 border-blue-500/30 text-blue-300";
      default:
        return "bg-gray-500/10 border-gray-500/30 text-gray-300";
    }
  };

  // Calculate complexity metrics
  const lineCount = generatedScript.source.split('\n').length;
  const warnings = generatedScript.warnings || [];
  const errors = warnings.filter(w => w.type === 'error');
  const warningItems = warnings.filter(w => w.type === 'warning');
  const suggestions = warnings.filter(w => w.type === 'info');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-gray-900 rounded-lg shadow-2xl border border-white/20 w-full max-w-[95vw] h-[95vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 
              id="preview-modal-title"
              className="text-2xl font-bold text-white flex items-center gap-2"
            >
              <FileCode className="w-6 h-6 text-green-400" />
              Generated Script Preview
            </h2>
            <p className="text-sm text-white/60 mt-1">
              {generatedScript.scriptName} - {generatedScript.description}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close preview"
          >
            <X className="w-6 h-6 text-white/80" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden p-6 flex gap-4">
          {/* Left Side - Code Preview */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Analysis Info */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
                <p className="text-xs text-white/60 mb-1">Original Class</p>
                <p className="text-lg font-semibold text-white truncate">
                  {generatedScript.metadata.originalClassName}
                </p>
              </div>
              <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
                <p className="text-xs text-white/60 mb-1">Language</p>
                <p className="text-lg font-semibold text-white capitalize">
                  {generatedScript.scriptLanguage}
                </p>
              </div>
              <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
                <p className="text-xs text-white/60 mb-1">Lines of Code</p>
                <p className="text-lg font-semibold text-white">
                  {lineCount}
                </p>
              </div>
              <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
                <p className="text-xs text-white/60 mb-1">Issues</p>
                <p className="text-lg font-semibold text-white">
                  {errors.length > 0 ? (
                    <span className="text-red-400">{errors.length} Error{errors.length !== 1 ? 's' : ''}</span>
                  ) : warningItems.length > 0 ? (
                    <span className="text-yellow-400">{warningItems.length} Warning{warningItems.length !== 1 ? 's' : ''}</span>
                  ) : (
                    <span className="text-green-400">None</span>
                  )}
                </p>
              </div>
            </div>

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

            {/* Code Preview */}
            <div className="flex-1 overflow-hidden border border-white/20 rounded-lg">
              <CodeMirror
                value={generatedScript.source}
                height="100%"
                theme={vscodeDark}
                extensions={getLanguageExtension(generatedScript.scriptLanguage)}
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  highlightSpecialChars: true,
                  foldGutter: true,
                  drawSelection: false,
                  dropCursor: false,
                  allowMultipleSelections: false,
                  indentOnInput: false,
                  bracketMatching: true,
                  closeBrackets: false,
                  autocompletion: false,
                  rectangularSelection: false,
                  crosshairCursor: false,
                  highlightActiveLine: false,
                  highlightSelectionMatches: false,
                  closeBracketsKeymap: false,
                  searchKeymap: true,
                  foldKeymap: true,
                  completionKeymap: false,
                  lintKeymap: false,
                }}
                style={{
                  fontSize: `${fontSize}px`,
                  height: "100%",
                }}
              />
            </div>
          </div>

          {/* Right Side - Warnings and Suggestions */}
          <div className="w-96 flex flex-col gap-4 border-l border-white/10 pl-6 overflow-y-auto">
            {/* Warnings Section */}
            {(errors.length > 0 || warningItems.length > 0) && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowWarnings(!showWarnings)}
                  className="w-full flex items-center justify-between p-3 bg-gray-800/50 border border-white/10 rounded-lg hover:bg-gray-800/70 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    Warnings ({errors.length + warningItems.length})
                  </h3>
                  {showWarnings ? (
                    <ChevronUp className="w-5 h-5 text-white/60" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/60" />
                  )}
                </button>

                {showWarnings && (
                  <div className="space-y-2">
                    {[...errors, ...warningItems].map((warning, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-3 space-y-2 ${getWarningColor(warning.type)}`}
                      >
                        <div className="flex items-start gap-2">
                          {getWarningIcon(warning.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {warning.message}
                            </p>
                            {warning.line && (
                              <p className="text-xs opacity-70 mt-1">
                                Line {warning.line}
                              </p>
                            )}
                            {warning.suggestion && (
                              <p className="text-xs mt-2 opacity-90">
                                💡 {warning.suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Suggestions Section */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="w-full flex items-center justify-between p-3 bg-gray-800/50 border border-white/10 rounded-lg hover:bg-gray-800/70 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-400" />
                    Suggestions ({suggestions.length})
                  </h3>
                  {showSuggestions ? (
                    <ChevronUp className="w-5 h-5 text-white/60" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/60" />
                  )}
                </button>

                {showSuggestions && (
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-3 space-y-2 ${getWarningColor(suggestion.type)}`}
                      >
                        <div className="flex items-start gap-2">
                          {getWarningIcon(suggestion.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {suggestion.message}
                            </p>
                            {suggestion.suggestion && (
                              <p className="text-xs mt-2 opacity-90">
                                💡 {suggestion.suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Conversion Notes */}
            {generatedScript.metadata.conversionNotes.length > 0 && (
              <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white/80 mb-2">Conversion Notes</h3>
                <ul className="space-y-1 text-xs text-white/60">
                  {generatedScript.metadata.conversionNotes.map((note, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success Message */}
            {errors.length === 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-300 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Script generated successfully! Review and edit as needed.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>Generated: {new Date(generatedScript.metadata.generatedAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Regenerate script"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
            <button
              onClick={handleSaveToMaximo}
              disabled={saving || errors.length > 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label={saving ? "Saving to Maximo" : "Save to Maximo"}
              title={errors.length > 0 ? "Fix errors before saving" : ""}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save to Maximo
                </>
              )}
            </button>
            <button
              onClick={handleEditInEditor}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Edit in editor"
            >
              <Edit className="w-4 h-4" />
              Edit in Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

GeneratedScriptPreview.displayName = "GeneratedScriptPreview";

// Made with Bob