/**
 * Leave Calculator
 * 
 * Computes leave impact on salary for a given month.
 */

import { leaveService } from '@/lib/services/leave-service';
import type { LeaveSummary } from '@/lib/payroll/types';

/**
 * Get leave summary for salary computation
 */
export async function calculateLeaveImpact(
  userId: string,
  year: number,
  month: number
): Promise<LeaveSummary> {
  return leaveService.getMonthlySummary(userId, year, month);
}
