"use client";

/**
 * Salary Estimation Widget
 * 
 * Shows current month salary estimation for the employee.
 * Includes worked days progress, deductions preview, and estimated net.
 */

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Calendar } from "lucide-react";

interface SalaryEstimate {
  baseSalary: number;
  estimatedNet: number;
  workedDays: number;
  expectedDays: number;
  attendanceRate: number;
}

interface LeaveBalance {
  annualAllowance: number;
  used: number;
  pending: number;
  remaining: number;
}

interface DashboardData {
  today: {
    date: string;
    morning: unknown;
    afternoon: unknown;
  };
  monthProgress: {
    year: number;
    month: number;
    workedDays: number;
    expectedDays: number;
    totalWorkedHours: number;
    progressPercent: number;
  };
  salaryEstimate: SalaryEstimate | null;
  leaveBalance: LeaveBalance | null;
}

export default function SalaryEstimationWidget() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/payroll/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      console.error("Failed to fetch dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  const salary = data?.salaryEstimate;
  const progress = data?.monthProgress;
  const leave = data?.leaveBalance;

  return (
    <div className="space-y-4">
      {/* Month Progress */}
      {progress && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Progression du mois
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <StatBox label="Jours travaillés" value={`${progress.workedDays}/${progress.expectedDays}`} />
            <StatBox label="Heures totales" value={`${progress.totalWorkedHours}h`} />
            <StatBox label="Taux de présence" value={`${progress.progressPercent}%`} />
            <StatBox
              label="Jours restants"
              value={String(Math.max(0, progress.expectedDays - progress.workedDays))}
            />
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progress.progressPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Salary Estimation */}
      {salary && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            Estimation de salaire
          </h3>

          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Salaire net estimé</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {salary.estimatedNet.toLocaleString("fr-FR")} <span className="text-base font-normal text-gray-500">TND</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Salaire de base</p>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {salary.baseSalary.toLocaleString("fr-FR")} TND
              </p>
            </div>
          </div>

          {salary.estimatedNet < salary.baseSalary ? (
            <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
              <TrendingDown className="w-4 h-4" />
              Déduction de {(salary.baseSalary - salary.estimatedNet).toLocaleString("fr-FR")} TND (absences)
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4" />
              Aucune déduction ce mois
            </div>
          )}

          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            * Estimation basée sur le pointage actuel. Le montant final peut varier.
          </p>
        </div>
      )}

      {/* Leave Balance */}
      {leave && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-600" />
            Solde de congés
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBox label="Droit annuel" value={String(leave.annualAllowance)} unit="jours" />
            <StatBox label="Utilisés" value={String(leave.used)} unit="jours" color="red" />
            <StatBox label="En attente" value={String(leave.pending)} unit="jours" color="yellow" />
            <StatBox label="Restant" value={String(leave.remaining)} unit="jours" color="green" />
          </div>

          {/* Usage bar */}
          <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="flex h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-full"
                style={{ width: `${(leave.used / leave.annualAllowance) * 100}%` }}
              />
              <div
                className="bg-yellow-500 h-full"
                style={{ width: `${(leave.pending / leave.annualAllowance) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  color?: "green" | "red" | "yellow";
}) {
  const colorClasses = {
    green: "text-green-600 dark:text-green-400",
    red: "text-red-600 dark:text-red-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
  };

  return (
    <div className="text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color ? colorClasses[color] : "text-gray-900 dark:text-white"}`}>
        {value}
        {unit && <span className="text-xs font-normal ml-1">{unit}</span>}
      </p>
    </div>
  );
}
