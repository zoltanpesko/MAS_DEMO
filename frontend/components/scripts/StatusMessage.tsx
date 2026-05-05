import React from "react";
import { AlertCircle, CheckCircle, Info, RefreshCw } from "lucide-react";
import { StatusMessageProps } from "./types";

/**
 * Reusable status/error display component with optional retry functionality
 */
export const StatusMessage: React.FC<StatusMessageProps> = ({
  type,
  message,
  onRetry,
}) => {
  if (!type || !message) return null;

  const getStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-500/20",
          border: "border-green-500",
          text: "text-green-200",
          icon: <CheckCircle className="w-5 h-5" />,
        };
      case "error":
        return {
          bg: "bg-red-500/20",
          border: "border-red-500",
          text: "text-red-200",
          icon: <AlertCircle className="w-5 h-5" />,
        };
      case "info":
        return {
          bg: "bg-blue-500/20",
          border: "border-blue-500",
          text: "text-blue-200",
          icon: <Info className="w-5 h-5" />,
        };
      default:
        return {
          bg: "bg-gray-500/20",
          border: "border-gray-500",
          text: "text-gray-200",
          icon: <Info className="w-5 h-5" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`p-4 rounded-lg border-l-4 backdrop-blur-sm ${styles.bg} ${styles.border} ${styles.text} flex items-start justify-between gap-3`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
        <p className="flex-1">{message}</p>
      </div>
      {onRetry && type === "error" && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors text-sm font-medium flex items-center gap-1"
          aria-label="Retry action"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
};

// Made with Bob
