/**
 * HR Analytics Service
 * 
 * Aggregates data for dashboards:
 * - Monthly attendance summary
 * - Leave statistics
 * - Salary estimation
 * - Leave balance
 * 
 * Accessible by SUPER_ADMIN and RH roles.
 */

import prisma from '@/lib/prisma';
import { countWorkDaysInMonth } from '@/lib/payroll/constants';
import { estimateSalary } from '@/lib/payroll/engine';
import { leaveService } from '@/lib/services/leave-service';
import type {
  MonthlyAttendanceAnalytics,
  LeaveAnalytics,
  PayrollAnalytics,
  LeaveType,
} from '@/lib/payroll/types';

class AnalyticsService {
  // ─── ATTENDANCE ANALYTICS ─────────────────────────────────

  /**
   * Monthly attendance analytics across all employees
   */
  async getAttendanceAnalytics(
    year: number,
    month: number
  ): Promise<MonthlyAttendanceAnalytics> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const expectedWorkDays = countWorkDaysInMonth(year, month);

    // Get all active employees
    const employees = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, lastName: true },
    });

    // Get all attendance sessions for the month
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        userId: { in: employees.map(e => e.id) },
      },
    });

    // Build per-employee breakdown
    const employeeBreakdown = employees.map(emp => {
      const empSessions = sessions.filter(s => s.userId === emp.id);

      // Count unique dates with FULL status
      const workedDateSet = new Set<string>();
      const partialDateSet = new Set<string>();
      for (const s of empSessions) {
        const dateStr = s.date.toISOString().split('T')[0];
        if (s.status === 'FULL' || s.status === 'REWARD' || s.status === 'LEAVE_FULL') {
          workedDateSet.add(dateStr);
        } else if (s.status === 'PARTIAL' || s.status === 'LEAVE_HALF') {
          if (!workedDateSet.has(dateStr)) {
            partialDateSet.add(dateStr);
          }
        }
      }

      const workedDays = workedDateSet.size + (partialDateSet.size * 0.5);
      const absentDays = Math.max(0, expectedWorkDays - workedDays - partialDateSet.size * 0.5);
      const attendanceRate = expectedWorkDays > 0
        ? (workedDays / expectedWorkDays) * 100
        : 0;

      return {
        employeeId: emp.id,
        employeeName: `${emp.name || ''} ${emp.lastName || ''}`.trim(),
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        workedDays,
        absentDays,
      };
    });

    const totalAbsentDays = employeeBreakdown.reduce((s, e) => s + e.absentDays, 0);
    const averageAttendanceRate = employeeBreakdown.length > 0
      ? employeeBreakdown.reduce((s, e) => s + e.attendanceRate, 0) / employeeBreakdown.length
      : 0;

    // Count late check-ins (after standard morning start)
    const lateCheckIns = sessions.filter(s => {
      if (s.sessionType !== 'MORNING' || !s.checkIn) return false;
      return new Date(s.checkIn).getHours() >= 9; // Late if after 9:00
    });

    // Overtime hours
    const overtimeSessions = sessions.filter(s => {
      return s.durationMinutes && s.durationMinutes > 240; // More than 4h per session
    });
    const totalOvertimeMinutes = overtimeSessions.reduce(
      (sum, s) => sum + Math.max(0, (s.durationMinutes || 0) - 240),
      0
    );

    return {
      month,
      year,
      totalEmployees: employees.length,
      averageAttendanceRate: Math.round(averageAttendanceRate * 100) / 100,
      totalAbsentDays,
      totalLateDays: lateCheckIns.length,
      totalOvertimeHours: Math.round((totalOvertimeMinutes / 60) * 100) / 100,
      employeeBreakdown,
    };
  }

  // ─── LEAVE ANALYTICS ─────────────────────────────────────

  /**
   * Leave statistics for a given month
   */
  async getLeaveAnalytics(year: number, month: number): Promise<LeaveAnalytics> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const leaves = await prisma.demandeConge.findMany({
      where: {
        dateDebut: { lte: endDate },
        dateFin: { gte: startDate },
      },
    });

    const byType: Record<LeaveType, number> = {
      PAID: 0,
      UNPAID: 0,
      MATERNITE: 0,
      MALADIE: 0,
      PREAVIS: 0,
      REWARD: 0,
    };

    let totalDuration = 0;
    for (const leave of leaves) {
      const days = leave.durationDays ?? (leave.isHalfDay ? 0.5 : 1);
      byType[leave.type as LeaveType] = (byType[leave.type as LeaveType] || 0) + days;
      totalDuration += days;
    }

    const approved = leaves.filter(l => l.status === 'VALIDE').length;
    const rejected = leaves.filter(l => l.status === 'REFUSE').length;
    const pending = leaves.filter(l => l.status === 'EN_ATTENTE').length;

    return {
      month,
      year,
      totalLeaveRequests: leaves.length,
      approvedRequests: approved,
      rejectedRequests: rejected,
      pendingRequests: pending,
      byType,
      averageDuration: leaves.length > 0
        ? Math.round((totalDuration / leaves.length) * 100) / 100
        : 0,
    };
  }

  // ─── PAYROLL ANALYTICS ────────────────────────────────────

  /**
   * Payroll analytics for a given month
   */
  async getPayrollAnalytics(year: number, month: number): Promise<PayrollAnalytics> {
    const reports = await prisma.salaryReport.findMany({
      where: { year, month },
    });

    if (reports.length === 0) {
      return {
        month,
        year,
        totalPayroll: 0,
        averageSalary: 0,
        totalDeductions: 0,
        totalOvertime: 0,
        totalRewardBonuses: 0,
        employeeCount: 0,
      };
    }

    return {
      month,
      year,
      totalPayroll: round2(reports.reduce((s, r) => s + r.netSalary, 0)),
      averageSalary: round2(reports.reduce((s, r) => s + r.netSalary, 0) / reports.length),
      totalDeductions: round2(reports.reduce((s, r) => s + r.deductions, 0)),
      totalOvertime: round2(reports.reduce((s, r) => s + r.overtimePay, 0)),
      totalRewardBonuses: round2(reports.reduce((s, r) => s + r.rewardBonus, 0)),
      employeeCount: reports.length,
    };
  }

  // ─── DASHBOARD SUMMARIES ──────────────────────────────────

  /**
   * User dashboard data: today status + month progress + salary estimation
   */
  async getUserDashboard(userId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Today's sessions
    const today = new Date(year, now.getMonth(), now.getDate());
    const todaySessions = await prisma.attendanceSession.findMany({
      where: { userId, date: today },
    });

    // Month progress
    const monthSessions = await prisma.attendanceSession.findMany({
      where: {
        userId,
        date: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0),
        },
        status: { in: ['FULL', 'PARTIAL', 'REWARD', 'LEAVE_FULL', 'LEAVE_HALF'] },
      },
    });

    const expectedDays = countWorkDaysInMonth(year, month);
    const workedDates = new Set(monthSessions.map(s => s.date.toISOString().split('T')[0]));
    const workedDays = workedDates.size;
    const totalWorkedMinutes = monthSessions.reduce((s, m) => s + (m.durationMinutes || 0), 0);

    // Salary estimation
    let salaryEstimate;
    try {
      salaryEstimate = await estimateSalary(userId, year, month);
    } catch {
      salaryEstimate = null;
    }

    // Leave balance
    let leaveBalance;
    try {
      leaveBalance = await leaveService.getLeaveBalance(userId, year);
    } catch {
      leaveBalance = null;
    }

    return {
      today: {
        date: today,
        morning: todaySessions.find(s => s.sessionType === 'MORNING') || null,
        afternoon: todaySessions.find(s => s.sessionType === 'AFTERNOON') || null,
      },
      monthProgress: {
        year,
        month,
        workedDays,
        expectedDays,
        totalWorkedHours: Math.round((totalWorkedMinutes / 60) * 100) / 100,
        progressPercent: expectedDays > 0
          ? Math.round((workedDays / expectedDays) * 100 * 100) / 100
          : 0,
      },
      salaryEstimate,
      leaveBalance,
    };
  }

  /**
   * RH dashboard: salary preview + attendance anomalies + pending leaves
   */
  async getRHDashboard(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Pending leave approvals
    const pendingLeaves = await prisma.demandeConge.findMany({
      where: { status: 'EN_ATTENTE' },
      include: {
        user: { select: { id: true, name: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Attendance anomalies
    const anomalies = await prisma.attendanceSession.findMany({
      where: {
        anomalyDetected: true,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        user: { select: { id: true, name: true, lastName: true, email: true } },
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    // Salary preview (from stored reports or estimate)
    const salaryReports = await prisma.salaryReport.findMany({
      where: { year, month },
      include: {
        user: { select: { id: true, name: true, lastName: true } },
      },
      orderBy: { netSalary: 'desc' },
    });

    // Summary stats
    const totalActiveEmployees = await prisma.user.count({
      where: { status: 'ACTIVE' },
    });

    return {
      pendingLeaves: pendingLeaves.map(l => ({
        id: l.id,
        userId: l.userId,
        userName: `${l.user.name || ''} ${l.user.lastName || ''}`.trim(),
        type: l.type,
        startDate: l.dateDebut,
        endDate: l.dateFin,
        isHalfDay: l.isHalfDay,
        duration: l.durationDays,
        status: l.status,
      })),
      anomalies: anomalies.map(a => ({
        id: a.id,
        userId: a.userId,
        userName: `${a.user.name || ''} ${a.user.lastName || ''}`.trim(),
        date: a.date,
        sessionType: a.sessionType,
        reason: a.anomalyReason,
      })),
      salaryPreview: salaryReports.map(r => ({
        employeeId: r.userId,
        employeeName: `${r.user.name || ''} ${r.user.lastName || ''}`.trim(),
        baseSalary: r.baseSalary,
        netSalary: r.netSalary,
        deductions: r.deductions,
        status: r.status,
      })),
      stats: {
        totalActiveEmployees,
        pendingLeaveCount: pendingLeaves.length,
        anomalyCount: anomalies.length,
        totalPayroll: salaryReports.reduce((s, r) => s + r.netSalary, 0),
      },
    };
  }

  /**
   * Admin global payroll analytics dashboard
   */
  async getAdminDashboard(year: number) {
    // Monthly payroll trend for the year
    const allReports = await prisma.salaryReport.findMany({
      where: { year },
      orderBy: [{ month: 'asc' }],
    });

    const monthlyTrends = [];
    for (let m = 1; m <= 12; m++) {
      const monthReports = allReports.filter(r => r.month === m);
      monthlyTrends.push({
        month: m,
        totalPayroll: round2(monthReports.reduce((s, r) => s + r.netSalary, 0)),
        totalDeductions: round2(monthReports.reduce((s, r) => s + r.deductions, 0)),
        employeeCount: monthReports.length,
        averageSalary: monthReports.length > 0
          ? round2(monthReports.reduce((s, r) => s + r.netSalary, 0) / monthReports.length)
          : 0,
      });
    }

    // Overview stats
    const totalEmployees = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const totalLeaves = await prisma.demandeConge.count({
      where: {
        dateDebut: { gte: new Date(year, 0, 1) },
        dateFin: { lte: new Date(year, 11, 31) },
      },
    });

    return {
      year,
      monthlyTrends,
      overview: {
        totalEmployees,
        totalLeaveRequests: totalLeaves,
        yearlyPayroll: round2(allReports.reduce((s, r) => s + r.netSalary, 0)),
        yearlyDeductions: round2(allReports.reduce((s, r) => s + r.deductions, 0)),
      },
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const analyticsService = new AnalyticsService();
