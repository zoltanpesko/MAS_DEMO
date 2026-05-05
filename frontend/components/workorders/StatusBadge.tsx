import React, { memo } from "react";

interface StatusBadgeProps {
  status?: string;
}

/**
 * Memoized work order status badge with color-coded states
 */
export const StatusBadge: React.FC<StatusBadgeProps> = memo(({ status }) => {
  const normalizedStatus = status?.toUpperCase() || "UNKNOWN";

  const getStatusStyles = () => {
    switch (normalizedStatus) {
      case "WAPPR":
        return "bg-yellow-500/20 text-yellow-200 border border-yellow-500/30";
      case "APPR":
        return "bg-blue-500/20 text-blue-200 border border-blue-500/30";
      case "INPRG":
        return "bg-indigo-500/20 text-indigo-200 border border-indigo-500/30";
      case "COMP":
        return "bg-green-500/20 text-green-200 border border-green-500/30";
      case "CLOSE":
        return "bg-gray-500/20 text-gray-200 border border-gray-500/30";
      case "CAN":
        return "bg-red-500/20 text-red-200 border border-red-500/30";
      default:
        return "bg-white/10 text-white/70 border border-white/20";
    }
  };

  return (
    <span
      className={`px-2.5 py-1 rounded text-xs font-semibold ${getStatusStyles()}`}
      aria-label={`Status: ${normalizedStatus}`}
    >
      {normalizedStatus}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

// Made with Bob