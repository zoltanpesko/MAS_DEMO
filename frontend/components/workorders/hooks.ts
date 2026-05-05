/**
 * Custom hooks for Work Orders API calls with React Query
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiResponse, NewWorkOrderData, WorkOrder } from "./types";

interface UseWorkOrdersOptions {
  serverUrl: string;
  apiKey: string;
  enabled?: boolean;
}

interface UpdateWorkOrderParams {
  wonum: string;
  field: keyof WorkOrder;
  value: string | number | null;
  serverUrl: string;
  apiKey: string;
}

interface UpdateWorkOrderStatusParams {
  wonum: string;
  status: string;
  serverUrl: string;
  apiKey: string;
}

interface CreateWorkOrderParams extends NewWorkOrderData {
  serverUrl: string;
  apiKey: string;
}

/**
 * Hook to fetch work orders with automatic caching and refetching
 */
export function useWorkOrders({ serverUrl, apiKey, enabled = true }: UseWorkOrdersOptions) {
  return useQuery({
    queryKey: ["workorders", serverUrl, apiKey],
    queryFn: async (): Promise<WorkOrder[]> => {
      const response = await fetch("/api/workorders?pageSize=50", {
        method: "GET",
        headers: {
          "x-mas-api-key": apiKey,
          "x-mas-server-url": serverUrl,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (
        result.success &&
        result.data &&
        "member" in result.data &&
        Array.isArray(result.data.member) &&
        result.data.member.length > 0
      ) {
        return result.data.member;
      }

      return [];
    },
    enabled: enabled && !!serverUrl && !!apiKey,
    staleTime: 30000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to update a work order field with optimistic updates
 */
export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wonum, field, value, serverUrl, apiKey }: UpdateWorkOrderParams) => {
      const response = await fetch(`/api/workorders/${encodeURIComponent(wonum)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-mas-api-key": apiKey,
          "x-mas-server-url": serverUrl,
        },
        body: JSON.stringify({
          field,
          value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json().catch(() => ({ success: true }));

      if (!result.success) {
        throw new Error(result.error || "Failed to update work order");
      }

      return result;
    },
    onMutate: async ({ wonum, field, value, serverUrl, apiKey }) => {
      await queryClient.cancelQueries({ queryKey: ["workorders", serverUrl, apiKey] });

      const previousWorkOrders = queryClient.getQueryData<WorkOrder[]>(["workorders", serverUrl, apiKey]);

      if (previousWorkOrders) {
        queryClient.setQueryData<WorkOrder[]>(
          ["workorders", serverUrl, apiKey],
          previousWorkOrders.map((workOrder) =>
            workOrder.wonum === wonum ? { ...workOrder, [field]: value ?? undefined } : workOrder
          )
        );
      }

      return { previousWorkOrders };
    },
    onError: (_err, variables, context) => {
      if (context?.previousWorkOrders) {
        queryClient.setQueryData(
          ["workorders", variables.serverUrl, variables.apiKey],
          context.previousWorkOrders
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workorders", variables.serverUrl, variables.apiKey] });
    },
    retry: 1,
  });
}

/**
 * Hook to update work order status with optimistic updates
 */
export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wonum, status, serverUrl, apiKey }: UpdateWorkOrderStatusParams) => {
      const response = await fetch("/api/workorders/update-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wonum,
          status,
          serverUrl,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update work order status");
      }

      return result;
    },
    onMutate: async ({ wonum, status, serverUrl, apiKey }) => {
      await queryClient.cancelQueries({ queryKey: ["workorders", serverUrl, apiKey] });

      const previousWorkOrders = queryClient.getQueryData<WorkOrder[]>(["workorders", serverUrl, apiKey]);

      if (previousWorkOrders) {
        queryClient.setQueryData<WorkOrder[]>(
          ["workorders", serverUrl, apiKey],
          previousWorkOrders.map((workOrder) =>
            workOrder.wonum === wonum ? { ...workOrder, status } : workOrder
          )
        );
      }

      return { previousWorkOrders };
    },
    onError: (_err, variables, context) => {
      if (context?.previousWorkOrders) {
        queryClient.setQueryData(
          ["workorders", variables.serverUrl, variables.apiKey],
          context.previousWorkOrders
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workorders", variables.serverUrl, variables.apiKey] });
    },
    retry: 1,
  });
}

/**
 * Hook to create a new work order
 */
export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serverUrl, apiKey, ...workOrderData }: CreateWorkOrderParams) => {
      const response = await fetch("/api/workorders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mas-api-key": apiKey,
          "x-mas-server-url": serverUrl,
        },
        body: JSON.stringify(workOrderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create work order");
      }

      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workorders", variables.serverUrl, variables.apiKey] });
    },
    retry: 1,
  });
}

// Made with Bob