import React, { memo, useState, useEffect, useCallback, useRef } from "react";
import { X, Upload, FileCode, AlertCircle, RefreshCw, Check } from "lucide-react";
import { JavaUploadModalProps } from "./types";

/**
 * Java Upload Modal component
 * Modal for uploading Java files or pasting Java code to generate Maximo scripts
 */
export const JavaUploadModal: React.FC<JavaUploadModalProps> = memo(({
  isOpen,
  onClose,
  onGenerate,
  generating,
}) => {
  const [javaSource, setJavaSource] = useState("");
  const [fileName, setFileName] = useState("");
  const [targetLanguage, setTargetLanguage] = useState<"python" | "javascript">("python");
  const [includeComments, setIncludeComments] = useState(true);
  const [applyBestPractices, setApplyBestPractices] = useState(true);
  const [includeImports, setIncludeImports] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setJavaSource("");
      setFileName("");
      setTargetLanguage("python");
      setIncludeComments(true);
      setApplyBestPractices(true);
      setIncludeImports(true);
      setErrors({});
      setIsDragging(false);
      // Focus textarea
      setTimeout(() => textareaRef.current?.focus(), 100);
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

  const validateForm = useCallback((): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!javaSource.trim()) {
      newErrors.javaSource = "Java source code is required";
    } else if (!javaSource.includes("class") && !javaSource.includes("interface")) {
      newErrors.javaSource = "Invalid Java code: must contain a class or interface definition";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [javaSource]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith(".java")) {
      setErrors({ file: "Please select a .java file" });
      return;
    }

    setFileName(file.name);
    setErrors({});

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJavaSource(content);
    };
    reader.onerror = () => {
      setErrors({ file: "Failed to read file" });
    };
    reader.readAsText(file);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    await onGenerate({
      javaSource,
      options: {
        targetLanguage,
        includeComments,
        includeImports,
        applyMaximoBestPractices: applyBestPractices,
        generateDescription: true,
      },
    });
  }, [javaSource, targetLanguage, includeComments, includeImports, applyBestPractices, validateForm, onGenerate]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="java-upload-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-gray-900 rounded-lg shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 
            id="java-upload-modal-title"
            className="text-2xl font-bold text-white flex items-center gap-2"
          >
            <FileCode className="w-6 h-6 text-blue-400" />
            Generate Script from Java
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
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Upload Java File or Paste Code <span className="text-red-400">*</span>
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isDragging
                  ? "border-blue-500 bg-blue-500/10"
                  : errors.file
                  ? "border-red-500 bg-red-500/5"
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-blue-400" : "text-white/40"}`} />
              <p className="text-white/80 mb-2">
                {fileName ? (
                  <span className="text-green-400 font-medium flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    {fileName}
                  </span>
                ) : (
                  "Drag and drop a .java file here"
                )}
              </p>
              <p className="text-white/60 text-sm mb-4">or</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Upload className="w-4 h-4" />
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".java"
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="Upload Java file"
              />
            </div>
            {errors.file && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" />
                {errors.file}
              </p>
            )}
          </div>

          {/* Java Code Textarea */}
          <div>
            <label 
              htmlFor="java-source"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Java Source Code <span className="text-red-400">*</span>
            </label>
            <textarea
              ref={textareaRef}
              id="java-source"
              value={javaSource}
              onChange={(e) => setJavaSource(e.target.value)}
              placeholder="Paste your Java class code here..."
              className={`w-full h-64 px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40 font-mono text-sm resize-none ${
                errors.javaSource ? "border-red-500" : "border-white/20"
              }`}
              aria-required="true"
              aria-invalid={!!errors.javaSource}
              aria-describedby={errors.javaSource ? "source-error" : undefined}
            />
            {errors.javaSource && (
              <p id="source-error" className="mt-2 text-sm text-red-400 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" />
                {errors.javaSource}
              </p>
            )}
          </div>

          {/* Generation Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Language */}
            <div>
              <label 
                htmlFor="target-language"
                className="block text-sm font-medium text-white/80 mb-2"
              >
                Target Language <span className="text-red-400">*</span>
              </label>
              <select
                id="target-language"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value as "python" | "javascript")}
                className="w-full px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white"
                aria-required="true"
              >
                <option value="python">Python (Jython)</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>

            {/* Options Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={includeComments}
                  onChange={(e) => setIncludeComments(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-gray-800/50 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                  Include explanatory comments
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={applyBestPractices}
                  onChange={(e) => setApplyBestPractices(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-gray-800/50 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                  Apply Maximo best practices
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={includeImports}
                  onChange={(e) => setIncludeImports(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-gray-800/50 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                  Include necessary imports
                </span>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                The generator will analyze your Java class and convert it to a Maximo automation script.
                Complex Java features may require manual adjustments after generation.
              </span>
            </p>
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
            disabled={generating || !javaSource.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label={generating ? "Generating script" : "Generate script"}
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileCode className="w-4 h-4" />
                Generate Script
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

JavaUploadModal.displayName = "JavaUploadModal";

// Made with Bob