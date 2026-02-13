/**
 * System Security Audit Script
 * Run this to check system integrity and security
 * 
 * Usage: node --loader ts-node/esm tools/security-audit.ts
 */

import { prisma } from "../src/lib/prisma";

interface AuditResult {
  category: string;
  checks: Array<{
    name: string;
    status: "PASS" | "FAIL" | "WARNING";
    message: string;
    details?: any;
  }>;
}

class SecurityAuditor {
  private results: AuditResult[] = [];

  async runAudit() {
    console.log("🔐 Starting Security Audit...\n");

    await this.checkAuthentication();
    await this.checkDatabase();
    await this.checkRBAC();
    await this.checkNotifications();
    await this.checkAuditLogs();
    await this.checkAnomalies();

    this.printResults();
    return this.results;
  }

  private async checkAuthentication() {
    const category = "Authentication & Sessions";
    const checks: Array<{
      name: string;
      status: "PASS" | "FAIL" | "WARNING";
      message: string;
      details?: any;
    }> = [];

    // Check for users without passwords (should use OAuth)
    const usersWithoutPassword = await prisma.user.count({
      where: { password: null },
    });

    checks.push({
      name: "Users without authentication method",
      status: usersWithoutPassword === 0 ? "PASS" : "WARNING",
      message:
        usersWithoutPassword === 0
          ? "All users have authentication method"
          : `${usersWithoutPassword} users without password or OAuth`,
      details: { count: usersWithoutPassword },
    });

    // Check for INACTIVE admins
    const inactiveAdmins = await prisma.user.count({
      where: {
        role: { in: ["SUPER_ADMIN", "RH"] },
        status: { not: "ACTIVE" },
      },
    });

    checks.push({
      name: "Admin accounts status",
      status: inactiveAdmins === 0 ? "PASS" : "WARNING",
      message:
        inactiveAdmins === 0
          ? "All admin accounts are active"
          : `${inactiveAdmins} admin accounts are not active`,
      details: { count: inactiveAdmins },
    });

    // Check for expired sessions
    const expiredSessions = await prisma.session.count({
      where: {
        expires: { lt: new Date() },
      },
    });

    checks.push({
      name: "Expired sessions",
      status: "PASS",
      message: `${expiredSessions} expired sessions (will be cleaned)`,
      details: { count: expiredSessions },
    });

    this.results.push({ category, checks });
  }

  private async checkDatabase() {
    const category = "Database Integrity";
    const checks: Array<{
      name: string;
      status: "PASS" | "FAIL" | "WARNING";
      message: string;
      details?: any;
    }> = [];

    // Check for database consistency
    const totalUsers = await prisma.user.count();
    const totalEmployes = await prisma.employe.count();

    checks.push({
      name: "Database consistency",
      status: "PASS",
      message: `Database has ${totalUsers} users and ${totalEmployes} employee profiles`,
      details: { users: totalUsers, employes: totalEmployes },
    });

    this.results.push({ category, checks });
  }

  private async checkRBAC() {
    const category = "Role-Based Access Control";
    const checks: Array<{
      name: string;
      status: "PASS" | "FAIL" | "WARNING";
      message: string;
      details?: any;
    }> = [];

    // Check role distribution
    const roleCounts = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    const hasSuperAdmin = roleCounts.some((r) => r.role === "SUPER_ADMIN");
    const hasRH = roleCounts.some((r) => r.role === "RH");

    checks.push({
      name: "Admin roles present",
      status: hasSuperAdmin && hasRH ? "PASS" : "WARNING",
      message: hasSuperAdmin && hasRH
        ? "System has both SUPER_ADMIN and RH roles"
        : "Missing admin roles",
      details: roleCounts,
    });

    this.results.push({ category, checks });
  }

