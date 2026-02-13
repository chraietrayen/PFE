/**
 * Leave Service (Enhanced)
 * 
 * Manages leave requests with half-day support, reward leaves,
 * calendar view data, and leave balance calculations.
 */

import prisma from '@/lib/prisma';
import {
  ANNUAL_LEAVE_TYPES,
  PAID_LEAVE_TYPES,
  isWorkDay,
  toDateString,
} from '@/lib/payroll/constants';
import type {
  LeaveType,
  LeaveStatus,
  LeaveRecord,
  LeaveSummary,
  LeaveBalance,
  SessionType,
} from '@/lib/payroll/types';

class LeaveService {
  // ─── CREATE LEAVE REQUEST ──────────────────────────────────

  /**
   * Create a new leave request with half-day support
   */
  async createLeaveRequest(params: {
    userId: string;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    isHalfDay?: boolean;
    halfDaySession?: SessionType;
    reason?: string;
  }): Promise<{ success: boolean; leave?: LeaveRecord; error?: string }> {
    const { userId, type, startDate, endDate, isHalfDay = false, halfDaySession, reason } = params;

    // Validation: half-day requires same start/end date
    if (isHalfDay && toDateString(startDate) !== toDateString(endDate)) {
      return { success: false, error: 'Les congés demi-journée doivent être sur le même jour' };
    }

    // Validation: half-day requires session specification
    if (isHalfDay && !halfDaySession) {
      return { success: false, error: 'Veuillez préciser la session (MORNING ou AFTERNOON) pour un congé demi-journée' };
    }

    // Validation: dates
    if (startDate > endDate) {
      return { success: false, error: 'La date de fin doit être après la date de début' };
    }

    // Calculate working days duration
    const durationDays = isHalfDay ? 0.5 : this.countWorkDaysBetween(startDate, endDate);
    if (durationDays <= 0) {
      return { success: false, error: 'Aucun jour ouvrable dans la période sélectionnée' };
    }

    // Check for overlapping requests
    const overlapping = await prisma.demandeConge.findFirst({
      where: {
        userId,
        status: { in: ['EN_ATTENTE', 'VALIDE'] },
        OR: [
          { dateDebut: { lte: endDate }, dateFin: { gte: startDate } },
        ],
      },
    });

    if (overlapping) {
      return { success: false, error: 'Une demande de congé existe déjà pour cette période' };
    }

    // Check leave balance for annual leave types
    if (ANNUAL_LEAVE_TYPES.includes(type as typeof ANNUAL_LEAVE_TYPES[number])) {
      const balance = await this.getLeaveBalance(userId, startDate.getFullYear());
      if (balance.remaining < durationDays) {
        return {
          success: false,
          error: `Solde insuffisant. Reste: ${balance.remaining} jours, demandé: ${durationDays} jours`,
        };
      }
    }

    // Determine salary impact
    const impactOnSalary = !PAID_LEAVE_TYPES.includes(type as typeof PAID_LEAVE_TYPES[number]);

    const leave = await prisma.demandeConge.create({
      data: {
        userId,
        type,
        dateDebut: startDate,
        dateFin: endDate,
        isHalfDay,
        halfDaySession: halfDaySession || null,
        status: 'EN_ATTENTE',
        commentaire: reason || null,
        impactOnSalary,
        durationDays,
      },
    });

    return {
      success: true,
      leave: this.toLeaveRecord(leave),
    };
  }

  // ─── APPROVE / REJECT ─────────────────────────────────────

  /**
   * Approve a leave request
   */
  async approveLeave(leaveId: string, approvedById: string): Promise<LeaveRecord> {
    const leave = await prisma.demandeConge.update({
      where: { id: leaveId },
      data: {
        status: 'VALIDE',
        approvedById,
        approvedAt: new Date(),
      },
    });

    // If approved, create attendance session records with LEAVE status
    await this.createLeaveAttendanceSessions(leave);

    return this.toLeaveRecord(leave);
  }

