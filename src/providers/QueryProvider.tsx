/**
 * React Query Provider
 * Global query client configuration with optimized caching
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 30 seconds
            staleTime: 30 * 1000,
            // Cache data for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests 2 times
            retry: 2,
            // Retry delay with exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus for fresh data
            refetchOnWindowFocus: true,
            // Don't refetch on mount if data is fresh
            refetchOnMount: true,
            // Refetch on reconnect
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Query keys factory for consistent cache management
 */
export const queryKeys = {
  // User queries
  users: {
    all: ['users'] as const,
    list: (filters?: Record<string, any>) => ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    current: ['users', 'current'] as const,
    permissions: (userId: string) => ['users', 'permissions', userId] as const,
  },
  
  // Employee queries
  employees: {
    all: ['employees'] as const,
    list: (filters?: Record<string, any>) => ['employees', 'list', filters] as const,
    detail: (id: string) => ['employees', 'detail', id] as const,
    pending: ['employees', 'pending'] as const,
    stats: ['employees', 'stats'] as const,
  },
  
  // Pointage queries
  pointages: {
    all: ['pointages'] as const,
    list: (userId?: string, dateRange?: { start: Date; end: Date }) => 
      ['pointages', 'list', userId, dateRange] as const,
    today: (userId: string) => ['pointages', 'today', userId] as const,
    stats: (userId?: string) => ['pointages', 'stats', userId] as const,
    anomalies: ['pointages', 'anomalies'] as const,
  },
  
  // Leave request queries
  conges: {
    all: ['conges'] as const,
    list: (filters?: Record<string, any>) => ['conges', 'list', filters] as const,
    detail: (id: string) => ['conges', 'detail', id] as const,
    pending: ['conges', 'pending'] as const,
    stats: ['conges', 'stats'] as const,
  },
  
  // Notification queries
  notifications: {
    all: ['notifications'] as const,
    list: (unreadOnly?: boolean) => ['notifications', 'list', unreadOnly] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
  },
  
  // Dashboard queries
  dashboard: {
    rh: ['dashboard', 'rh'] as const,
    admin: ['dashboard', 'admin'] as const,
    user: (userId: string) => ['dashboard', 'user', userId] as const,
    stats: ['dashboard', 'stats'] as const,
  },
  
  // Audit logs
  audit: {
    all: ['audit'] as const,
    list: (filters?: Record<string, any>) => ['audit', 'list', filters] as const,
  },
};

/**
 * Invalidation helpers
 */
export const invalidateQueries = {
  user: (queryClient: QueryClient, userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  },
  
  employee: (queryClient: QueryClient, employeeId?: string) => {
    if (employeeId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(employeeId) });
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.employees.pending });
  },
  
  pointage: (queryClient: QueryClient, userId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.pointages.all });
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.pointages.today(userId) });
    }
  },
  
  notification: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  },
  
  dashboard: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.rh });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin });
  },
};
