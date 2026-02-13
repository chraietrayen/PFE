"use client";

/**
 * Attendance Session Widget
 * 
 * Displays today's attendance sessions (morning + afternoon).
 * Allows check-in/check-out with button locking.
 */

import { useState, useEffect, useCallback } from "react";
import { Clock, LogIn, LogOut, Sun, Sunset, AlertTriangle, CheckCircle } from "lucide-react";

interface Session {
  id: string;
  sessionType: "MORNING" | "AFTERNOON";
  checkIn: string | null;
  checkOut: string | null;
  durationMinutes: number | null;
  status: string;
  anomalyDetected: boolean;
  anomalyReason: string | null;
}

interface TodayStatus {
  morning: Session | null;
  afternoon: Session | null;
  dayStatus: string;
}

export default function AttendanceSessionWidget() {
  const [status, setStatus] = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/session");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      console.error("Failed to fetch attendance status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Refresh every 60s
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleAction = async (action: "CHECK_IN" | "CHECK_OUT", sessionType: "MORNING" | "AFTERNOON") => {
    const key = `${action}_${sessionType}`;
    setActionLoading(key);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/attendance/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, sessionType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors du pointage");
        return;
      }

      setSuccess(data.message);
      await fetchStatus();

      // Clear success after 3s
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const currentHour = now.getHours();
  const isBeforeNoon = currentHour < 12;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Pointage du jour
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="space-y-4">
        {/* Morning Session */}
        <SessionCard
          label="Matin"
          icon={<Sun className="w-5 h-5 text-amber-500" />}
          session={status?.morning || null}
          sessionType="MORNING"
          isActive={isBeforeNoon}
          actionLoading={actionLoading}
          onAction={handleAction}
        />

        {/* Afternoon Session */}
        <SessionCard
          label="Après-midi"
          icon={<Sunset className="w-5 h-5 text-orange-500" />}
          session={status?.afternoon || null}
          sessionType="AFTERNOON"
          isActive={!isBeforeNoon}
          actionLoading={actionLoading}
          onAction={handleAction}
        />
      </div>
    </div>
  );
}

function SessionCard({
  label,
  icon,
  session,
  sessionType,
  isActive,
  actionLoading,
  onAction,
}: {
  label: string;
  icon: React.ReactNode;
  session: Session | null;
  sessionType: "MORNING" | "AFTERNOON";
  isActive: boolean;
  actionLoading: string | null;
  onAction: (action: "CHECK_IN" | "CHECK_OUT", st: "MORNING" | "AFTERNOON") => void;
}) {
  const hasCheckedIn = !!session?.checkIn;
  const hasCheckedOut = !!session?.checkOut;
  const isComplete = hasCheckedIn && hasCheckedOut;
  const isCheckInLoading = actionLoading === `CHECK_IN_${sessionType}`;
  const isCheckOutLoading = actionLoading === `CHECK_OUT_${sessionType}`;

  const statusColor = isComplete
    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : hasCheckedIn
    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
    : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400";

  const statusLabel = isComplete
    ? "Terminé"
    : hasCheckedIn
    ? "En cours"
    : "Non pointé";

  return (
    <div className={`p-4 rounded-lg border ${
      isActive ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10" : "border-gray-200 dark:border-gray-700"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-900 dark:text-white">{label}</span>
          {isActive && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Session active
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        {hasCheckedIn && (
          <span>Entrée: {formatTime(session!.checkIn!)}</span>
        )}
        {hasCheckedOut && (
          <span>Sortie: {formatTime(session!.checkOut!)}</span>
        )}
        {session?.durationMinutes && (
          <span className="font-medium">
            Durée: {Math.floor(session.durationMinutes / 60)}h{(session.durationMinutes % 60).toString().padStart(2, "0")}
          </span>
        )}
      </div>

      {session?.anomalyDetected && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {session.anomalyReason}
        </div>
      )}

      {!isComplete && (
        <div className="mt-3 flex gap-2">
          {!hasCheckedIn && (
            <button
              onClick={() => onAction("CHECK_IN", sessionType)}
              disabled={isCheckInLoading || !!actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {isCheckInLoading ? "Enregistrement..." : "Pointer entrée"}
            </button>
          )}
          {hasCheckedIn && !hasCheckedOut && (
            <button
              onClick={() => onAction("CHECK_OUT", sessionType)}
              disabled={isCheckOutLoading || !!actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {isCheckOutLoading ? "Enregistrement..." : "Pointer sortie"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
