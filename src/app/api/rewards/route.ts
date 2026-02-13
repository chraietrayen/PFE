/**
 * Rewards API
 * 
 * POST /api/rewards - Grant a reward day (RH/Admin)
 * GET  /api/rewards - Get reward days
 * DELETE /api/rewards - Revoke a reward (RH/Admin)
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/rbac";
import { rewardService } from "@/lib/services/reward-service";
import { auditLogger } from "@/lib/services/audit-logger";

/**
 * POST - Grant a reward day
 */
export const POST = withAuth(
  async (req: NextRequest, user) => {
    try {
      if (!['RH', 'SUPER_ADMIN'].includes(user.role)) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }

      const { userId, date, reason, salaryImpact } = await req.json();

      if (!userId || !date || !reason) {
        return NextResponse.json(
          { error: "userId, date, et reason sont requis" },
          { status: 400 }
        );
      }

      const result = await rewardService.grantReward({
        userId,
        date: new Date(date),
        reason,
        grantedById: user.id,
        salaryImpact: salaryImpact || 0,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      await auditLogger.log({
        userId: user.id,
        action: "REWARD_GRANTED",
        entityType: "RewardDay",
        entityId: result.reward!.id,
        metadata: JSON.stringify({ targetUserId: userId, date, reason }),
        severity: "INFO",
      });

      return NextResponse.json({ success: true, reward: result.reward });
    } catch (error: unknown) {
      console.error("Grant reward error:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'attribution de la récompense" },
        { status: 500 }
      );
    }
  },
  { roles: ['RH', 'SUPER_ADMIN'], requireActive: true }
);

/**
 * GET - Get reward days
 */
export const GET = withAuth(
  async (req: NextRequest, user) => {
    try {
      const url = new URL(req.url);
      const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));
      const month = url.searchParams.get('month') ? parseInt(url.searchParams.get('month')!) : undefined;
      const userId = url.searchParams.get('userId');

      // Users can only see their own
      if (user.role === 'USER') {
        const rewards = await rewardService.getUserRewards(user.id, year);
        return NextResponse.json({ rewards });
      }

      // RH/Admin: view specific user or all
      if (userId) {
        const rewards = await rewardService.getUserRewards(userId, year);
        return NextResponse.json({ rewards });
      }

      const rewards = await rewardService.getAllRewards(year, month);
      return NextResponse.json({ rewards });
    } catch (error: unknown) {
      console.error("Get rewards error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des récompenses" },
        { status: 500 }
      );
    }
  },
  { requireActive: true }
);

/**
 * DELETE - Revoke a reward day
 */
export const DELETE = withAuth(
  async (req: NextRequest, user) => {
    try {
      if (!['RH', 'SUPER_ADMIN'].includes(user.role)) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }

      const { rewardId } = await req.json();
      if (!rewardId) {
        return NextResponse.json({ error: "rewardId requis" }, { status: 400 });
      }

      const reward = await rewardService.revokeReward(rewardId);

      await auditLogger.log({
        userId: user.id,
        action: "REWARD_REVOKED",
        entityType: "RewardDay",
        entityId: rewardId,
        severity: "WARNING",
      });

      return NextResponse.json({ success: true, reward });
    } catch (error: unknown) {
      console.error("Revoke reward error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la révocation" },
        { status: 500 }
      );
    }
  },
  { roles: ['RH', 'SUPER_ADMIN'], requireActive: true }
);
