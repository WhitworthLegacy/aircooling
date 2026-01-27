/**
 * CORS Headers Helper
 *
 * Provides consistent CORS header management for API routes.
 */

import { NextResponse } from "next/server";

const DEFAULT_HEADERS = "authorization, content-type, x-requested-with";
const DEFAULT_METHODS = "GET, POST, PATCH, PUT, DELETE, OPTIONS";

export interface CorsOptions {
  origin?: string | string[];
  methods?: string;
  headers?: string;
  maxAge?: number;
  credentials?: boolean;
}

/**
 * Get CORS headers based on options
 */
export function getCorsHeaders(options: CorsOptions = {}): Record<string, string> {
  const origin = options.origin || process.env.CORS_ORIGIN || "*";
  const methods = options.methods || DEFAULT_METHODS;
  const headers = options.headers || DEFAULT_HEADERS;
  const maxAge = options.maxAge || 86400;

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": Array.isArray(origin) ? origin[0] : origin,
    "Access-Control-Allow-Headers": headers,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Max-Age": String(maxAge),
  };

  if (options.credentials) {
    corsHeaders["Access-Control-Allow-Credentials"] = "true";
  }

  return corsHeaders;
}

/**
 * Apply CORS headers to a response
 */
export function applyCors<T extends NextResponse>(
  response: T,
  options: CorsOptions = {}
): T {
  const headers = getCorsHeaders(options);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Create a preflight (OPTIONS) response
 */
export function corsPreflightResponse(options: CorsOptions = {}): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(options),
  });
}

/**
 * CORS middleware factory for API routes
 *
 * Usage:
 * import { withCors } from '@saas-core/shared/cors';
 *
 * const handler = withCors(async (request) => {
 *   // Your handler logic
 * });
 */
export function withCors(
  handler: (request: Request) => Promise<NextResponse>,
  options: CorsOptions = {}
) {
  return async (request: Request): Promise<NextResponse> => {
    // Handle preflight
    if (request.method === "OPTIONS") {
      return corsPreflightResponse(options);
    }

    // Call the actual handler
    const response = await handler(request);

    // Apply CORS headers
    return applyCors(response, options);
  };
}
