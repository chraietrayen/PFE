/**
 * Reward Service
 * 
 * Manages reward days for employees.
 * Reward days count as worked days and can include a salary bonus.
 */

import prisma from '@/lib/prisma';
import { toDateString, isWorkDay } from '@/lib/payroll/constants';
import type { RewardRecord, RewardSummary } from '@/lib/payroll/types';

class RewardService {
  /**
   * Grant a reward day to an employee
   */
  async grantReward(params: {
    userId: string;
    date: Date;
    reason: string;
    grantedById: string;
    salaryImpact?: number;
  }): Promise<{ success: boolean; reward?: RewardRecord; error?: string }> {
    const { userId, date, reason, grantedById, salaryImpact = 0 } = params;
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Check for duplicate
    const existing = await prisma.rewardDay.findUnique({
      where: {
        userId_date: { userId, date: dateOnly },
      },
    });

    if (existing) {
      return { success: false, error: 'Un jour de récompense existe déjà pour cette date' };
    }

    const reward = await prisma.rewardDay.create({
      data: {
        userId,
        date: dateOnly,
        reason,
        grantedById,
        salaryImpact,
        status: 'APPROVED',
      },
    });

    // Create attendance sessions for this reward day (counts as worked)
    if (isWorkDay(dateOnly)) {
      for (const session of ['MORNING', 'AFTERNOON'] as const) {
        await prisma.attendanceSession.upsert({
          where: {
            userId_date_sessionType: {
              userId,
              date: dateOnly,
              sessionType: session,
            },
          },
          create: {
            userId,
            date: dateOnly,
            sessionType: session,
            status: 'REWARD',
            durationMinutes: 240, // 4h credit per session
          },
          update: {
            status: 'REWARD',
            durationMinutes: 240,
          },
        });
      }
    }

    return { success: true, reward: this.toRecord(reward) };
  }

  /**
   * Revoke a reward day
   */
  async revokeReward(rewardId: string): Promise<RewardRecord> {
    const reward = await prisma.rewardDay.update({
      where: { id: rewardId },
      data: { status: 'REVOKED' },
    });

    // Remove reward attendance sessions
    await prisma.attendanceSession.deleteMany({
      where: {
        userId: reward.userId,
        date: reward.date,
        status: 'REWARD',
      },
    });

    return this.toRecord(reward);
  }

  /**
   * Get reward summary for a month (used by payroll engine)
   */
  async getMonthlySummary(
    userId: string,
    year: number,
    month: number
  ): Promise<RewardSummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const rewards = await prisma.rewardDay.findMany({
      where: {
        userId,
        status: 'APPROVED',
        date: { gte: startDate, lte: endDate },
      },
    });

    return {
      totalDays: rewards.length,
      totalBonus: rewards.reduce((sum, r) => sum + r.salaryImpact, 0),
      records: rewards.map(r => this.toRecord(r)),
    };
  }

  /**
   * Get all rewards for a user
   */
  async getUserRewards(userId: string, year?: number) {
    const where: Record<string, unknown> = { userId };
    if (year) {
      where.date = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      };
    }

    return prisma.rewardDay.findMany({
      where: where as NonNullable<Parameters<typeof prisma.rewardDay.findMany>[0]>['where'],
      include: {
        grantedBy: { select: { id: true, name: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Get all rewards (for RH/Admin dashboard)
   */
  async getAllRewards(year: number, month?: number) {
    const startDate = month
      ? new Date(year, month - 1, 1)
      : new Date(year, 0, 1);
    const endDate = month
      ? new Date(year, month, 0)
      : new Date(year, 11, 31);

    return prisma.rewardDay.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status: 'APPROVED',
      },
      include: {
        user: { select: { id: true, name: true, lastName: true, email: true } },
        grantedBy: { select: { id: true, name: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  private toRecord(reward: {
    id: string;
    userId: string;
    date: Date;
    reason: string;
    grantedById: string;
    salaryImpact: number;
    status: string;
  }): RewardRecord {
    return {
      id: reward.id,
      userId: reward.userId,
      date: reward.date,
      reason: reward.reason,
      grantedById: reward.grantedById,
      salaryImpact: reward.salaryImpact,
      status: reward.status as 'APPROVED' | 'REVOKED',
    };
  }
}

export const rewardService = new RewardService();