  /**
   * Reject a leave request
   */
  async rejectLeave(leaveId: string, reason?: string): Promise<LeaveRecord> {
    const leave = await prisma.demandeConge.update({
      where: { id: leaveId },
      data: {
        status: 'REFUSE',
        commentaire: reason || undefined,
      },
    });
    return this.toLeaveRecord(leave);
  }

  // ─── LEAVE BALANCE ────────────────────────────────────────

  /**
   * Calculate leave balance for an employee
   */
  async getLeaveBalance(userId: string, year: number): Promise<LeaveBalance> {
    // Get employee's annual leave allowance
    const employe = await prisma.employe.findFirst({
      where: { userId },
    });
    const annualAllowance = employe?.annualLeave ?? 26;

    // Get used leaves
    const usedLeaves = await prisma.demandeConge.findMany({
      where: {
        userId,
        status: 'VALIDE',
        dateDebut: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
    });

    // Get pending leaves
    const pendingLeaves = await prisma.demandeConge.findMany({
      where: {
        userId,
        status: 'EN_ATTENTE',
        dateDebut: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
    });

    // Calculate by type
    const byType: Record<LeaveType, number> = {
      PAID: 0,
      UNPAID: 0,
      MATERNITE: 0,
      MALADIE: 0,
      PREAVIS: 0,
      REWARD: 0,
    };

    let totalUsed = 0;
    for (const leave of usedLeaves) {
      const days = leave.durationDays ?? this.calculateLeaveDuration(leave);
      byType[leave.type as LeaveType] = (byType[leave.type as LeaveType] || 0) + days;
      // Only PAID leaves count against annual allowance
      if (leave.type === 'PAID') {
        totalUsed += days;
      }
    }

    let totalPending = 0;
    for (const leave of pendingLeaves) {
      const days = leave.durationDays ?? this.calculateLeaveDuration(leave);
      if (leave.type === 'PAID') {
        totalPending += days;
      }
    }

    return {
      annualAllowance,
      used: totalUsed,
      pending: totalPending,
      remaining: annualAllowance - totalUsed - totalPending,
      byType,
    };
  }

  // ─── LEAVE SUMMARY FOR PAYROLL ────────────────────────────

  /**
   * Get leave summary for a specific month (used by payroll engine)
   */
  async getMonthlySummary(userId: string, year: number, month: number): Promise<LeaveSummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const leaves = await prisma.demandeConge.findMany({
      where: {
        userId,
        status: 'VALIDE',
        dateDebut: { lte: endDate },
        dateFin: { gte: startDate },
      },
    });

    const summary: LeaveSummary = {
      paidDays: 0,
      unpaidDays: 0,
      sickDays: 0,
      maternityDays: 0,
      otherDays: 0,
      totalDays: 0,
      salaryDeductionDays: 0,
    };

    for (const leave of leaves) {
      // Calculate days that fall within this month
      const leaveStart = new Date(Math.max(startDate.getTime(), new Date(leave.dateDebut).getTime()));
      const leaveEnd = new Date(Math.min(endDate.getTime(), new Date(leave.dateFin).getTime()));
      
      let days: number;
      if (leave.isHalfDay) {
        days = 0.5;
      } else {
        days = this.countWorkDaysBetween(leaveStart, leaveEnd);
      }

      switch (leave.type) {
        case 'PAID':
        case 'REWARD':
          summary.paidDays += days;
          break;
        case 'UNPAID':
          summary.unpaidDays += days;
          summary.salaryDeductionDays += days;
          break;
        case 'MALADIE':
          summary.sickDays += days;
          break;
        case 'MATERNITE':
          summary.maternityDays += days;
          break;
        default:
          summary.otherDays += days;
          break;
      }

      summary.totalDays += days;
    }

    return summary;
  }

  // ─── CALENDAR VIEW ────────────────────────────────────────

  /**
   * Get leave calendar data for a month (all employees or single)
   */
  async getCalendarView(year: number, month: number, userId?: string) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const where: Record<string, unknown> = {
      status: { in: ['EN_ATTENTE', 'VALIDE'] },
      dateDebut: { lte: endDate },
      dateFin: { gte: startDate },
    };
    if (userId) where.userId = userId;

    const leaves = await prisma.demandeConge.findMany({
      where: where as NonNullable<Parameters<typeof prisma.demandeConge.findMany>[0]>['where'],
      include: {
        user: { select: { id: true, name: true, lastName: true, email: true } },
      },
      orderBy: { dateDebut: 'asc' },
    });

    return leaves.map(leave => ({
      id: leave.id,
      userId: leave.userId,
      userName: `${leave.user.name || ''} ${leave.user.lastName || ''}`.trim(),
      type: leave.type,
      startDate: leave.dateDebut,
      endDate: leave.dateFin,
      isHalfDay: leave.isHalfDay,
      halfDaySession: leave.halfDaySession,
      status: leave.status,
      duration: leave.durationDays ?? this.calculateLeaveDuration(leave),
    }));
  }

