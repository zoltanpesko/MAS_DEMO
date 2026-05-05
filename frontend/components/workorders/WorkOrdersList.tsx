import React, { memo, useMemo, useState } from "react";
import { Filter, Plus, RefreshCw, Search, Wrench } from "lucide-react";
import { WorkOrderFilters, WorkOrdersListProps } from "./types";
import { WorkOrderCard } from "./WorkOrderCard";

type SortOption = "priority" | "date" | "status";

/**
 * Work orders list component with search, filter, and sort functionality
 */
export const WorkOrdersList: React.FC<WorkOrdersListProps> = memo(({
  workOrders,
  loading,
  lastRefreshed,
  onRefresh,
  onCreate,
  onViewWorkOrder,
}) => {
  const [filters, setFilters] = useState<WorkOrderFilters>({
    searchQuery: "",
    status: "all",
    worktype: "all",
    priority: "all",
  });
  const [sortBy, setSortBy] = useState<SortOption>("priority");

  const filteredWorkOrders = useMemo(() => {
    const filtered = workOrders.filter((workOrder) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesWonum = workOrder.wonum.toLowerCase().includes(query);
        const matchesDescription = workOrder.description?.toLowerCase().includes(query);
        if (!matchesWonum && !matchesDescription) return false;
      }

      if (filters.status !== "all" && workOrder.status !== filters.status) {
        return false;
      }

      if (filters.worktype !== "all" && workOrder.worktype !== filters.worktype) {
        return false;
      }

      const effectivePriority = workOrder.priority ?? workOrder.wopriority;
      if (filters.priority !== "all" && String(effectivePriority ?? "") !== filters.priority) {
        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityA = a.priority ?? a.wopriority ?? Number.MAX_SAFE_INTEGER;
        const priorityB = b.priority ?? b.wopriority ?? Number.MAX_SAFE_INTEGER;
        return priorityA - priorityB;
      }

      if (sortBy === "date") {
        const dateA = a.schedstart ? new Date(a.schedstart).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.schedstart ? new Date(b.schedstart).getTime() : Number.MAX_SAFE_INTEGER;
        return dateA - dateB;
      }

      return (a.status || "").localeCompare(b.status || "");
    });
  }, [workOrders, filters, sortBy]);

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      status: "all",
      worktype: "all",
      priority: "all",
    });
    setSortBy("priority");
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Work Orders
          {filteredWorkOrders.length !== workOrders.length && (
            <span className="text-sm text-white/60">
              ({filteredWorkOrders.length} of {workOrders.length})
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label="Create new work order"
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label={loading ? "Loading work orders" : "Refresh work orders"}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading..." : "Load Work Orders"}
          </button>
        </div>
      </div>

      {workOrders.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search by work order number or description..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-white/40"
              aria-label="Search work orders"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">Filters:</span>
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-1.5 bg-gray-800/50 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="WAPPR">WAPPR</option>
              <option value="APPR">APPR</option>
              <option value="INPRG">INPRG</option>
              <option value="COMP">COMP</option>
              <option value="CLOSE">CLOSE</option>
              <option value="CAN">CAN</option>
            </select>

            <select
              value={filters.worktype}
              onChange={(e) => setFilters({ ...filters, worktype: e.target.value })}
              className="px-3 py-1.5 bg-gray-800/50 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              aria-label="Filter by work type"
            >
              <option value="all">All Types</option>
              <option value="CM">CM</option>
              <option value="PM">PM</option>
              <option value="EM">EM</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-3 py-1.5 bg-gray-800/50 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              aria-label="Filter by priority"
            >
              <option value="all">All Priorities</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 bg-gray-800/50 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              aria-label="Sort work orders"
            >
              <option value="priority">Sort: Priority</option>
              <option value="date">Sort: Date</option>
              <option value="status">Sort: Status</option>
            </select>

            {(filters.searchQuery ||
              filters.status !== "all" ||
              filters.worktype !== "all" ||
              filters.priority !== "all" ||
              sortBy !== "priority") && (
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                aria-label="Clear all filters"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {lastRefreshed && (
        <div className="mb-4 p-3 bg-indigo-500/20 border-l-4 border-indigo-500 text-sm text-indigo-200 backdrop-blur-sm">
          🕒 Last Refreshed: {lastRefreshed}
        </div>
      )}

      {loading && workOrders.length === 0 ? (
        <div className="text-center py-12 text-white/60">
          <RefreshCw className="w-12 h-12 mx-auto mb-3 animate-spin text-indigo-400" />
          <p>Loading work orders...</p>
        </div>
      ) : filteredWorkOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkOrders.map((workOrder, index) => (
            <WorkOrderCard
              key={`${workOrder.wonum}-${index}`}
              workOrder={workOrder}
              onView={onViewWorkOrder}
            />
          ))}
        </div>
      ) : workOrders.length > 0 ? (
        <div className="text-center py-12 text-white/60">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No work orders match your filters</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="text-center py-12 text-white/60">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No work orders found</p>
          <p className="text-sm mt-1">Load work orders or create a new one to begin.</p>
        </div>
      )}
    </div>
  );
});

WorkOrdersList.displayName = "WorkOrdersList";

// Made with Bob