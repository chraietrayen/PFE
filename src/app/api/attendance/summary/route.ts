/**
 * Attendance Summary API
 * 
 * GET /api/attendance/summary?year=2026&month=2&userId=xxx
 * 
 * Returns monthly attendance summary.
 * userId is optional (defaults to current user).
 * RH/Admin can query any employee.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/rbac";
import { attendanceSessionService } from "@/lib/services/attendance-session-service";
import { calculateAttendance } from "@/lib/payroll/attendance-calculator";

export const GET = withAuth(
  async (req: NextRequest, user) => {
    try {
      const url = new URL(req.url);
      const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));
      const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1));
      let targetUserId = url.searchParams.get('userId') || user.id;

      // Only RH/Admin can view other users
      if (targetUserId !== user.id && !['RH', 'SUPER_ADMIN'].includes(user.role)) {
        return NextResponse.json(
          { error: "Accès non autorisé" },
          { status: 403 }
        );
      }

      // Validate month/year
      if (month < 1 || month > 12 || year < 2020 || year > 2100) {
        return NextResponse.json(
          { error: "Mois ou année invalide" },
          { status: 400 }
        );
      }

      const attendance = await calculateAttendance(targetUserId, year, month);

      return NextResponse.json({
        userId: targetUserId,
        year,
        month,
        summary: {
          totalWorkedDays: attendance.totalWorkedDays,
          totalWorkedHours: attendance.totalWorkedHours,
          expectedWorkDays: attendance.expectedWorkDays,
          expectedWorkHours: attendance.expectedWorkHours,
          absentDays: attendance.absentDays,
          absentHours: attendance.absentHours,
          partialDays: attendance.partialDays,
          fullDays: attendance.fullDays,
          overtimeHours: attendance.overtimeHours,
        },
        dailyDetails: attendance.dailySummaries.map(d => ({
          date: d.dateStr,
          dayStatus: d.dayStatus,
          workedMinutes: d.workedMinutes,
          expectedMinutes: d.expectedMinutes,
          isWorkDay: d.isWorkDay,
          morning: d.morning ? {
            checkIn: d.morning.checkIn,
            checkOut: d.morning.checkOut,
            duration: d.morning.durationMinutes,
            status: d.morning.status,
          } : null,
          afternoon: d.afternoon ? {
            checkIn: d.afternoon.checkIn,
            checkOut: d.afternoon.checkOut,
            duration: d.afternoon.durationMinutes,
            status: d.afternoon.status,
          } : null,
        })),
      });
    } catch (error: unknown) {
      console.error("Attendance summary error:", error);
      return NextResponse.json(
        { error: "Erreur lors du calcul du résumé" },
        { status: 500 }
      );
    }
  },
  { requireActive: true }
);