  // ─── HELPERS ───────────────────────────────────────────────

  /**
   * Create attendance session records for approved leave
   * This ensures leave days show up in attendance tracking
   */
  private async createLeaveAttendanceSessions(leave: {
    userId: string;
    dateDebut: Date;
    dateFin: Date;
    isHalfDay: boolean;
    halfDaySession: string | null;
  }) {
    const start = new Date(leave.dateDebut);
    const end = new Date(leave.dateFin);
    const current = new Date(start);

    while (current <= end) {
      if (isWorkDay(current)) {
        const dateOnly = new Date(current.getFullYear(), current.getMonth(), current.getDate());

        if (leave.isHalfDay) {
          // Only create for the specified session
          const sessionType = leave.halfDaySession as 'MORNING' | 'AFTERNOON';
          await prisma.attendanceSession.upsert({
            where: {
              userId_date_sessionType: {
                userId: leave.userId,
                date: dateOnly,
                sessionType,
              },
            },
            create: {
              userId: leave.userId,
              date: dateOnly,
              sessionType,
              status: 'LEAVE_HALF',
              durationMinutes: 240, // 4h credit
            },
            update: {
              status: 'LEAVE_HALF',
              durationMinutes: 240,
            },
          });
        } else {
          // Create both sessions as LEAVE_FULL
          for (const session of ['MORNING', 'AFTERNOON'] as const) {
            await prisma.attendanceSession.upsert({
              where: {
                userId_date_sessionType: {
                  userId: leave.userId,
                  date: dateOnly,
                  sessionType: session,
                },
              },
              create: {
                userId: leave.userId,
                date: dateOnly,
                sessionType: session,
                status: 'LEAVE_FULL',
                durationMinutes: 240, // 4h credit per session
              },
              update: {
                status: 'LEAVE_FULL',
                durationMinutes: 240,
              },
            });
          }
        }
      }
      current.setDate(current.getDate() + 1);
    }
  }

  /**
   * Count work days between two dates (inclusive)
   */
  private countWorkDaysBetween(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      if (isWorkDay(current)) count++;
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  private calculateLeaveDuration(leave: {
    isHalfDay: boolean;
    dateDebut: Date;
    dateFin: Date;
  }): number {
    if (leave.isHalfDay) return 0.5;
    return this.countWorkDaysBetween(new Date(leave.dateDebut), new Date(leave.dateFin));
  }

  private toLeaveRecord(leave: {
    id: string;
    userId: string;
    type: string;
    dateDebut: Date;
    dateFin: Date;
    isHalfDay: boolean;
    halfDaySession: string | null;
    status: string;
    impactOnSalary: boolean;
    durationDays: number | null;
  }): LeaveRecord {
    return {
      id: leave.id,
      userId: leave.userId,
      type: leave.type as LeaveType,
      startDate: leave.dateDebut,
      endDate: leave.dateFin,
      isHalfDay: leave.isHalfDay,
      halfDaySession: leave.halfDaySession as SessionType | null,
      status: leave.status as LeaveStatus,
      impactOnSalary: leave.impactOnSalary,
      durationDays: leave.durationDays ?? (leave.isHalfDay ? 0.5 : 0),
    };
  }
}

export const leaveService = new LeaveService();
