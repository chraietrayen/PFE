/**
 * useExport Hook
 * React hook for handling data exports with role-based access
 */

"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";

export interface ExportOptions {
  type: 'employees' | 'pointages' | 'conges' | 'audit' | 'monthly' | 'personal';
  format?: 'csv' | 'excel' | 'pdf';
  dateRange?: {
    start: Date;
    end: Date;
  };
  year?: number;
  month?: number;
  filters?: {
    status?: string;
    department?: string;
    userId?: string;
  };
}

export interface UseExportResult {
  isExporting: boolean;
  error: string | null;
  exportData: (options: ExportOptions) => Promise<void>;
  canExport: (type: string) => boolean;
}

export function useExport(): UseExportResult {
  const { data: session } = useSession();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRole = (session?.user as any)?.role || 'USER';

  /**
   * Check if user can export a specific type of data
   */
  const canExport = useCallback((type: string): boolean => {
    switch (type) {
      case 'employees':
        return ['RH', 'SUPER_ADMIN'].includes(userRole);
      case 'audit':
        return userRole === 'SUPER_ADMIN';
      case 'pointages':
      case 'conges':
      case 'personal':
        return true; // All authenticated users can export their own data
      case 'monthly':
        return ['RH', 'SUPER_ADMIN'].includes(userRole);
      default:
        return false;
    }
  }, [userRole]);

  /**
   * Export data and trigger download
   */
  const exportData = useCallback(async (options: ExportOptions) => {
    if (!session?.user) {
      setError("Vous devez être connecté pour exporter des données");
      return;
    }

    if (!canExport(options.type)) {
      setError("Vous n'avez pas les permissions nécessaires pour cet export");
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.set('type', options.type);
      params.set('format', options.format || 'csv');

      if (options.dateRange) {
        params.set('startDate', options.dateRange.start.toISOString());
        params.set('endDate', options.dateRange.end.toISOString());
      }

      if (options.year) params.set('year', options.year.toString());
      if (options.month) params.set('month', options.month.toString());

      if (options.filters) {
        if (options.filters.status) params.set('status', options.filters.status);
        if (options.filters.department) params.set('department', options.filters.department);
        if (options.filters.userId) params.set('userId', options.filters.userId);
      }

      const response = await fetch(`/api/exports?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `export_${options.type}_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="(.+)"/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Export completed: ${filename}`);
    } catch (err: any) {
      console.error('❌ Export error:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  }, [session, canExport]);

  return {
    isExporting,
    error,
    exportData,
    canExport,
  };
}

/**
 * Quick export functions for common use cases
 */
export function useQuickExport() {
  const { exportData, isExporting, error, canExport } = useExport();

  const exportMyPointages = useCallback(async (month?: number, year?: number) => {
    const now = new Date();
    await exportData({
      type: 'personal',
      year: year || now.getFullYear(),
      month: month || now.getMonth() + 1,
    });
  }, [exportData]);

  const exportMyConges = useCallback(async (startDate?: Date, endDate?: Date) => {
    const start = startDate || new Date(new Date().getFullYear(), 0, 1);
    const end = endDate || new Date();
    await exportData({
      type: 'conges',
      dateRange: { start, end },
    });
  }, [exportData]);

  const exportEmployees = useCallback(async (filters?: { status?: string; department?: string }) => {
    await exportData({
      type: 'employees',
      filters,
    });
  }, [exportData]);

  const exportMonthlyReport = useCallback(async (year: number, month: number) => {
    await exportData({
      type: 'monthly',
      year,
      month,
    });
  }, [exportData]);

  const exportAuditLogs = useCallback(async (startDate: Date, endDate: Date) => {
    await exportData({
      type: 'audit',
      dateRange: { start: startDate, end: endDate },
    });
  }, [exportData]);

  return {
    exportMyPointages,
    exportMyConges,
    exportEmployees,
    exportMonthlyReport,
    exportAuditLogs,
    isExporting,
    error,
    canExport,
  };
}