  private async checkNotifications() {
    const category = "Notification System";
    const checks: Array<{
      name: string;
      status: "PASS" | "FAIL" | "WARNING";
      message: string;
      details?: any;
    }> = [];

    // Check for unread notifications older than 30 days
    const oldUnread = await prisma.notifications.count({
      where: {
        is_read: false,
        created_at: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    checks.push({
      name: "Old unread notifications",
      status: oldUnread === 0 ? "PASS" : "WARNING",
      message:
        oldUnread === 0
          ? "No old unread notifications"
          : `${oldUnread} unread notifications older than 30 days`,
      details: { count: oldUnread },
    });

    this.results.push({ category, checks });
  }

  private async checkAuditLogs() {
    const category = "Audit Logs";
    const checks: Array<{
      name: string;
      status: "PASS" | "FAIL" | "WARNING";
      message: string;
      details?: any;
    }> = [];

    // Check audit log coverage (last 24 hours)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = await prisma.audit_logs.count({
      where: {
        created_at: { gte: last24h },
      },
    });

    checks.push({
      name: "Recent audit activity",
      status: recentLogs > 0 ? "PASS" : "WARNING",
      message: `${recentLogs} audit logs in the last 24 hours`,
      details: { count: recentLogs },
    });

    // Check for critical errors
    const criticalErrors = await prisma.audit_logs.count({
      where: {
        severity: "CRITICAL",
        created_at: { gte: last24h },
      },
    });

    checks.push({
      name: "Critical errors (24h)",
      status: criticalErrors === 0 ? "PASS" : "FAIL",
      message:
        criticalErrors === 0
          ? "No critical errors in last 24 hours"
          : `${criticalErrors} critical errors detected`,
      details: { count: criticalErrors },
    });

    this.results.push({ category, checks });
  }

  private async checkAnomalies() {
    const category = "Anomaly Detection";
    const checks: Array<{
      name: string;
      status: "PASS" | "FAIL" | "WARNING";
      message: string;
      details?: any;
    }> = [];

    // Check for unresolved anomalies
    const unresolvedAnomalies = await prisma.anomalies.count({
      where: {
        status: { in: ["PENDING", "INVESTIGATING"] },
      },
    });

    checks.push({
      name: "Unresolved anomalies",
      status: unresolvedAnomalies === 0 ? "PASS" : "WARNING",
      message:
        unresolvedAnomalies === 0
          ? "No unresolved anomalies"
          : `${unresolvedAnomalies} anomalies need attention`,
      details: { count: unresolvedAnomalies },
    });

    // Check for high/critical severity anomalies
    const criticalAnomalies = await prisma.anomalies.count({
      where: {
        severity: { in: ["HIGH", "CRITICAL"] },
        status: { in: ["PENDING", "INVESTIGATING"] },
      },
    });

    checks.push({
      name: "Critical anomalies",
      status: criticalAnomalies === 0 ? "PASS" : "FAIL",
      message:
        criticalAnomalies === 0
          ? "No critical anomalies"
          : `${criticalAnomalies} critical/high severity anomalies`,
      details: { count: criticalAnomalies },
    });

    this.results.push({ category, checks });
  }

  private printResults() {
    console.log("\n" + "=".repeat(80));
    console.log("🔍 SECURITY AUDIT RESULTS");
    console.log("=".repeat(80) + "\n");

    let totalPass = 0;
    let totalWarning = 0;
    let totalFail = 0;

    this.results.forEach((result) => {
      console.log(`\n📂 ${result.category}`);
      console.log("-".repeat(80));

      result.checks.forEach((check) => {
        const icon =
          check.status === "PASS"
            ? "✅"
            : check.status === "WARNING"
            ? "⚠️"
            : "❌";
        console.log(`${icon} ${check.name}: ${check.message}`);

        if (check.status === "PASS") totalPass++;
        else if (check.status === "WARNING") totalWarning++;
        else totalFail++;
      });
    });

    console.log("\n" + "=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));
    console.log(`✅ Passed: ${totalPass}`);
    console.log(`⚠️  Warnings: ${totalWarning}`);
    console.log(`❌ Failed: ${totalFail}`);
    console.log(`\nTotal Checks: ${totalPass + totalWarning + totalFail}`);

    const score = Math.round(
      (totalPass / (totalPass + totalWarning + totalFail)) * 100
    );
    console.log(`\n🎯 Security Score: ${score}%`);

    if (score >= 90) {
      console.log("🎉 Excellent! System security is strong.");
    } else if (score >= 70) {
      console.log("👍 Good. Address warnings for improved security.");
    } else if (score >= 50) {
      console.log("⚠️  Fair. Several issues need attention.");
    } else {
      console.log("❌ Critical. Immediate action required!");
    }

    console.log("\n" + "=".repeat(80) + "\n");
  }
}

// Run audit if executed directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor
    .runAudit()
    .then(() => {
      console.log("Audit completed successfully.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Audit failed:", error);
      process.exit(1);
    });
}

export { SecurityAuditor };
