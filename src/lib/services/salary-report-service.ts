/**
 * Salary Report Service
 * 
 * Generates, stores, and retrieves salary reports.
 * Uses the payroll engine for calculations and persists
 * results to the SalaryReport table.
 */

import prisma from '@/lib/prisma';
import { calculateMonthlySalary, calculateAllSalaries } from '@/lib/payroll/engine';
import type { MonthlySalaryResult } from '@/lib/payroll/types';

class SalaryReportService {
  /**
   * Generate and store a salary report for one employee
   */
  async generateReport(
    employeeId: string,
    year: number,
    month: number
  ): Promise<MonthlySalaryResult> {
    const result = await calculateMonthlySalary(employeeId, year, month);

    // Persist to database
    await prisma.salaryReport.upsert({
      where: {
        userId_month_year: {
          userId: employeeId,
          month,
          year,
        },
      },
      create: {
        userId: employeeId,
        month,
        year,
        baseSalary: result.salary.baseSalary,
        hourlyRate: result.salary.hourlyRate,
        contractType: result.contractType,
        totalWorkedDays: result.attendance.totalWorkedDays,
        totalWorkedHours: result.attendance.totalWorkedHours,
        expectedWorkDays: result.attendance.expectedWorkDays,
        expectedWorkHours: result.attendance.expectedWorkHours,
        absentDays: result.attendance.absentDays,
        absentHours: result.attendance.absentHours,
        paidLeaveDays: result.leaves.paidDays,
        unpaidLeaveDays: result.leaves.unpaidDays,
        sickLeaveDays: result.leaves.sickDays,
        otherLeaveDays: result.leaves.otherDays + result.leaves.maternityDays,
        rewardDays: result.rewards.totalDays,
        rewardBonus: result.rewards.totalBonus,
        overtimeHours: result.attendance.overtimeHours,
        overtimePay: result.salary.overtimePay,
        grossSalary: result.salary.grossSalary,
        deductions: result.salary.totalDeductions,
        netSalary: result.salary.netSalary,
        breakdown: JSON.stringify(result),
        status: 'CALCULATED',
      },
      update: {
        baseSalary: result.salary.baseSalary,
        hourlyRate: result.salary.hourlyRate,
        contractType: result.contractType,
        totalWorkedDays: result.attendance.totalWorkedDays,
        totalWorkedHours: result.attendance.totalWorkedHours,
        expectedWorkDays: result.attendance.expectedWorkDays,
        expectedWorkHours: result.attendance.expectedWorkHours,
        absentDays: result.attendance.absentDays,
        absentHours: result.attendance.absentHours,
        paidLeaveDays: result.leaves.paidDays,
        unpaidLeaveDays: result.leaves.unpaidDays,
        sickLeaveDays: result.leaves.sickDays,
        otherLeaveDays: result.leaves.otherDays + result.leaves.maternityDays,
        rewardDays: result.rewards.totalDays,
        rewardBonus: result.rewards.totalBonus,
        overtimeHours: result.attendance.overtimeHours,
        overtimePay: result.salary.overtimePay,
        grossSalary: result.salary.grossSalary,
        deductions: result.salary.totalDeductions,
        netSalary: result.salary.netSalary,
        breakdown: JSON.stringify(result),
        status: 'CALCULATED',
      },
    });

    return result;
  }

  /**
   * Generate reports for ALL active employees
   */
  async generateAllReports(year: number, month: number): Promise<MonthlySalaryResult[]> {
    const results = await calculateAllSalaries(year, month);

    // Persist all reports
    for (const result of results) {
      await this.generateReport(result.employeeId, year, month);
    }

    return results;
  }

  /**
   * Get a stored salary report
   */
  async getReport(employeeId: string, year: number, month: number) {
    return prisma.salaryReport.findUnique({
      where: {
        userId_month_year: {
          userId: employeeId,
          month,
          year,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, lastName: true, email: true },
        },
      },
    });
  }

  /**
   * Get all reports for a month (RH/Admin view)
   */
  async getMonthlyReports(year: number, month: number) {
    return prisma.salaryReport.findMany({
      where: { year, month },
      include: {
        user: {
          select: { id: true, name: true, lastName: true, email: true },
        },
      },
      orderBy: { netSalary: 'desc' },
    });
  }

  /**
   * Get all reports for an employee (history)
   */
  async getEmployeeHistory(employeeId: string, year?: number) {
    const where: Record<string, unknown> = { userId: employeeId };
    if (year) where.year = year;

    return prisma.salaryReport.findMany({
      where: where as NonNullable<Parameters<typeof prisma.salaryReport.findMany>[0]>['where'],
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  /**
   * Approve a salary report
   */
  async approveReport(reportId: string, approvedById: string) {
    return prisma.salaryReport.update({
      where: { id: reportId },
      data: {
        status: 'APPROVED',
        approvedById,
        approvedAt: new Date(),
      },
    });
  }

  /**
   * Mark report as paid
   */
  async markAsPaid(reportId: string) {
    return prisma.salaryReport.update({
      where: { id: reportId },
      data: { status: 'PAID' },
    });
  }

  /**
   * Get payroll totals for a month
   */
  async getPayrollTotals(year: number, month: number) {
    const reports = await prisma.salaryReport.findMany({
      where: { year, month },
    });

    return {
      month,
      year,
      employeeCount: reports.length,
      totalGross: round2(reports.reduce((s, r) => s + (r.grossSalary ?? 0), 0)),
      totalNet: round2(reports.reduce((s, r) => s + (r.netSalary ?? 0), 0)),
      totalDeductions: round2(reports.reduce((s, r) => s + (r.deductions ?? 0), 0)),
      totalOvertime: round2(reports.reduce((s, r) => s + (r.overtimePay ?? 0), 0)),
      totalRewards: round2(reports.reduce((s, r) => s + (r.rewardBonus ?? 0), 0)),
      averageSalary: reports.length > 0
        ? round2(reports.reduce((s, r) => s + (r.netSalary ?? 0), 0) / reports.length)
        : 0,
      byStatus: {
        draft: reports.filter(r => r.status === 'DRAFT').length,
        calculated: reports.filter(r => r.status === 'CALCULATED').length,
        approved: reports.filter(r => r.status === 'APPROVED').length,
        paid: reports.filter(r => r.status === 'PAID').length,
      },
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const salaryReportService = new SalaryReportService();
