import React, { memo, useCallback } from "react";
import { AlertCircle, Building2, Calendar, DollarSign, MapPin, User, Wrench } from "lucide-react";
import { WorkOrderCardProps } from "./types";
import { StatusBadge } from "./StatusBadge";

/**
 * Individual work order card component
 * Displays work order details with status and scheduling information
 */
export const WorkOrderCard: React.FC<WorkOrderCardProps> = memo(({
  workOrder,
  onView,
}) => {
  const handleView = useCallback(() => {
    onView(workOrder);
  }, [workOrder, onView]);

  const formatDate = useCallback((date?: string) => {
    if (!date) return "Not scheduled";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString();
  }, []);

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
      aria-label={`View work order ${workOrder.wonum}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Wrench className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
              {workOrder.wonum}
            </h4>
            <p className="text-xs text-white/50 truncate">
              {workOrder.worktype || "No type"}
            </p>
          </div>
        </div>
        <StatusBadge status={workOrder.status} />
      </div>

      <p
        className="text-sm text-white/70 mb-4 line-clamp-2"
        title={workOrder.description || "No description"}
      >
        {workOrder.description || "No description"}
      </p>

      <div className="flex items-center gap-2 mb-3 text-sm text-white/60">
        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
        <span aria-label={`Priority ${workOrder.priority ?? workOrder.wopriority ?? "Not set"}`}>
          Priority: {workOrder.priority ?? workOrder.wopriority ?? "Not set"}
        </span>
      </div>

      {(workOrder.assetnum || workOrder.location) && (
        <div className="space-y-2 mb-3 text-sm text-white/60">
          {workOrder.assetnum && (
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-white/40 flex-shrink-0" />
              <span className="truncate" title={workOrder.assetnum}>
                Asset: {workOrder.assetnum}
              </span>
            </div>
          )}
          {workOrder.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-white/40 flex-shrink-0" />
              <span className="truncate" title={workOrder.location}>
                Location: {workOrder.location}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 text-xs text-white/50">
        {/* Organizational Info */}
        {(workOrder.siteid || workOrder.orgid) && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-300 flex-shrink-0" />
            <span className="truncate">
              {workOrder.siteid && `Site: ${workOrder.siteid}`}
              {workOrder.siteid && workOrder.orgid && " • "}
              {workOrder.orgid && `Org: ${workOrder.orgid}`}
            </span>
          </div>
        )}
        
        {/* Scheduling */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-300 flex-shrink-0" />
          <span>Start: {formatDate(workOrder.schedstart || workOrder.targstartdate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-300 flex-shrink-0" />
          <span>Finish: {formatDate(workOrder.schedfinish || workOrder.targcompdate)}</span>
        </div>
        
        {/* Personnel */}
        {(workOrder.lead || workOrder.supervisor || workOrder.owner || workOrder.reportedby) && (
          <div className="flex items-center gap-2 pt-1">
            <User className="w-4 h-4 text-white/40 flex-shrink-0" />
            <span className="truncate" title={workOrder.lead || workOrder.supervisor || workOrder.owner || workOrder.reportedby}>
              {workOrder.lead || workOrder.supervisor || workOrder.owner || workOrder.reportedby}
            </span>
          </div>
        )}
        
        {/* Cost Information */}
        {(workOrder.estlabcost || workOrder.actlabcost) && (
          <div className="flex items-center gap-2 pt-1 border-t border-white/5 mt-2 pt-2">
            <DollarSign className="w-4 h-4 text-green-300 flex-shrink-0" />
            <span className="truncate">
              {workOrder.actlabcost
                ? `Actual: $${workOrder.actlabcost.toLocaleString()}`
                : workOrder.estlabcost
                ? `Est: $${workOrder.estlabcost.toLocaleString()}`
                : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

WorkOrderCard.displayName = "WorkOrderCard";

// Made with Bob