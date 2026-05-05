"use client";

import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Wrench, Plus, RefreshCw } from "lucide-react";
import {
  WorkOrdersList,
  WorkOrderEditorModal,
  CreateWorkOrderModal,
  WorkOrder,
  useWorkOrders,
  QueryProvider,
} from "@/components/workorders";

function WorkOrdersPageContent() {
  // API Configuration State
  const [serverUrl, setServerUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [shouldFetch, setShouldFetch] = useState(false);

  // Status State
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  // Modal State
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // React Query hooks
  const { 
    data: workOrders = [], 
    isLoading, 
    error, 
    refetch,
    dataUpdatedAt 
  } = useWorkOrders({ 
    serverUrl, 
    apiKey, 
    enabled: shouldFetch 
  });

  // Load saved configuration on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem("mas_server_url") || "";
    const savedKey = localStorage.getItem("mas_api_key") || "";
    setServerUrl(savedUrl);
    setApiKey(savedKey);
    
    // Auto-load if credentials exist
    if (savedUrl && savedKey) {
      setShouldFetch(true);
    }
  }, []);

  // Handle query errors
  useEffect(() => {
    if (error) {
      setStatus({
        type: "error",
        message: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }, [error]);

  // Handle successful data fetch
  useEffect(() => {
    if (workOrders.length > 0 && !isLoading && !error) {
      setStatus({
        type: "success",
        message: `✅ Successfully loaded ${workOrders.length} work orders`,
      });
    }
  }, [workOrders.length, isLoading, error]);

  // Format last refreshed time
  const lastRefreshed = dataUpdatedAt 
    ? new Date(dataUpdatedAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : "";

  // Load work orders from API
  const loadWorkOrders = useCallback(async () => {
    if (!serverUrl || !apiKey) {
      setStatus({
        type: "error",
        message: "⚠️ Please configure API settings first",
      });
      return;
    }

    setStatus({ type: "info", message: "⏳ Loading work orders..." });
    setShouldFetch(true);
    await refetch();
  }, [serverUrl, apiKey, refetch]);

  return (
    <div className="min-h-screen relative">
      {/* Fixed Background Hero */}
      <div className="fixed inset-0 z-0">
        <HeroGeometric
          badge="MAS Work Orders"
          title1="Work Order Manager"
          title2="Track & Manage"
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="container mx-auto px-4 pt-8 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Page Title */}
          <div className="mb-8">
            <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-600/20 rounded-xl">
                  <Wrench className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Work Orders Management</h1>
                  <p className="text-gray-400 mt-1">Create, view, and manage work orders</p>
                </div>
              </div>
            </div>
          </div>

          {/* API Configuration Card */}
          {!serverUrl || !apiKey ? (
            <div className="mb-6">
              <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl border border-white/10 p-8">
                <h2 className="text-xl font-semibold text-white mb-4">API Configuration</h2>
                <p className="text-gray-400 mb-6">
                  Please configure your MAS API credentials on the home page to access work orders.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go to Home Page
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Action Buttons */}
              <div className="mb-6 flex gap-4">
                <button
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Create Work Order
                </button>
                <button
                  onClick={loadWorkOrders}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              {/* Status Messages */}
              {status.message && (
                <div className="mb-6">
                  <div
                    className={`p-4 rounded-lg border ${
                      status.type === "success"
                        ? "bg-green-900/20 border-green-500/50 text-green-400"
                        : status.type === "error"
                        ? "bg-red-900/20 border-red-500/50 text-red-400"
                        : "bg-blue-900/20 border-blue-500/50 text-blue-400"
                    }`}
                  >
                    <p className="font-medium">{status.message}</p>
                    {status.type === "error" && (
                      <button
                        onClick={loadWorkOrders}
                        className="mt-2 text-sm underline hover:no-underline"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Work Orders List */}
              <div className="mt-6">
                <WorkOrdersList
                  workOrders={workOrders}
                  loading={isLoading}
                  lastRefreshed={lastRefreshed}
                  onRefresh={loadWorkOrders}
                  onCreate={() => setIsCreating(true)}
                  onViewWorkOrder={setSelectedWorkOrder}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Work Order Editor Modal */}
      {selectedWorkOrder && (
        <WorkOrderEditorModal
          workOrder={selectedWorkOrder}
          isOpen={!!selectedWorkOrder}
          onClose={() => setSelectedWorkOrder(null)}
          serverUrl={serverUrl}
          apiKey={apiKey}
        />
      )}

      {/* Create New Work Order Modal */}
      {isCreating && (
        <CreateWorkOrderModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          serverUrl={serverUrl}
          apiKey={apiKey}
        />
      )}
    </div>
  );
}

export default function WorkOrdersPage() {
  return (
    <QueryProvider>
      <WorkOrdersPageContent />
    </QueryProvider>
  );
}

// Made with Bob