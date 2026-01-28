/**
 * RH Dashboard Stats API
 * GET /api/rh/dashboard/stats
 */

import { withRole, successResponse, errorResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = withRole(["RH", "SUPER_ADMIN"], async (context) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Employee stats
    const [totalEmployees, activeEmployees, pendingEmployees, suspendedEmployees] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.user.count({ where: { status: "PENDING" } }),
        prisma.user.count({ where: { status: "SUSPENDED" } }),
      ]);

    // Attendance today
    const attendanceToday = await prisma.pointage.groupBy({
      by: ["userId"],
      where: {
        type: "IN",
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
      _count: true,
    });

    // Leave requests stats
    const leavesStats = await prisma.demandeConge.groupBy({
      by: ["status"],
      _count: true,
    });

    const leaves = {
      pending: leavesStats.find((s) => s.status === "EN_ATTENTE")?._count || 0,
      approved: leavesStats.find((s) => s.status === "VALIDE")?._count || 0,
      rejected: leavesStats.find((s) => s.status === "REFUSE")?._count || 0,
      total: leavesStats.reduce((acc, s) => acc + s._count, 0),
    };

    // Anomalies count
    const anomaliesCount = await prisma.anomaly.count({
      where: {
        status: {
          in: ["PENDING", "INVESTIGATING"],
        },
      },
    });

    // Notifications count
    const notificationsCount = await prisma.notification.count({
      where: {
        userId: context.user.id,
        isRead: false,
      },
    });

    return successResponse({
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        pending: pendingEmployees,
        suspended: suspendedEmployees,
      },
      attendance: {
        today: {
          present: attendanceToday.length,
          total: activeEmployees,
        },
        thisWeek: 0, // TODO: Calculate
        anomalies: anomaliesCount,
      },
      leaves,
      system: {
        anomalies: anomaliesCount,
        notifications: notificationsCount,
      },
    });
  } catch (error: any) {
    console.error("RH dashboard stats error:", error);
    return errorResponse(
      "Erreur lors du chargement des statistiques",
      500,
      error.message
    );
  }
});
