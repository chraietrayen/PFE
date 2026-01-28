/**
 * Employee Dashboard Component
 * Complete dashboard for USER role with all features
 */

"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DashboardStats {
  attendance: {
    thisMonth: number;
    thisWeek: number;
    todayStatus: "checked-in" | "checked-out" | "not-started";
    lastCheckIn?: Date;
    lastCheckOut?: Date;
  };
  leaves: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  anomalies: {
    count: number;
    recent: Array<{
      id: string;
      type: string;
      description: string;
      date: Date;
    }>;
  };
}

export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayStatus, setTodayStatus] = useState<{
    hasCheckedIn: boolean;
    hasCheckedOut: boolean;
    checkInTime?: string;
    checkOutTime?: string;
  } | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboardData();
      fetchTodayStatus();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/employees/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStatus = async () => {
    try {
      const response = await fetch("/api/pointage/today-status");
      if (response.ok) {
        const data = await response.json();
        setTodayStatus(data);
      }
    } catch (error) {
      console.error("Error fetching today status:", error);
    }
  };

  const handleCheckIn = async () => {
    router.push("/pointage?action=check-in");
  };

  const handleCheckOut = async () => {
    router.push("/pointage?action=check-out");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Tableau de bord Employé
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Bienvenue, {session?.user?.name || session?.user?.email}
              </p>
            </div>
            <div className="flex gap-3">
              {todayStatus && !todayStatus.hasCheckedIn && (
                <button
                  onClick={handleCheckIn}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg"
                >
                  Pointer l'entrée
                </button>
              )}
              {todayStatus && todayStatus.hasCheckedIn && !todayStatus.hasCheckedOut && (
                <button
                  onClick={handleCheckOut}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg"
                >
                  Pointer la sortie
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today Status Card */}
        {todayStatus && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 mb-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Statut d'aujourd'hui</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-sm opacity-90">État</p>
                <p className="text-2xl font-bold mt-1">
                  {todayStatus.hasCheckedOut
                    ? "✅ Journée terminée"
                    : todayStatus.hasCheckedIn
                    ? "🟢 En service"
                    : "⭕ Non commencé"}
                </p>
              </div>
              {todayStatus.checkInTime && (
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <p className="text-sm opacity-90">Entrée</p>
                  <p className="text-2xl font-bold mt-1">
                    {new Date(todayStatus.checkInTime).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
              {todayStatus.checkOutTime && (
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <p className="text-sm opacity-90">Sortie</p>
                  <p className="text-2xl font-bold mt-1">
                    {new Date(todayStatus.checkOutTime).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Attendance Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Présence ce mois
              </h3>
              <span className="text-3xl">📅</span>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats?.attendance.thisMonth || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              jours de présence
            </p>
          </div>

          {/* Leaves Pending */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Congés en attente
              </h3>
              <span className="text-3xl">⏳</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats?.leaves.pending || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              demandes en attente
            </p>
          </div>

          {/* Leaves Approved */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Congés approuvés
              </h3>
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats?.leaves.approved || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              demandes approuvées
            </p>
          </div>

          {/* Anomalies */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Anomalies
              </h3>
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {stats?.anomalies.count || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              anomalies détectées
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => router.push("/conges")}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-left"
          >
            <div className="text-4xl mb-3">🏖️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Demander un congé
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Soumettre une nouvelle demande de congé
            </p>
          </button>

          <button
            onClick={() => router.push("/pointage")}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-left"
          >
            <div className="text-4xl mb-3">⏰</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Mon pointage
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Voir l'historique de mes pointages
            </p>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-left"
          >
            <div className="text-4xl mb-3">👤</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Mon profil
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gérer mes informations personnelles
            </p>
          </button>
        </div>

        {/* Recent Anomalies */}
        {stats?.anomalies.recent && stats.anomalies.recent.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Anomalies récentes
            </h2>
            <div className="space-y-3">
              {stats.anomalies.recent.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {anomaly.type}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {anomaly.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {new Date(anomaly.date).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
