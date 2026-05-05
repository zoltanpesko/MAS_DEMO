/**
 * Custom hooks for Scripts API calls with React Query
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AutoScript, ApiResponse, NewScriptData, OptimizationResponse } from "./types";

interface UseScriptsOptions {
  serverUrl: string;
  apiKey: string;
  enabled?: boolean;
}

interface UpdateScriptParams {
  scriptId: string;
  source: string;
  serverUrl: string;
  apiKey: string;
}

interface CreateScriptParams extends NewScriptData {
  serverUrl: string;
  apiKey: string;
}

/**
 * Hook to fetch scripts with automatic caching and refetching
 */
export function useScripts({ serverUrl, apiKey, enabled = true }: UseScriptsOptions) {
  return useQuery({
    queryKey: ["scripts", serverUrl, apiKey],
    queryFn: async (): Promise<AutoScript[]> => {
      const response = await fetch("/api/scripts?pageSize=50", {
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
        result.data.member &&
        result.data.member.length > 0
      ) {
        return result.data.member;
      }

      return [];
    },
    enabled: enabled && !!serverUrl && !!apiKey,
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to update a script with optimistic updates
 */
export function useUpdateScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scriptId, source, serverUrl, apiKey }: UpdateScriptParams) => {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source,
          serverUrl,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to save script");
      }

      return result;
    },
    onMutate: async ({ scriptId, source, serverUrl, apiKey }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["scripts", serverUrl, apiKey] });

      // Snapshot previous value
      const previousScripts = queryClient.getQueryData<AutoScript[]>(["scripts", serverUrl, apiKey]);

      // Optimistically update
      if (previousScripts) {
        queryClient.setQueryData<AutoScript[]>(
          ["scripts", serverUrl, apiKey],
          previousScripts.map((script) =>
            script.autoscript === scriptId ? { ...script, source } : script
          )
        );
      }

      return { previousScripts };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousScripts) {
        queryClient.setQueryData(
          ["scripts", variables.serverUrl, variables.apiKey],
          context.previousScripts
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ["scripts", variables.serverUrl, variables.apiKey] });
    },
    retry: 1,
  });
}

/**
 * Hook to create a new script
 */
export function useCreateScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateScriptParams) => {
      const response = await fetch("/api/scripts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create script");
      }

      return result;
    },
    onSuccess: (_data, variables) => {
      // Invalidate and refetch scripts
      queryClient.invalidateQueries({ queryKey: ["scripts", variables.serverUrl, variables.apiKey] });
    },
    retry: 1,
  });
}

interface OptimizeScriptParams {
  script: AutoScript;
}

/**
 * Hook to optimize a script and get AI-powered suggestions
 */
export function useOptimizeScript() {
  return useMutation({
    mutationFn: async ({ script }: OptimizeScriptParams): Promise<OptimizationResponse> => {
      const response = await fetch("/api/scripts/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ script }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result: OptimizationResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to optimize script");
      }

      return result;
    },
    retry: 1,
  });
}

// Made with Bob
