/**
 * Security Service
 * Enterprise-grade security features for HR platform
 */

import { query, execute } from "@/lib/mysql-direct";
import { auditLogger } from "./audit-logger";
import { notificationService } from "./notification-service";
import crypto from "crypto";

export interface SecurityCheckResult {
  isAllowed: boolean;
  reason?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiresReview?: boolean;
}

class SecurityService {
  /**
   * Generate a fingerprint hash from a string
   */
  generateFingerprint(data: string): string {
    return crypto
      .createHash("sha256")
      .update(data)
      .digest("hex");
  }

  /**
   * Detect unusual activity
   */
  async detectUnusualActivity(
    userId: string,
    activityType: string,
    metadata: any
  ): Promise<SecurityCheckResult> {
    const checks: SecurityCheckResult[] = [];

    // Check 1: Unusual hours
    if (activityType === "POINTAGE") {
      const hour = new Date().getHours();
      if (hour < 6 || hour > 22) {
        checks.push({
          isAllowed: true,
          reason: "Pointage outside normal hours",
          severity: "LOW",
          requiresReview: true,
        });
      }
    }

    // Check 2: Rapid successive actions
    if (activityType === "POINTAGE") {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const recentPointages = await query(
        `SELECT COUNT(*) as count FROM Pointage WHERE user_id = ? AND timestamp >= ?`,
        [userId, twoMinutesAgo]
      ) as any[];

      if (recentPointages[0]?.count > 1) {
        checks.push({
          isAllowed: false,
          reason: "Duplicate pointage in short time",
          severity: "HIGH",
          requiresReview: true,
        });
      }
    }

    // Return most severe check
    const severeCheck = checks.find((c) => c.severity === "CRITICAL") ||
      checks.find((c) => c.severity === "HIGH") ||
      checks.find((c) => c.severity === "MEDIUM") ||
      checks.find((c) => c.severity === "LOW");

    return severeCheck || { isAllowed: true };
  }

  /**
   * Verify IP address consistency
   */
  async verifyIPConsistency(
    userId: string,
    currentIP: string
  ): Promise<boolean> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentLogs = await query(
      `SELECT DISTINCT ip_address FROM audit_logs WHERE user_id = ? AND created_at >= ? LIMIT 10`,
      [userId, sevenDaysAgo]
    ) as any[];

    // If no history, allow
    if (recentLogs.length === 0) return true;

    // Check if current IP is in recent history
    return recentLogs.some((log: any) => log.ip_address === currentIP);
  }

  /**
   * Create anomaly record
   */
  async createAnomaly(
    type: string,
    severity: string,
    entityType: string,
    entityId: string,
    description: string,
    metadata?: any
  ): Promise<string> {
    const anomalyId = `anom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await execute(
      `INSERT INTO anomalies (id, type, severity, entity_type, entity_id, description, metadata, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
      [anomalyId, type, severity, entityType, entityId, description, metadata ? JSON.stringify(metadata) : null]
    );

    // Log anomaly
    await auditLogger.log({
      action: "ANOMALY_DETECTED",
      entityType,
      entityId,
      metadata: JSON.stringify({ anomalyId, type, severity }),
      severity: severity as any,
    });

    // Notify RH and admins for HIGH and CRITICAL anomalies
    if (severity === "HIGH" || severity === "CRITICAL") {
      const rhIds = await notificationService.getRHUsers();
      await notificationService.notifyAdminSystemEvent(
        rhIds,
        `Anomalie ${severity} détectée`,
        description,
        severity === "CRITICAL" ? "URGENT" : "HIGH"
      );
    }

    return anomalyId;
  }

  /**
   * Get IP address from request
   */
  getIPAddress(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const real = req.headers.get("x-real-ip");
    
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    
    if (real) {
      return real;
    }
    
    return "unknown";
  }
}

export const securityService = new SecurityService();
