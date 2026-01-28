/**
 * React Query Hooks for Data Fetching
 * Optimized data fetching with caching and real-time updates
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, invalidateQueries } from "@/providers/QueryProvider";

// ==================== API HELPERS ====================

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== EMPLOYEE HOOKS ====================

export function useEmployees(filters?: { status?: string; department?: string }) {
  return useQuery({
    queryKey: queryKeys.employees.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.department) params.set('department', filters.department);
      return fetchAPI<any[]>(`/api/employees?${params.toString()}`);
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => fetchAPI<any>(`/api/employees/${id}`),
    enabled: !!id,
  });
}

export function usePendingEmployees() {
  return useQuery({
    queryKey: queryKeys.employees.pending,
    queryFn: () => fetchAPI<any[]>('/api/employees/pending'),
  });
}

export function useApproveEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: string) =>
      fetchAPI('/api/rh/approve', {
        method: 'POST',
        body: JSON.stringify({ employeeId }),
      }),
    onSuccess: () => {
      invalidateQueries.employee(queryClient);
      invalidateQueries.dashboard(queryClient);
      invalidateQueries.notification(queryClient);
    },
  });
}

export function useRejectEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, reason }: { employeeId: string; reason: string }) =>
      fetchAPI('/api/rh/reject', {
        method: 'POST',
        body: JSON.stringify({ employeeId, reason }),
      }),
    onSuccess: () => {
      invalidateQueries.employee(queryClient);
      invalidateQueries.dashboard(queryClient);
      invalidateQueries.notification(queryClient);
    },
  });
}

// ==================== POINTAGE HOOKS ====================

export function useTodayPointageStatus() {
  return useQuery({
    queryKey: ['pointage', 'today-status'],
    queryFn: () => fetchAPI<any>('/api/pointage/today-status'),
    refetchInterval: 60000, // Refetch every minute
  });
}

export function usePointageHistory(filters?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: queryKeys.pointages.list(undefined, filters as any),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      return fetchAPI<any[]>(`/api/pointage/me?${params.toString()}`);
    },
  });
}

export function usePointageStats() {
  return useQuery({
    queryKey: queryKeys.pointages.stats(),
    queryFn: () => fetchAPI<any>('/api/pointage/stats'),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { capturedPhoto?: string; geolocation?: any }) =>
      fetchAPI('/api/pointage/check-in', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      invalidateQueries.pointage(queryClient);
      invalidateQueries.dashboard(queryClient);
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { capturedPhoto?: string; geolocation?: any }) =>
      fetchAPI('/api/pointage/check-out', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      invalidateQueries.pointage(queryClient);
      invalidateQueries.dashboard(queryClient);
    },
  });
}

// ==================== LEAVE REQUEST HOOKS ====================

export function useLeaveRequests(filters?: { status?: string }) {
  return useQuery({
    queryKey: queryKeys.conges.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      return fetchAPI<any[]>(`/api/conges?${params.toString()}`);
    },
  });
}

export function usePendingLeaveRequests() {
  return useQuery({
    queryKey: queryKeys.conges.pending,
    queryFn: () => fetchAPI<any[]>('/api/conges/pending'),
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      type: string;
      dateDebut: string;
      dateFin: string;
      commentaire?: string;
    }) =>
      fetchAPI('/api/conges', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conges.all });
      invalidateQueries.notification(queryClient);
    },
  });
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status: string; commentaire?: string }) =>
      fetchAPI(`/api/conges/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conges.all });
      invalidateQueries.dashboard(queryClient);
      invalidateQueries.notification(queryClient);
    },
  });
}

// ==================== NOTIFICATION HOOKS ====================

export function useNotifications(unreadOnly: boolean = false) {
  return useQuery({
    queryKey: queryKeys.notifications.list(unreadOnly),
    queryFn: () =>
      fetchAPI<{ notifications: any[]; unreadCount: number }>(
        `/api/notifications?unreadOnly=${unreadOnly}`
      ),
    refetchInterval: 30000, // Refetch every 30 seconds as backup for SSE
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      fetchAPI('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationId }),
      }),
    onSuccess: () => {
      invalidateQueries.notification(queryClient);
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchAPI('/api/notifications/mark-all-read', { method: 'POST' }),
    onSuccess: () => {
      invalidateQueries.notification(queryClient);
    },
  });
}

// ==================== DASHBOARD HOOKS ====================

export function useRHDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.rh,
    queryFn: () => fetchAPI<any>('/api/rh/dashboard'),
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useRHDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => fetchAPI<any>('/api/rh/dashboard/stats'),
    refetchInterval: 60000,
  });
}

export function usePendingItems() {
  return useQuery({
    queryKey: ['rh', 'pending-items'],
    queryFn: () => fetchAPI<any[]>('/api/rh/pending-items'),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// ==================== USER HOOKS ====================

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => fetchAPI<any[]>('/api/users'),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => fetchAPI<any>(`/api/users/${id}`),
    enabled: !!id,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.current,
    queryFn: () => fetchAPI<any>('/api/employees/me'),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      fetchAPI(`/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      invalidateQueries.user(queryClient, variables.id);
    },
  });
}

// ==================== AUDIT LOGS HOOKS ====================

export function useAuditLogs(filters?: {
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: queryKeys.audit.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.action) params.set('action', filters.action);
      if (filters?.userId) params.set('userId', filters.userId);
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      return fetchAPI<any[]>(`/api/logs?${params.toString()}`);
    },
  });
}

// ==================== PERMISSIONS HOOKS ====================

export function useUserPermissions() {
  return useQuery({
    queryKey: ['user-permissions'],
    queryFn: () => fetchAPI<{ permissions: Record<string, any>; role: string }>('/api/user-permissions'),
    staleTime: 5 * 60 * 1000, // Permissions are stable, cache for 5 minutes
  });
}
