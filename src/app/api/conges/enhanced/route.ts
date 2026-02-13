/**
 * Enhanced Leave API with Half-Day Support
 * 
 * POST /api/conges/enhanced - Create leave request (half-day, reward)
 * GET  /api/conges/enhanced - Get leave balance & calendar
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/rbac";
import { leaveService } from "@/lib/services/leave-service";
import { auditLogger } from "@/lib/services/audit-logger";
import { notificationService } from "@/lib/services/notification-service";
import { query } from "@/lib/mysql-direct";
import type { LeaveType, SessionType } from "@/lib/payroll/types";

/**
 * POST - Create enhanced leave request
 */
export const POST = withAuth(
  async (req: NextRequest, user) => {
    try {
      const body = await req.json();
      const {
        type,
        startDate,
        endDate,
        isHalfDay = false,
        halfDaySession,
        reason,
      } = body;

      // Validation
      if (!type || !startDate || !endDate) {
        return NextResponse.json(
          { error: "type, startDate, et endDate sont requis" },
          { status: 400 }
        );
      }

      const validTypes: LeaveType[] = ['PAID', 'UNPAID', 'MATERNITE', 'MALADIE', 'PREAVIS', 'REWARD'];
      if (!validTypes.includes(type)) {
        return NextResponse.json({ error: "Type de congé invalide" }, { status: 400 });
      }

      const result = await leaveService.createLeaveRequest({
        userId: user.id,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isHalfDay,
        halfDaySession: halfDaySession as SessionType | undefined,
        reason,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // Audit log
      await auditLogger.log({
        userId: user.id,
        action: "LEAVE_REQUEST_CREATED",
        entityType: "DemandeConge",
        entityId: result.leave!.id,
        metadata: JSON.stringify({ type, isHalfDay, halfDaySession, duration: result.leave!.durationDays }),
        severity: "INFO",
      });

      // Notify RH
      try {
        const rhUsers = await query(
          `SELECT id FROM User WHERE role IN ('RH', 'SUPER_ADMIN') AND status = 'ACTIVE'`
        ) as Array<{ id: string }>;

        if (rhUsers.length > 0) {
          const userName = user.name || user.email;
          const rhUserIds = rhUsers.map(rh => rh.id);
          await notificationService.notifyRHLeaveRequest(
            rhUserIds,
            userName,
            type,
            result.leave!.durationDays,
            new Date(startDate).toLocaleDateString('fr-FR'),
            result.leave!.id
          );
        }
      } catch (notifError) {
        console.error("Notification error:", notifError);
      }

      return NextResponse.json({
        success: true,
        message: isHalfDay
          ? `Demande de demi-journée (${halfDaySession === 'MORNING' ? 'matin' : 'après-midi'}) soumise`
          : "Demande de congé soumise avec succès",
        leave: result.leave,
      });
    } catch (error: unknown) {
      console.error("Create leave error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la création de la demande" },
        { status: 500 }
      );
    }
  },
  { requireActive: true }
);

/**
 * GET - Get leave data
 * ?view=balance - Leave balance
 * ?view=calendar&year=2026&month=2 - Calendar view
 * ?view=history - User leave history
 */
export const GET = withAuth(
  async (req: NextRequest, user) => {
    try {
      const url = new URL(req.url);
      const view = url.searchParams.get('view') || 'balance';
      const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));
      const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1));
      const userId = url.searchParams.get('userId');

      const targetUserId = userId && ['RH', 'SUPER_ADMIN'].includes(user.role)
        ? userId
        : user.id;

      switch (view) {
        case 'balance': {
          const balance = await leaveService.getLeaveBalance(targetUserId, year);
          return NextResponse.json(balance);
        }

        case 'calendar': {
          // RH/Admin see all employees, users see their own
          const calendarUserId = ['RH', 'SUPER_ADMIN'].includes(user.role) && !userId
            ? undefined
            : targetUserId;
          const calendar = await leaveService.getCalendarView(year, month, calendarUserId);
          return NextResponse.json({ calendar });
        }

        case 'history': {
          const prisma = (await import('@/lib/prisma')).default;
          const leaves = await prisma.demandeConge.findMany({
            where: { userId: targetUserId },
            orderBy: { dateDebut: 'desc' },
          });
          return NextResponse.json({ leaves });
        }

        default:
          return NextResponse.json({ error: "Vue invalide" }, { status: 400 });
      }
    } catch (error: unknown) {
      console.error("Get leave data error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des données" },
        { status: 500 }
      );
    }
  },
  { requireActive: true }
);
