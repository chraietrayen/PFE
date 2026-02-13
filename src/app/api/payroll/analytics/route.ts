/**
 * Payroll Analytics API
 * 
 * GET /api/payroll/analytics?year=2026&month=2&type=attendance|leave|payroll|dashboard
 * 
 * RH and SUPER_ADMIN only.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/rbac";
import { analyticsService } from "@/lib/services/analytics-service";

export const GET = withAuth(
  async (req: NextRequest, user) => {
    try {
      const url = new URL(req.url);
      const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));
      const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1));
      const type = url.searchParams.get('type') || 'dashboard';

      switch (type) {
        case 'attendance':
          return NextResponse.json(
            await analyticsService.getAttendanceAnalytics(year, month)
          );

        case 'leave':
          return NextResponse.json(
            await analyticsService.getLeaveAnalytics(year, month)
          );

        case 'payroll':
          return NextResponse.json(
            await analyticsService.getPayrollAnalytics(year, month)
          );

        case 'rh-dashboard':
          return NextResponse.json(
            await analyticsService.getRHDashboard(year, month)
          );

        case 'admin-dashboard':
          if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
          }
          return NextResponse.json(
            await analyticsService.getAdminDashboard(year)
          );

        case 'user-dashboard':
          return NextResponse.json(
            await analyticsService.getUserDashboard(user.id)
          );

        default:
          return NextResponse.json(
            { error: "Type d'analytique invalide" },
            { status: 400 }
          );
      }
    } catch (error: unknown) {
      console.error("Analytics error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des analytiques" },
        { status: 500 }
      );
    }
  },
  { roles: ['RH', 'SUPER_ADMIN'], requireActive: true }
);
