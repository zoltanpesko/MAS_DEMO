import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  DollarSign,
  MapPin,
  RefreshCw,
  Save,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useUpdateWorkOrder, useUpdateWorkOrderStatus } from "./hooks";
import { WorkOrderEditorModalProps } from "./types";
import { StatusBadge } from "./StatusBadge";

type MessageState = {
  type: "success" | "error" | null;
  message: string;
};

const STATUS_OPTIONS = ["WAPPR", "APPR", "INPRG", "COMP", "CLOSE", "CAN"];
const WORKTYPE_OPTIONS = ["", "CM", "PM", "EM"];
const PRIORITY_OPTIONS = ["", "1", "2", "3", "4", "5"];

/**
 * Work Order Editor Modal component
 * Full-screen modal for viewing and editing work order fields
 */
export const WorkOrderEditorModal: React.FC<WorkOrderEditorModalProps> = memo(({
  workOrder,
  isOpen,
  onClose,
  serverUrl,
  apiKey,
}) => {
  const [formData, setFormData] = useState({
    description: "",
    worktype: "",
    assetnum: "",
    location: "",
    priority: "",
    schedstart: "",
    schedfinish: "",
    lead: "",
    supervisor: "",
    status: "WAPPR",
  });
  const [message, setMessage] = useState<MessageState>({ type: null, message: "" });
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const updateWorkOrderMutation = useUpdateWorkOrder();
  const updateStatusMutation = useUpdateWorkOrderStatus();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        description: workOrder.description || "",
        worktype: workOrder.worktype || "",
        assetnum: workOrder.assetnum || "",
        location: workOrder.location || "",
        priority: String(workOrder.priority ?? workOrder.wopriority ?? ""),
        schedstart: toDateTimeLocal(workOrder.schedstart),
        schedfinish: toDateTimeLocal(workOrder.schedfinish),
        lead: workOrder.lead || "",
        supervisor: workOrder.supervisor || "",
        status: workOrder.status || "WAPPR",
      });
      setMessage({ type: null, message: "" });
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }
  }, [isOpen, workOrder]);

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

  const hasChanges = useMemo(() => {
    return (
      formData.description !== (workOrder.description || "") ||
      formData.worktype !== (workOrder.worktype || "") ||
      formData.assetnum !== (workOrder.assetnum || "") ||
      formData.location !== (workOrder.location || "") ||
      formData.priority !== String(workOrder.priority ?? workOrder.wopriority ?? "") ||
      formData.schedstart !== toDateTimeLocal(workOrder.schedstart) ||
      formData.schedfinish !== toDateTimeLocal(workOrder.schedfinish) ||
      formData.lead !== (workOrder.lead || "") ||
      formData.supervisor !== (workOrder.supervisor || "") ||
      formData.status !== (workOrder.status || "WAPPR")
    );
  }, [formData, workOrder]);

  const isSaving = updateWorkOrderMutation.isPending || updateStatusMutation.isPending;

  const handleFieldChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setMessage({ type: null, message: "" });

    try {
      if (formData.description.trim() !== (workOrder.description || "")) {
        await updateWorkOrderMutation.mutateAsync({
          wonum: workOrder.wonum,
          field: "description",
          value: formData.description.trim(),
          serverUrl,
          apiKey,
        });
      }

      if (formData.worktype !== (workOrder.worktype || "")) {
        await updateWorkOrderMutation.mutateAsync({
          wonum: workOrder.wonum,
          field: "worktype",
          value: formData.worktype || null,
          serverUrl,
          apiKey,
        });
      }

      if (formData.assetnum !== (workOrder.assetnum || "")) {
        await updateWorkOrderMutation.mutateAsync({
          wonum: workOrder.wonum,
          field: "assetnum",
          value: formData.assetnum || null,
          serverUrl,
          apiKey,
        });
      }

      if (formData.location !== (workOrder.location || "")) {
        await updateWorkOrderMutation.mutateAsync({
          wonum: workOrder.wonum,
          field: "location",
          value: formData.location || null,
          serverUrl,
          apiKey,
        });
      }

      if (formData.priority !== String(workOrder.priority ?? workOrder.wopriority ?? "")) {
        await updateWorkOrderMutation.mutateAsync({
          wonum: workOrder.wonum,
          field: "priority",
          value: formData.priority ? Number(formData.priority) : null,
          serverUrl,
          apiKey,
        });
      }

      if (formData.schedstart !== toDateTimeLocal(workOrder.schedstart)) {
        await updateWorkOrderMutation.mutateAsync({
          wonum: workOrder.wonum,
          field: "schedstart",
          value: formData.schedstart ? new Date(formData.schedstart).toISOString() : null,
          serverUrl,
          apiKey,
        });
      }

      if (formData.schedfinish !== toDateTimeLocal(workOrder.schedfinish)) {
        await updateWorkOrderMutation.mutateAsync({
          wonum: workOrder.wonum,
          field: "schedfinish",
          value: formData.schedfinish ? new Date(formData.schedfinish).toISOString() : null,
          serverUrl,
          apiKey,
        });
      }

      if (formData.lead !== (workOrder.lead || "")) {
        await updateWorkOrderMutation.mutateAsync({
          wonum: workOrder.wonum,
          field: "lead",
          value: formData.lead || null,
          serverUrl,
          apiKey,
        });
      }

      if (formData.supervisor !== (workOrder.supervisor || "")) {
        await updateWorkOrderMutation.mutateAsync({
          wonum: workOrder.wonum,
          field: "supervisor",
          value: formData.supervisor || null,
          serverUrl,
          apiKey,
        });
      }

      if (formData.status !== (workOrder.status || "WAPPR")) {
        await updateStatusMutation.mutateAsync({
          wonum: workOrder.wonum,
          status: formData.status,
          serverUrl,
          apiKey,
        });
      }

      setMessage({
        type: "success",
        message: "Work order updated successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to update work order.",
      });
    }
  }, [
    apiKey,
    formData,
    serverUrl,
    updateStatusMutation,
    updateWorkOrderMutation,
    workOrder,
  ]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workorder-editor-title"
    >
      <div
        ref={modalRef}
        className="bg-gray-900 rounded-lg shadow-2xl border border-white/20 w-[95vw] h-[95vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2
              id="workorder-editor-title"
              className="text-2xl font-bold text-white flex items-center gap-2"
            >
              <Wrench className="w-6 h-6 text-indigo-400" />
              {workOrder.wonum}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={formData.status} />
              <span className="text-sm text-white/60">
                Edit work order details and scheduling
              </span>
            </div>
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

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {message.type && (
            <div
              className={`p-4 rounded-lg border-l-4 backdrop-blur-sm flex items-start gap-3 ${
                message.type === "success"
                  ? "bg-green-500/20 border-green-500 text-green-200"
                  : "bg-red-500/20 border-red-500 text-red-200"
              }`}
              role="alert"
              aria-live="polite"
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{message.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <label htmlFor="wo-description" className="block text-sm font-medium text-white/80 mb-2">
                  Description
                </label>
                <textarea
                  id="wo-description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
                  placeholder="Describe the work order"
                />
              </div>

              <div>
                <label htmlFor="wo-status" className="block text-sm font-medium text-white/80 mb-2">
                  Status
                </label>
                <select
                  id="wo-status"
                  value={formData.status}
                  onChange={(e) => handleFieldChange("status", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white"
                  aria-label="Work order status"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="wo-worktype" className="block text-sm font-medium text-white/80 mb-2">
                  Work Type
                </label>
                <select
                  id="wo-worktype"
                  value={formData.worktype}
                  onChange={(e) => handleFieldChange("worktype", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white"
                >
                  {WORKTYPE_OPTIONS.map((worktype) => (
                    <option key={worktype || "blank"} value={worktype}>
                      {worktype || "Select work type"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="wo-priority" className="block text-sm font-medium text-white/80 mb-2">
                  Priority
                </label>
                <select
                  id="wo-priority"
                  value={formData.priority}
                  onChange={(e) => handleFieldChange("priority", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white"
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority || "blank"} value={priority}>
                      {priority || "Select priority"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="wo-assetnum" className="block text-sm font-medium text-white/80 mb-2">
                  Asset Number
                </label>
                <div className="relative">
                  <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="wo-assetnum"
                    type="text"
                    value={formData.assetnum}
                    onChange={(e) => handleFieldChange("assetnum", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
                    placeholder="Asset number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="wo-location" className="block text-sm font-medium text-white/80 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="wo-location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleFieldChange("location", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
                    placeholder="Location"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="wo-schedstart" className="block text-sm font-medium text-white/80 mb-2">
                  Scheduled Start
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="wo-schedstart"
                    type="datetime-local"
                    value={formData.schedstart}
                    onChange={(e) => handleFieldChange("schedstart", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="wo-schedfinish" className="block text-sm font-medium text-white/80 mb-2">
                  Scheduled Finish
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="wo-schedfinish"
                    type="datetime-local"
                    value={formData.schedfinish}
                    onChange={(e) => handleFieldChange("schedfinish", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="wo-lead" className="block text-sm font-medium text-white/80 mb-2">
                  Lead
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="wo-lead"
                    type="text"
                    value={formData.lead}
                    onChange={(e) => handleFieldChange("lead", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
                    placeholder="Lead person"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="wo-supervisor" className="block text-sm font-medium text-white/80 mb-2">
                  Supervisor
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="wo-supervisor"
                    type="text"
                    value={formData.supervisor}
                    onChange={(e) => handleFieldChange("supervisor", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
                    placeholder="Supervisor"
                  />
                </div>
              </div>

              <div className="bg-gray-800/40 border border-white/10 rounded-lg p-4 text-sm text-white/70 space-y-2">
                <h4 className="font-semibold text-white/90 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Actual Dates
                </h4>
                <div className="flex justify-between gap-4">
                  <span>Actual Start</span>
                  <span>{formatDisplayDate(workOrder.actstart)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Actual Finish</span>
                  <span>{formatDisplayDate(workOrder.actfinish)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Current Priority</span>
                  <span>{workOrder.priority ?? workOrder.wopriority ?? "Not set"}</span>
                </div>
              </div>

              {/* MXAPIWO: Organizational Information */}
              <div className="bg-gray-800/40 border border-white/10 rounded-lg p-4 text-sm text-white/70 space-y-2">
                <h4 className="font-semibold text-white/90 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Organization
                </h4>
                <div className="flex justify-between gap-4">
                  <span>Site ID</span>
                  <span>{workOrder.siteid || "Not set"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Org ID</span>
                  <span>{workOrder.orgid || "Not set"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Owner</span>
                  <span>{workOrder.owner || "Not set"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Reported By</span>
                  <span>{workOrder.reportedby || "Not set"}</span>
                </div>
                {workOrder.reportdate && (
                  <div className="flex justify-between gap-4">
                    <span>Report Date</span>
                    <span>{formatDisplayDate(workOrder.reportdate)}</span>
                  </div>
                )}
              </div>

              {/* MXAPIWO: Cost Information */}
              {(workOrder.estlabcost || workOrder.actlabcost || workOrder.estlabhrs || workOrder.actlabhrs) && (
                <div className="bg-gray-800/40 border border-white/10 rounded-lg p-4 text-sm text-white/70 space-y-2">
                  <h4 className="font-semibold text-white/90 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Cost & Labor
                  </h4>
                  {workOrder.estlabcost && (
                    <div className="flex justify-between gap-4">
                      <span>Est. Labor Cost</span>
                      <span>${workOrder.estlabcost.toLocaleString()}</span>
                    </div>
                  )}
                  {workOrder.actlabcost && (
                    <div className="flex justify-between gap-4">
                      <span>Actual Labor Cost</span>
                      <span className="font-semibold">${workOrder.actlabcost.toLocaleString()}</span>
                    </div>
                  )}
                  {workOrder.estlabhrs && (
                    <div className="flex justify-between gap-4">
                      <span>Est. Labor Hours</span>
                      <span>{workOrder.estlabhrs.toLocaleString()} hrs</span>
                    </div>
                  )}
                  {workOrder.actlabhrs && (
                    <div className="flex justify-between gap-4">
                      <span>Actual Labor Hours</span>
                      <span className="font-semibold">{workOrder.actlabhrs.toLocaleString()} hrs</span>
                    </div>
                  )}
                  {(workOrder.estmatcost || workOrder.actmatcost) && (
                    <>
                      {workOrder.estmatcost && (
                        <div className="flex justify-between gap-4 pt-2 border-t border-white/5">
                          <span>Est. Material Cost</span>
                          <span>${workOrder.estmatcost.toLocaleString()}</span>
                        </div>
                      )}
                      {workOrder.actmatcost && (
                        <div className="flex justify-between gap-4">
                          <span>Actual Material Cost</span>
                          <span className="font-semibold">${workOrder.actmatcost.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <div className="text-sm text-white/60">
            {hasChanges ? (
              <span className="text-yellow-400 font-semibold">• Unsaved changes</span>
            ) : (
              <span>No changes pending</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label={isSaving ? "Saving work order changes" : "Save work order changes"}
            >
              {isSaving ? (
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

function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDisplayDate(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

WorkOrderEditorModal.displayName = "WorkOrderEditorModal";

// Made with Bob