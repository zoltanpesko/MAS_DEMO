/**
 * Shared TypeScript interfaces for Work Orders components
 * Enhanced with MXAPIWO schema fields
 */

export interface WorkOrder {
  // Core identification fields (existing)
  wonum: string;
  description?: string;
  status?: string;
  worktype?: string;
  assetnum?: string;
  location?: string;
  priority?: number;
  wopriority?: number;
  
  // Scheduling fields (existing)
  schedstart?: string;
  schedfinish?: string;
  actstart?: string;
  actfinish?: string;
  
  // Personnel fields (existing)
  lead?: string;
  supervisor?: string;
  
  // MXAPIWO: Organizational fields
  siteid?: string;
  orgid?: string;
  
  // MXAPIWO: Tracking fields
  reportedby?: string;
  reportdate?: string;
  owner?: string;
  statusdate?: string;
  
  // MXAPIWO: Target dates
  targstartdate?: string;
  targcompdate?: string;
  
  // MXAPIWO: Cost management - Estimated
  estlabcost?: number;
  estmatcost?: number;
  estservcost?: number;
  esttoolcost?: number;
  estlabhrs?: number;
  
  // MXAPIWO: Cost management - Actual
  actlabcost?: number;
  actmatcost?: number;
  actservcost?: number;
  acttoolcost?: number;
  actlabhrs?: number;
}

export interface WorkOrderFilters {
  searchQuery: string;
  status: string;
  worktype: string;
  priority: string;
}

export interface ApiResponse {
  success: boolean;
  data: {
    member?: WorkOrder[];
  } | WorkOrder;
  source?: string;
  error?: string;
  message?: string;
}

export interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onView: (workOrder: WorkOrder) => void;
}

export interface WorkOrdersListProps {
  workOrders: WorkOrder[];
  loading: boolean;
  lastRefreshed: string;
  onRefresh: () => void;
  onCreate: () => void;
  onViewWorkOrder: (workOrder: WorkOrder) => void;
}

export interface WorkOrderEditorModalProps {
  workOrder: WorkOrder;
  isOpen: boolean;
  onClose: () => void;
  serverUrl: string;
  apiKey: string;
}

export interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverUrl: string;
  apiKey: string;
}

export interface NewWorkOrderData {
  description: string;
  worktype?: string;
  assetnum?: string;
  location?: string;
  priority?: number;
  schedstart?: string;
  schedfinish?: string;
  lead?: string;
  supervisor?: string;
}

// Made with Bob