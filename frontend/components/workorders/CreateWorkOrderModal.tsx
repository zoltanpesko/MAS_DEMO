import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Calendar, Check, MapPin, RefreshCw, User, Wrench, X } from "lucide-react";
import { useCreateWorkOrder } from "./hooks";
import { CreateWorkOrderModalProps, NewWorkOrderData } from "./types";

const WORKTYPE_OPTIONS = ["", "CM", "PM", "EM"];
const PRIORITY_OPTIONS = ["", "1", "2", "3", "4", "5"];

/**
 * Create Work Order Modal component
 * Modal for creating new work orders with form validation
 */
export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = memo(({
  isOpen,
  onClose,
  serverUrl,
  apiKey,
}) => {
  const [formData, setFormData] = useState<NewWorkOrderData>({
    description: "",
    worktype: "",
    assetnum: "",
    location: "",
    priority: undefined,
    schedstart: "",
    schedfinish: "",
    lead: "",
    supervisor: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLTextAreaElement>(null);

  const createWorkOrderMutation = useCreateWorkOrder();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        description: "",
        worktype: "",
        assetnum: "",
        location: "",
        priority: undefined,
        schedstart: "",
        schedfinish: "",
        lead: "",
        supervisor: "",
      });
      setErrors({});
      setMessage({ type: null, message: "" });
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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

  const handleChange = useCallback(
    (field: keyof NewWorkOrderData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: field === "priority" ? (value ? Number(value) : undefined) : value,
      }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    },
    []
  );

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.schedstart && Number.isNaN(new Date(formData.schedstart).getTime())) {
      newErrors.schedstart = "Invalid scheduled start date";
    }

    if (formData.schedfinish && Number.isNaN(new Date(formData.schedfinish).getTime())) {
      newErrors.schedfinish = "Invalid scheduled finish date";
    }

    if (
      formData.schedstart &&
      formData.schedfinish &&
      new Date(formData.schedfinish).getTime() < new Date(formData.schedstart).getTime()
    ) {
      newErrors.schedfinish = "Scheduled finish must be after scheduled start";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setMessage({ type: null, message: "" });

    try {
      await createWorkOrderMutation.mutateAsync({
        description: formData.description.trim(),
        worktype: formData.worktype || undefined,
        assetnum: formData.assetnum || undefined,
        location: formData.location || undefined,
        priority: formData.priority,
        schedstart: formData.schedstart ? new Date(formData.schedstart).toISOString() : undefined,
        schedfinish: formData.schedfinish ? new Date(formData.schedfinish).toISOString() : undefined,
        lead: formData.lead || undefined,
        supervisor: formData.supervisor || undefined,
        serverUrl,
        apiKey,
      });

      setMessage({
        type: "success",
        message: "Work order created successfully.",
      });

      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      setMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create work order.",
      });
    }
  }, [apiKey, createWorkOrderMutation, formData, onClose, serverUrl, validateForm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-workorder-title"
    >
      <div
        ref={modalRef}
        className="bg-gray-900 rounded-lg shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2
            id="create-workorder-title"
            className="text-2xl font-bold text-white flex items-center gap-2"
          >
            <Wrench className="w-6 h-6 text-green-400" />
            Create New Work Order
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-white/80" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
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
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{message.message}</span>
            </div>
          )}

          <div>
            <label htmlFor="new-wo-description" className="block text-sm font-medium text-white/80 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              ref={firstInputRef}
              id="new-wo-description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              placeholder="Describe the work order"
              className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40 ${
                errors.description ? "border-red-500" : "border-white/20"
              }`}
              aria-required="true"
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "description-error" : undefined}
            />
            {errors.description && (
              <p id="description-error" className="mt-1 text-sm text-red-400" role="alert">
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="new-wo-worktype" className="block text-sm font-medium text-white/80 mb-2">
                Work Type
              </label>
              <select
                id="new-wo-worktype"
                value={formData.worktype}
                onChange={(e) => handleChange("worktype", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white"
              >
                {WORKTYPE_OPTIONS.map((worktype) => (
                  <option key={worktype || "blank"} value={worktype}>
                    {worktype || "Select work type"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="new-wo-priority" className="block text-sm font-medium text-white/80 mb-2">
                Priority
              </label>
              <select
                id="new-wo-priority"
                value={formData.priority?.toString() || ""}
                onChange={(e) => handleChange("priority", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white"
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority || "blank"} value={priority}>
                    {priority || "Select priority"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="new-wo-assetnum" className="block text-sm font-medium text-white/80 mb-2">
                Asset Number
              </label>
              <div className="relative">
                <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  id="new-wo-assetnum"
                  type="text"
                  value={formData.assetnum || ""}
                  onChange={(e) => handleChange("assetnum", e.target.value)}
                  placeholder="Asset number"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
                />
              </div>
            </div>

            <div>
              <label htmlFor="new-wo-location" className="block text-sm font-medium text-white/80 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  id="new-wo-location"
                  type="text"
                  value={formData.location || ""}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="Location"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
                />
              </div>
            </div>

            <div>
              <label htmlFor="new-wo-schedstart" className="block text-sm font-medium text-white/80 mb-2">
                Scheduled Start
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  id="new-wo-schedstart"
                  type="datetime-local"
                  value={toDateTimeLocalInput(formData.schedstart)}
                  onChange={(e) => handleChange("schedstart", e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white ${
                    errors.schedstart ? "border-red-500" : "border-white/20"
                  }`}
                  aria-invalid={!!errors.schedstart}
                />
              </div>
              {errors.schedstart && (
                <p className="mt-1 text-sm text-red-400" role="alert">
                  {errors.schedstart}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="new-wo-schedfinish" className="block text-sm font-medium text-white/80 mb-2">
                Scheduled Finish
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  id="new-wo-schedfinish"
                  type="datetime-local"
                  value={toDateTimeLocalInput(formData.schedfinish)}
                  onChange={(e) => handleChange("schedfinish", e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white ${
                    errors.schedfinish ? "border-red-500" : "border-white/20"
                  }`}
                  aria-invalid={!!errors.schedfinish}
                />
              </div>
              {errors.schedfinish && (
                <p className="mt-1 text-sm text-red-400" role="alert">
                  {errors.schedfinish}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="new-wo-lead" className="block text-sm font-medium text-white/80 mb-2">
                Lead
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  id="new-wo-lead"
                  type="text"
                  value={formData.lead || ""}
                  onChange={(e) => handleChange("lead", e.target.value)}
                  placeholder="Lead person"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
                />
              </div>
            </div>

            <div>
              <label htmlFor="new-wo-supervisor" className="block text-sm font-medium text-white/80 mb-2">
                Supervisor
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  id="new-wo-supervisor"
                  type="text"
                  value={formData.supervisor || ""}
                  onChange={(e) => handleChange("supervisor", e.target.value)}
                  placeholder="Supervisor"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createWorkOrderMutation.isPending || !formData.description.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label={createWorkOrderMutation.isPending ? "Creating work order" : "Create work order"}
          >
            {createWorkOrderMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Create Work Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

function toDateTimeLocalInput(value?: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

CreateWorkOrderModal.displayName = "CreateWorkOrderModal";

// Made with Bob