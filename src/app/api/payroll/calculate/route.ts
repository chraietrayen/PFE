/**
 * Payroll Calculation API
 * 
 * POST /api/payroll/calculate
 * Body: { employeeId?, year, month, generateAll? }
 * 
 * Calculates salary and generates report.
 * RH/Admin only for other employees.
 * Users can view their own estimate.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/rbac";
import { salaryReportService } from "@/lib/services/salary-report-service";
import { estimateSalary } from "@/lib/payroll/engine";
import { auditLogger } from "@/lib/services/audit-logger";

export const POST = withAuth(
  async (req: NextRequest, user) => {
    try {
      const { employeeId, year, month, generateAll } = await req.json();

      const targetYear = year || new Date().getFullYear();
      const targetMonth = month || new Date().getMonth() + 1;

      // Validate
      if (targetMonth < 1 || targetMonth > 12) {
        return NextResponse.json({ error: "Mois invalide" }, { status: 400 });
      }

      // Generate all reports (RH/Admin only)
      if (generateAll) {
        if (!['RH', 'SUPER_ADMIN'].includes(user.role)) {
          return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }

        const results = await salaryReportService.generateAllReports(targetYear, targetMonth);

        await auditLogger.log({
          userId: user.id,
          action: "PAYROLL_GENERATE_ALL",
          entityType: "SalaryReport",
          metadata: JSON.stringify({ year: targetYear, month: targetMonth, count: results.length }),
          severity: "INFO",
        });

        return NextResponse.json({
          success: true,
          count: results.length,
          totalPayroll: results.reduce((s, r) => s + r.salary.netSalary, 0),
          reports: results.map(r => ({
            employeeId: r.employeeId,
            employeeName: r.employeeName,
            netSalary: r.salary.netSalary,
            grossSalary: r.salary.grossSalary,
            deductions: r.salary.totalDeductions,
          })),
        });
      }

      // Single employee
      const targetId = employeeId || user.id;

      // Only RH/Admin can calculate for other employees
      if (targetId !== user.id && !['RH', 'SUPER_ADMIN'].includes(user.role)) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }

      // Users get estimation, RH/Admin get full report
      if (targetId === user.id && user.role === 'USER') {
        const estimate = await estimateSalary(targetId, targetYear, targetMonth);
        return NextResponse.json({ success: true, type: 'estimate', data: estimate });
      }

      const result = await salaryReportService.generateReport(targetId, targetYear, targetMonth);

      await auditLogger.log({
        userId: user.id,
        action: "PAYROLL_CALCULATE",
        entityType: "SalaryReport",
        entityId: targetId,
        metadata: JSON.stringify({ year: targetYear, month: targetMonth }),
        severity: "INFO",
      });

      return NextResponse.json({ success: true, type: 'full', data: result });
    } catch (error: unknown) {
      console.error("Payroll calculation error:", error);
      return NextResponse.json(
        { error: "Erreur lors du calcul de salaire" },
        { status: 500 }
      );
    }
  },
  { requireActive: true }
);
