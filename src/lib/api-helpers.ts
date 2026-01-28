/**
 * API Route Helper Utilities
 * Provides consistent error handling, authentication, and RBAC for all API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { auditLogger } from "@/lib/services/audit-logger";
import { securityService } from "@/lib/services/security-service";

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: "SUPER_ADMIN" | "RH" | "USER";
  status: "INACTIVE" | "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
}

export interface APIContext {
  user: SessionUser;
  request: NextRequest;
  ipAddress: string;
}

type APIHandler<T = any> = (
  context: APIContext,
  ...args: any[]
) => Promise<NextResponse<T>>;

/**
 * Wrap API route with authentication
 */
export function withAuth(handler: APIHandler) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user) {
        return NextResponse.json(
          { error: "Non autorisé. Veuillez vous connecter." },
          { status: 401 }
        );
      }

      const user = session.user as SessionUser;
      const ipAddress = securityService.getIPAddress(req);

      const context: APIContext = {
        user,
        request: req,
        ipAddress,
      };

      return await handler(context, ...args);
    } catch (error: any) {
      console.error("API Error:", error);
      
      return NextResponse.json(
        {
          error: "Erreur interne du serveur",
          message: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrap API route with role-based access control
 */
export function withRole(
  allowedRoles: Array<"SUPER_ADMIN" | "RH" | "USER">,
  handler: APIHandler
) {
  return withAuth(async (context, ...args) => {
    const { user, ipAddress } = context;

    if (!allowedRoles.includes(user.role)) {
      await auditLogger.log({
        action: "UNAUTHORIZED_ACCESS_ATTEMPT",
        userId: user.id,
        entityType: "API",
        metadata: JSON.stringify({
          requiredRoles: allowedRoles,
          userRole: user.role,
          path: context.request.nextUrl.pathname,
        }),
        ipAddress,
        severity: "WARNING",
      });

      return NextResponse.json(
        {
          error: "Accès refusé",
          message: "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.",
        },
        { status: 403 }
      );
    }

    return await handler(context, ...args);
  });
}

/**
 * Require active user status
 */
export function withActiveStatus(handler: APIHandler) {
  return withAuth(async (context, ...args) => {
    const { user } = context;

    // SUPER_ADMIN and RH can bypass status check
    if (user.role === "SUPER_ADMIN" || user.role === "RH") {
      return await handler(context, ...args);
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: "Compte inactif",
          message: "Votre compte doit être activé pour accéder à cette ressource.",
          status: user.status,
        },
        { status: 403 }
      );
    }

    return await handler(context, ...args);
  });
}

/**
 * Validate request body against schema
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: {
    required?: string[];
    optional?: string[];
    types?: Record<string, string>;
  }
): Promise<{ data?: T; error?: string }> {
  try {
    const body = await req.json();

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (body[field] === undefined || body[field] === null) {
          return { error: `Le champ '${field}' est requis` };
        }
      }
    }

    // Check types
    if (schema.types) {
      for (const [field, expectedType] of Object.entries(schema.types)) {
        if (body[field] !== undefined) {
          const actualType = typeof body[field];
          if (actualType !== expectedType) {
            return {
              error: `Le champ '${field}' doit être de type ${expectedType}, reçu ${actualType}`,
            };
          }
        }
      }
    }

    return { data: body as T };
  } catch (error) {
    return { error: "Corps de requête JSON invalide" };
  }
}

/**
 * Standard success response
 */
export function successResponse<T>(data: T, message?: string, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

/**
 * Standard error response
 */
export function errorResponse(
  error: string,
  status: number = 400,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error,
      details: process.env.NODE_ENV === "development" ? details : undefined,
    },
    { status }
  );
}

/**
 * Paginate results
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function getPaginationParams(req: NextRequest): PaginationParams {
  const { searchParams } = req.nextUrl;
  
  return {
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "20"),
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  };
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  
  return successResponse({
    items: data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}

/**
 * Log API access
 */
export async function logAPIAccess(
  context: APIContext,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: any
) {
  await auditLogger.log({
    action,
    userId: context.user.id,
    entityType,
    entityId,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
    ipAddress: context.ipAddress,
    userAgent: context.request.headers.get("user-agent") || undefined,
    severity: "INFO",
  });
}

/**
 * Extract device fingerprint from request
 */
export function getDeviceFingerprint(req: NextRequest): {
  userAgent: string;
  platform?: string;
  language?: string;
} {
  const headers = req.headers;
  
  return {
    userAgent: headers.get("user-agent") || "unknown",
    platform: headers.get("sec-ch-ua-platform") || undefined,
    language: headers.get("accept-language")?.split(",")[0] || undefined,
  };
}

/**
 * Check rate limiting (basic implementation)
 * In production, use Redis or similar
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

/**
 * Rate limit middleware
 */
export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 60000,
  handler: APIHandler
) {
  return withAuth(async (context, ...args) => {
    const identifier = `${context.user.id}-${context.request.nextUrl.pathname}`;
    const rateLimit = checkRateLimit(identifier, maxRequests, windowMs);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Trop de requêtes",
          message: "Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const response = await handler(context, ...args);
    
    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString());
    
    return response;
  });
}
