import React, { memo, useState, useEffect, useCallback, useRef } from "react";
import { X, Check, RefreshCw, Plus } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { CreateScriptModalProps, NewScriptData } from "./types";

/**
 * Create Script Modal component
 * Modal for creating new automation scripts with form validation
 */
export const CreateScriptModal: React.FC<CreateScriptModalProps> = memo(({
  isOpen,
  onClose,
  onCreate,
  saving,
  scriptLanguages,
}) => {
  const [formData, setFormData] = useState<NewScriptData>({
    autoscript: "",
    description: "",
    scriptlanguage: "python",
    source: "# Write your Python code here\n\n",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        autoscript: "",
        description: "",
        scriptlanguage: "python",
        source: "# Write your Python code here\n\n",
      });
      setErrors({});
      // Focus first input
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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

  const handleLanguageChange = useCallback((lang: string) => {
    const langConfig = scriptLanguages.find(l => l.value === lang);
    setFormData(prev => ({
      ...prev,
      scriptlanguage: lang,
      source: langConfig?.template || "// Write your code here\n\n"
    }));
  }, [scriptLanguages]);

  const validateForm = useCallback((): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.autoscript.trim()) {
      newErrors.autoscript = "Script name is required";
    } else if (!/^[A-Z0-9_]+$/.test(formData.autoscript)) {
      newErrors.autoscript = "Script name must contain only uppercase letters, numbers, and underscores";
    }

    if (!formData.source.trim()) {
      newErrors.source = "Source code cannot be empty";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    await onCreate(formData);
  }, [formData, validateForm, onCreate]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-gray-900 rounded-lg shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 
            id="create-modal-title"
            className="text-2xl font-bold text-white flex items-center gap-2"
          >
            <Plus className="w-6 h-6 text-green-400" />
            Create New Automation Script
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-white/80" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Script Name */}
          <div>
            <label 
              htmlFor="script-name"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Script Name <span className="text-red-400">*</span>
            </label>
            <input
              ref={firstInputRef}
              type="text"
              id="script-name"
              value={formData.autoscript}
              onChange={(e) => setFormData({ ...formData, autoscript: e.target.value.toUpperCase() })}
              placeholder="MY_CUSTOM_SCRIPT"
              className={`w-full px-4 py-2 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40 ${
                errors.autoscript ? "border-red-500" : "border-white/20"
              }`}
              aria-required="true"
              aria-invalid={!!errors.autoscript}
              aria-describedby={errors.autoscript ? "name-error" : undefined}
            />
            {errors.autoscript && (
              <p id="name-error" className="mt-1 text-sm text-red-400" role="alert">
                {errors.autoscript}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label 
              htmlFor="script-description"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Description
            </label>
            <input
              type="text"
              id="script-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what this script does"
              className="w-full px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
            />
          </div>

          {/* Language */}
          <div>
            <label 
              htmlFor="script-language"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Language <span className="text-red-400">*</span>
            </label>
            <select
              id="script-language"
              value={formData.scriptlanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white"
              aria-required="true"
            >
              {scriptLanguages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Source Code */}
          <div>
            <label 
              htmlFor="script-source"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Source Code <span className="text-red-400">*</span>
            </label>
            <div 
              className={`border rounded-lg overflow-hidden ${
                errors.source ? "border-red-500" : "border-white/20"
              }`} 
              style={{ height: '400px' }}
            >
              <CodeMirror
                value={formData.source}
                height="400px"
                theme={vscodeDark}
                extensions={getLanguageExtension(formData.scriptlanguage)}
                onChange={(value) => setFormData({ ...formData, source: value })}
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
            {errors.source && (
              <p className="mt-1 text-sm text-red-400" role="alert">
                {errors.source}
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.autoscript.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label={saving ? "Creating script" : "Create script"}
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
  );
});

CreateScriptModal.displayName = "CreateScriptModal";

// Made with Bob
