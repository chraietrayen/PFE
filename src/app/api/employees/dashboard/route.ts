/**
 * Employee Dashboard API
 * GET /api/employees/dashboard
 */

import {
  withActiveStatus,
  successResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = withActiveStatus(async (context) => {
  const { user } = context;

  try {
    // Get current month date range
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get current week date range
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() - now.getDay());
    firstDayOfWeek.setHours(0, 0, 0, 0);

    // Attendance this month (count unique days with check-in)
    const attendanceThisMonth = await prisma.pointage.groupBy({
      by: ["userId"],
      where: {
        userId: user.id,
        type: "IN",
        timestamp: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      _count: true,
    });

    // Attendance this week
    const attendanceThisWeek = await prisma.pointage.count({
      where: {
        userId: user.id,
        type: "IN",
        timestamp: {
          gte: firstDayOfWeek,
        },
      },
    });

    // Leave requests stats
    const leavesStats = await prisma.demandeConge.groupBy({
      by: ["status"],
      where: {
        userId: user.id,
      },
      _count: true,
    });

    const leaves = {
      pending: leavesStats.find((s) => s.status === "EN_ATTENTE")?._count || 0,
      approved: leavesStats.find((s) => s.status === "VALIDE")?._count || 0,
      rejected: leavesStats.find((s) => s.status === "REFUSE")?._count || 0,
      total: leavesStats.reduce((acc, s) => acc + s._count, 0),
    };

    // Get recent anomalies
    const recentAnomalies = await prisma.anomaly.findMany({
      where: {
        pointage: {
          userId: user.id,
        },
        status: {
          in: ["PENDING", "INVESTIGATING"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        type: true,
        description: true,
        severity: true,
        createdAt: true,
      },
    });

    const anomaliesCount = await prisma.anomaly.count({
      where: {
        pointage: {
          userId: user.id,
        },
        status: {
          in: ["PENDING", "INVESTIGATING"],
        },
      },
    });

    // Get last check-in/out
    const lastCheckIn = await prisma.pointage.findFirst({
      where: {
        userId: user.id,
        type: "IN",
      },
      orderBy: {
        timestamp: "desc",
      },
      select: {
        timestamp: true,
      },
    });

    const lastCheckOut = await prisma.pointage.findFirst({
      where: {
        userId: user.id,
        type: "OUT",
      },
      orderBy: {
        timestamp: "desc",
      },
      select: {
        timestamp: true,
      },
    });

    return successResponse({
      attendance: {
        thisMonth: attendanceThisMonth[0]?._count || 0,
        thisWeek: attendanceThisWeek,
        lastCheckIn: lastCheckIn?.timestamp || null,
        lastCheckOut: lastCheckOut?.timestamp || null,
      },
      leaves,
      anomalies: {
        count: anomaliesCount,
        recent: recentAnomalies.map((a) => ({
          id: a.id,
          type: a.type,
          description: a.description,
          severity: a.severity,
          date: a.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error("Employee dashboard error:", error);
    return errorResponse(
      "Erreur lors du chargement du tableau de bord",
      500,
      error.message
    );
  }
});
