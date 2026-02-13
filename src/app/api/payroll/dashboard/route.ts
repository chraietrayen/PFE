/**
 * User Dashboard API
 * 
 * GET /api/payroll/dashboard
 * 
 * Returns personalized dashboard data:
 * - Today's attendance sessions
 * - Month progress
 * - Salary estimation
 * - Leave balance
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/rbac";
import { analyticsService } from "@/lib/services/analytics-service";

export const GET = withAuth(
  async (req: NextRequest, user) => {
    try {
      const dashboard = await analyticsService.getUserDashboard(user.id);
      return NextResponse.json(dashboard);
    } catch (error: unknown) {
      console.error("Dashboard error:", error);
      return NextResponse.json(
        { error: "Erreur lors du chargement du tableau de bord" },
        { status: 500 }
      );
    }
  },
  { requireActive: true }
);
