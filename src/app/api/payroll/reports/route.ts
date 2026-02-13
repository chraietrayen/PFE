/**
 * Salary Reports API
 * 
 * GET /api/payroll/reports?year=2026&month=2&employeeId=xxx
 * 
 * Returns stored salary reports.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/rbac";
import { salaryReportService } from "@/lib/services/salary-report-service";

export const GET = withAuth(
  async (req: NextRequest, user) => {
    try {
      const url = new URL(req.url);
      const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));
      const month = url.searchParams.get('month') ? parseInt(url.searchParams.get('month')!) : undefined;
      const employeeId = url.searchParams.get('employeeId');

      // Users can only see their own reports
      if (user.role === 'USER') {
        if (month) {
          const report = await salaryReportService.getReport(user.id, year, month);
          return NextResponse.json(report ? { report } : { report: null });
        }
        const history = await salaryReportService.getEmployeeHistory(user.id, year);
        return NextResponse.json({ reports: history });
      }

      // RH/Admin: view all
      if (employeeId) {
        if (month) {
          const report = await salaryReportService.getReport(employeeId, year, month);
          return NextResponse.json({ report });
        }
        const history = await salaryReportService.getEmployeeHistory(employeeId, year);
        return NextResponse.json({ reports: history });
      }

      if (month) {
        const reports = await salaryReportService.getMonthlyReports(year, month);
        const totals = await salaryReportService.getPayrollTotals(year, month);
        return NextResponse.json({ reports, totals });
      }

      return NextResponse.json({ error: "Veuillez spécifier un mois" }, { status: 400 });
    } catch (error: unknown) {
      console.error("Get reports error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des rapports" },
        { status: 500 }
      );
    }
  },
  { requireActive: true }
);

/**
 * PATCH /api/payroll/reports
 * Body: { reportId, action: "approve" | "paid" }
 * 
 * RH/Admin: approve or mark as paid
 */
export const PATCH = withAuth(
  async (req: NextRequest, user) => {
    try {
      if (!['RH', 'SUPER_ADMIN'].includes(user.role)) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }

      const { reportId, action } = await req.json();

      if (!reportId || !['approve', 'paid'].includes(action)) {
        return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
      }

      let result;
      if (action === 'approve') {
        result = await salaryReportService.approveReport(reportId, user.id);
      } else {
        result = await salaryReportService.markAsPaid(reportId);
      }

      return NextResponse.json({ success: true, report: result });
    } catch (error: unknown) {
      console.error("Update report error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du rapport" },
        { status: 500 }
      );
    }
  },
  { roles: ['RH', 'SUPER_ADMIN'], requireActive: true }
);
