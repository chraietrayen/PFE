/**
 * Export API Routes
 * Professional export functionality with role-based access control
 * Supports session-aware exports for all user roles
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/rbac";
import { exportService, ExportOptions } from "@/lib/services/export-service";
import { auditLogger } from "@/lib/services/audit-logger";

/**
 * GET /api/exports
 * Export data based on type and user permissions
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "pointages";
    const format = searchParams.get("format") || "csv";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const status = searchParams.get("status");
    const department = searchParams.get("department");
    const targetUserId = searchParams.get("userId");

    console.log(`📤 Export request: type=${type}, format=${format}, user=${user.id} (${user.role})`);

    const options: ExportOptions = {
      format: format as 'excel' | 'csv' | 'pdf',
      filters: {}
    };

    // Parse date range
    if (startDate && endDate) {
      options.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    // Add filters
    if (status) options.filters!.status = status;
    if (department) options.filters!.department = department;
    if (targetUserId) options.filters!.userId = targetUserId;

    let result;

    switch (type) {
      case "employees":
        result = await exportService.exportEmployees(user.id, user.role, options);
        break;
      
      case "pointages":
        result = await exportService.exportPointages(user.id, user.role, options);
        break;
      
      case "conges":
        result = await exportService.exportConges(user.id, user.role, options);
        break;
      
      case "audit":
        result = await exportService.exportAuditLogs(user.id, user.role, options);
        break;
      
      case "monthly":
        const y = year ? parseInt(year) : new Date().getFullYear();
        const m = month ? parseInt(month) : new Date().getMonth() + 1;
        result = await exportService.exportMonthlyReport(user.id, user.role, y, m);
        break;
      
      case "personal":
        const py = year ? parseInt(year) : new Date().getFullYear();
        const pm = month ? parseInt(month) : new Date().getMonth() + 1;
        result = await exportService.exportPersonalSummary(user.id, py, pm);
        break;
      
      default:
        return NextResponse.json(
          { error: `Unknown export type: ${type}` },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Export failed" },
        { status: 403 }
      );
    }

    // Log the export action
    await auditLogger.log({
      action: "EXPORT_DATA",
      userId: user.id,
      entityType: type.toUpperCase(),
      metadata: JSON.stringify({
        type,
        format,
        dateRange: options.dateRange,
        filters: options.filters
      }),
      severity: "INFO"
    });

    // Return the file as download
    const headers = new Headers();
    headers.set("Content-Type", result.mimeType);
    headers.set("Content-Disposition", `attachment; filename="${result.fileName}"`);
    headers.set("Cache-Control", "no-cache");

    // Convert Buffer to string if necessary
    const responseBody = typeof result.data === 'string' 
      ? result.data 
      : Buffer.isBuffer(result.data) 
        ? result.data.toString('utf-8') 
        : '';

    return new NextResponse(responseBody, {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error("❌ Export error:", error);
    return NextResponse.json(
      { error: "Export failed: " + error.message },
      { status: 500 }
    );
  }
});

/**
 * POST /api/exports
 * Request an export with more complex options
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const { type, options, schedule } = body;

    console.log(`📤 Export POST request: type=${type}, user=${user.id}`);

    // For scheduled exports (future feature)
    if (schedule) {
      // TODO: Implement scheduled exports with a job queue
      return NextResponse.json(
        { message: "Scheduled exports are not yet implemented" },
        { status: 501 }
      );
    }

    let result;
    const exportOptions: ExportOptions = {
      format: options?.format || 'csv',
      dateRange: options?.dateRange,
      filters: options?.filters || {},
      columns: options?.columns
    };

    switch (type) {
      case "employees":
        result = await exportService.exportEmployees(user.id, user.role, exportOptions);
        break;
      
      case "pointages":
        result = await exportService.exportPointages(user.id, user.role, exportOptions);
        break;
      
      case "conges":
        result = await exportService.exportConges(user.id, user.role, exportOptions);
        break;
      
      case "audit":
        result = await exportService.exportAuditLogs(user.id, user.role, exportOptions);
        break;
      
      default:
        return NextResponse.json(
          { error: `Unknown export type: ${type}` },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Export failed" },
        { status: 403 }
      );
    }

    // Log the export action
    await auditLogger.log({
      action: "EXPORT_DATA",
      userId: user.id,
      entityType: type.toUpperCase(),
      metadata: JSON.stringify({ type, options: exportOptions }),
      severity: "INFO"
    });

    const headers = new Headers();
    headers.set("Content-Type", result.mimeType);
    headers.set("Content-Disposition", `attachment; filename="${result.fileName}"`);
    headers.set("Cache-Control", "no-cache");

    // Convert Buffer to string if necessary
    const responseBody = typeof result.data === 'string' 
      ? result.data 
      : Buffer.isBuffer(result.data) 
        ? result.data.toString('utf-8') 
        : '';

    return new NextResponse(responseBody, {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error("❌ Export error:", error);
    return NextResponse.json(
      { error: "Export failed: " + error.message },
      { status: 500 }
    );
  }
});
