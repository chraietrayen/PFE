/**
 * Cache utilities for API routes
 * Provides Cache-Control header presets for different data freshness needs
 */

import { NextResponse } from "next/server";

/**
 * Cache tier definitions:
 * 
 * STATIC    - Data that rarely changes (roles, permissions, preferences)
 *             5 min cache, 10 min stale-while-revalidate
 * 
 * SEMI      - Data that changes occasionally (employee lists, reports, leaves)
 *             1 min cache, 2 min stale-while-revalidate
 * 
 * SHORT     - Dashboard stats, aggregated data that updates regularly
 *             30s cache, 1 min stale-while-revalidate
 * 
 * PERSONAL  - User-specific data (own profile, own pointages, own conges)
 *             Private, 10s max-age, 30s stale-while-revalidate
 * 
 * NONE      - Realtime data, notifications, today-status, mutations
 *             No caching at all
 */
export const CacheTier = {
  /** Rarely changes: roles, permissions, preferences (s-maxage=300) */
  STATIC: "public, s-maxage=300, stale-while-revalidate=600",
  
  /** Changes occasionally: employee lists, reports (s-maxage=60) */
  SEMI: "public, s-maxage=60, stale-while-revalidate=120",
  
  /** Dashboard stats, aggregated data (s-maxage=30) */
  SHORT: "public, s-maxage=30, stale-while-revalidate=60",
  
  /** User-specific data: own profile, own pointages (private, max-age=10) */
  PERSONAL: "private, max-age=10, stale-while-revalidate=30",
  
  /** Realtime/sensitive: notifications, today-status, mutations */
  NONE: "no-cache, no-store, must-revalidate",
} as const;

export type CacheTierType = keyof typeof CacheTier;

/**
 * Create Cache-Control headers object
 */
export function cacheHeaders(tier: CacheTierType): HeadersInit {
  return {
    "Cache-Control": CacheTier[tier],
  };
}

/**
 * Create a cached NextResponse.json with appropriate Cache-Control headers
 */
export function cachedJson<T>(data: T, tier: CacheTierType, status: number = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": CacheTier[tier],
    },
  });
}

/**
 * Create a cached success response (matches successResponse format)
 */
export function cachedSuccess<T>(data: T, tier: CacheTierType, message?: string, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    {
      status,
      headers: {
        "Cache-Control": CacheTier[tier],
      },
    }
  );
}
