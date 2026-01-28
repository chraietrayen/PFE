/**
 * Today Status API
 * GET /api/pointage/today-status
 */

import { withActiveStatus, successResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = withActiveStatus(async (context) => {
  const { user } = context;

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check for today's check-in
  const checkIn = await prisma.pointage.findFirst({
    where: {
      userId: user.id,
      type: "IN",
      timestamp: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  // Check for today's check-out
  const checkOut = await prisma.pointage.findFirst({
    where: {
      userId: user.id,
      type: "OUT",
      timestamp: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  return successResponse({
    hasCheckedIn: !!checkIn,
    hasCheckedOut: !!checkOut,
    checkInTime: checkIn?.timestamp || null,
    checkOutTime: checkOut?.timestamp || null,
  });
});
