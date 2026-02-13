/**
 * Salary Calculator
 * 
 * Pure computation: takes attendance, leaves, rewards, and employment terms
 * and produces the final salary breakdown.
 * 
 * Formula:
 *   grossSalary = baseSalary + overtimePay + rewardBonus
 *   deductions  = absenceDeduction + unpaidLeaveDeduction
 *   netSalary   = grossSalary - deductions
 */

import {
  OVERTIME_MULTIPLIER,
  STANDARD_HOURS_PER_DAY,
  countWorkDaysInMonth,
} from '@/lib/payroll/constants';
import type {
  AttendanceCalculation,
  LeaveSummary,
  RewardSummary,
  EmploymentTerms,
  SalaryBreakdown,
} from '@/lib/payroll/types';

/**
 * Compute the full salary breakdown for one employee for one month
 */
export function computeSalary(
  terms: EmploymentTerms,
  attendance: AttendanceCalculation,
  leaves: LeaveSummary,
  rewards: RewardSummary,
  year: number,
  month: number
): SalaryBreakdown {
  const workDaysInMonth = countWorkDaysInMonth(year, month);
  const baseSalary = terms.baseSalary;
  const dailyRate = baseSalary / workDaysInMonth;
  const hourlyRate = terms.hourlyRate > 0
    ? terms.hourlyRate
    : dailyRate / STANDARD_HOURS_PER_DAY;

  // ── Earnings ────────────────────────────────────────────

  // Base pay is the full monthly salary (deductions happen below)
  const workedDaysPay = baseSalary;

  // Overtime pay
  const overtimePay = round2(attendance.overtimeHours * hourlyRate * OVERTIME_MULTIPLIER);

  // Reward bonus
  const rewardBonus = round2(rewards.totalBonus);

  // ── Deductions ──────────────────────────────────────────

  // Absence deduction: each absent day deducts a daily rate
  const absenceDeduction = round2(attendance.absentDays * dailyRate);

  // Partial day deduction: half-day absence deducts half daily rate
  // (partial days where employee only worked one session)
  const partialDeduction = round2(attendance.partialDays * dailyRate * 0.5);

  // Unpaid leave deduction
  const unpaidLeaveDeduction = round2(leaves.unpaidDays * dailyRate);

  const totalDeductions = round2(absenceDeduction + partialDeduction + unpaidLeaveDeduction);

  // ── Totals ──────────────────────────────────────────────

  const grossSalary = round2(workedDaysPay + overtimePay + rewardBonus);
  const netSalary = round2(grossSalary - totalDeductions);

  return {
    baseSalary,
    dailyRate: round2(dailyRate),
    hourlyRate: round2(hourlyRate),

    workedDaysPay: round2(workedDaysPay),
    overtimePay,
    rewardBonus,

    absenceDeduction: round2(absenceDeduction + partialDeduction),
    unpaidLeaveDeduction,
    totalDeductions,

    paidLeaveDays: leaves.paidDays,
    unpaidLeaveDays: leaves.unpaidDays,
    sickLeaveDays: leaves.sickDays,
    otherLeaveDays: leaves.otherDays + leaves.maternityDays,

    rewardDays: rewards.totalDays,

    grossSalary,
    netSalary,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
