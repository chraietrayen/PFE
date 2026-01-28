/**
 * Security Service
 * Enterprise-grade security features for HR platform
 */

import { prisma } from "@/lib/prisma";
import { auditLogger } from "./audit-logger";
import { notificationService } from "./notification-service";
import crypto from "crypto";

export interface DeviceFingerprintData {
  userAgent: string;
  platform?: string;
  browser?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  plugins?: string[];
  canvas?: string;
  webgl?: string;
}

export interface SecurityCheckResult {
  isAllowed: boolean;
  reason?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiresReview?: boolean;
}

class SecurityService {
  /**
   * Generate device fingerprint hash
   */
  generateFingerprint(data: DeviceFingerprintData): string {
    const fingerprintString = JSON.stringify({
      userAgent: data.userAgent,
      platform: data.platform,
      browser: data.browser,
      screenResolution: data.screenResolution,
      timezone: data.timezone,
      language: data.language,
      plugins: data.plugins?.sort(),
      canvas: data.canvas,
      webgl: data.webgl,
    });
    
    return crypto
      .createHash("sha256")
      .update(fingerprintString)
      .digest("hex");
  }

  /**
   * Register or update device fingerprint
   */
  async registerDevice(
    userId: string,
    fingerprintData: DeviceFingerprintData,
    ipAddress?: string
  ): Promise<{ deviceId: string; isNew: boolean; isTrusted: boolean }> {
    const fingerprintHash = this.generateFingerprint(fingerprintData);
    const fingerprintJson = JSON.stringify(fingerprintData);

    // Check if device already exists
    const existingDevice = await prisma.deviceFingerprint.findFirst({
      where: {
        userId,
        fingerprint: fingerprintJson,
      },
    });

    if (existingDevice) {
      // Update last seen
      await prisma.deviceFingerprint.update({
        where: { id: existingDevice.id },
        data: { lastSeen: new Date() },
      });

      return {
        deviceId: existingDevice.id,
        isNew: false,
        isTrusted: existingDevice.isTrusted,
      };
    }

    // Create new device
    const newDevice = await prisma.deviceFingerprint.create({
      data: {
        userId,
        fingerprint: fingerprintJson,
        userAgent: fingerprintData.userAgent,
        platform: fingerprintData.platform,
        browser: fingerprintData.browser,
        screenResolution: fingerprintData.screenResolution,
        timezone: fingerprintData.timezone,
        language: fingerprintData.language,
        isTrusted: false, // New devices start as untrusted
      },
    });

    // Log new device
    await auditLogger.log({
      action: "NEW_DEVICE_REGISTERED",
      userId,
      entityType: "DEVICE",
      entityId: newDevice.id,
      metadata: JSON.stringify({
        fingerprintHash,
        ipAddress,
        platform: fingerprintData.platform,
        browser: fingerprintData.browser,
      }),
      severity: "INFO",
    });

    // Notify user of new device
    await notificationService.create({
      userId,
      type: "SYSTEM_ALERT",
      title: "Nouveau périphérique détecté",
      message: `Un nouveau périphérique a été détecté lors de votre connexion. Si ce n'est pas vous, veuillez contacter le support.`,
      priority: "HIGH",
      metadata: {
        deviceId: newDevice.id,
        platform: fingerprintData.platform,
        browser: fingerprintData.browser,
      },
    });

    // Notify admins
    const adminIds = await notificationService.getAdminUsers();
    await notificationService.notifyAdminSystemEvent(
      adminIds,
      "Nouveau périphérique enregistré",
      `Utilisateur ${userId} s'est connecté depuis un nouveau périphérique`,
      "NORMAL"
    );

    return {
      deviceId: newDevice.id,
      isNew: true,
      isTrusted: false,
    };
  }

  /**
   * Trust a device
   */
  async trustDevice(deviceId: string, userId: string): Promise<void> {
    await prisma.deviceFingerprint.update({
      where: { id: deviceId, userId },
      data: { isTrusted: true },
    });

    await auditLogger.log({
      action: "DEVICE_TRUSTED",
      userId,
      entityType: "DEVICE",
      entityId: deviceId,
      severity: "INFO",
    });
  }

  /**
   * Check if device is trusted
   */
  async isDeviceTrusted(deviceId: string, userId: string): Promise<boolean> {
    const device = await prisma.deviceFingerprint.findFirst({
      where: { id: deviceId, userId },
      select: { isTrusted: true },
    });

    return device?.isTrusted || false;
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

    // Check 1: Multiple devices in short time
    if (activityType === "LOGIN" || activityType === "POINTAGE") {
      const recentDevices = await prisma.deviceFingerprint.findMany({
        where: {
          userId,
          lastSeen: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
      });

      if (recentDevices.length > 2) {
        checks.push({
          isAllowed: true,
          reason: "Multiple devices detected in short time",
          severity: "MEDIUM",
          requiresReview: true,
        });
      }
    }

    // Check 2: Unusual hours
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

    // Check 3: Rapid successive actions
    if (activityType === "POINTAGE") {
      const recentPointages = await prisma.pointage.findMany({
        where: {
          userId,
          timestamp: {
            gte: new Date(Date.now() - 2 * 60 * 1000), // Last 2 minutes
          },
        },
      });

      if (recentPointages.length > 1) {
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
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: { ipAddress: true },
      distinct: ["ipAddress"],
      take: 10,
    });

    // If no history, allow
    if (recentLogs.length === 0) return true;

    // Check if current IP is in recent history
    return recentLogs.some((log) => log.ipAddress === currentIP);
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
    const anomaly = await prisma.anomaly.create({
      data: {
        type: type as any,
        severity: severity as any,
        entityType,
        entityId,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        status: "PENDING",
      },
    });

    // Log anomaly
    await auditLogger.log({
      action: "ANOMALY_DETECTED",
      entityType,
      entityId,
      metadata: JSON.stringify({ anomalyId: anomaly.id, type, severity }),
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

    return anomaly.id;
  }

  /**
   * Get user's trusted devices
   */
  async getUserDevices(userId: string) {
    return await prisma.deviceFingerprint.findMany({
      where: { userId },
      orderBy: { lastSeen: "desc" },
      select: {
        id: true,
        platform: true,
        browser: true,
        isTrusted: true,
        firstSeen: true,
        lastSeen: true,
        userAgent: true,
      },
    });
  }

  /**
   * Revoke device trust
   */
  async revokeDeviceTrust(deviceId: string, userId: string): Promise<void> {
    await prisma.deviceFingerprint.update({
      where: { id: deviceId, userId },
      data: { isTrusted: false },
    });

    await auditLogger.log({
      action: "DEVICE_TRUST_REVOKED",
      userId,
      entityType: "DEVICE",
      entityId: deviceId,
      severity: "INFO",
    });
  }

  /**
   * Delete device
   */
  async deleteDevice(deviceId: string, userId: string): Promise<void> {
    await prisma.deviceFingerprint.delete({
      where: { id: deviceId, userId },
    });

    await auditLogger.log({
      action: "DEVICE_DELETED",
      userId,
      entityType: "DEVICE",
      entityId: deviceId,
      severity: "INFO",
    });
  }

  /**
   * Validate session integrity
   */
  async validateSession(userId: string, sessionToken: string): Promise<boolean> {
    const session = await prisma.session.findFirst({
      where: {
        userId,
        sessionToken,
        expires: { gt: new Date() },
      },
    });

    return !!session;
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
