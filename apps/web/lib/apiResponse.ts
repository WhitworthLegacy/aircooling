/**
 * Standard API Response Helpers
 *
 * Provides consistent JSON response formatting for Next.js API routes.
 */

import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

/**
 * Success response with data
 */
export function jsonOk<T extends Record<string, any>>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      ...data,
    },
    { status }
  );
}

/**
 * Error response with code and message
 */
export function jsonError(
  code: string,
  message: string,
  requestId?: string,
  status = 400
): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        requestId: requestId || nanoid(10),
      },
    },
    { status }
  );
}

/**
 * Not found error response
 */
export function jsonNotFound(message = "Resource not found", requestId?: string): NextResponse {
  return jsonError("NOT_FOUND", message, requestId, 404);
}

/**
 * Unauthorized error response
 */
export function jsonUnauthorized(message = "Unauthorized", requestId?: string): NextResponse {
  return jsonError("UNAUTHORIZED", message, requestId, 401);
}

/**
 * Forbidden error response
 */
export function jsonForbidden(message = "Forbidden", requestId?: string): NextResponse {
  return jsonError("FORBIDDEN", message, requestId, 403);
}

/**
 * Validation error response
 */
export function jsonValidationError(
  message: string,
  details?: Record<string, string[]>,
  requestId?: string
): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message,
        details,
        requestId: requestId || nanoid(10),
      },
    },
    { status: 400 }
  );
}

/**
 * Internal server error response
 */
export function jsonInternalError(
  message = "Internal server error",
  requestId?: string
): NextResponse {
  return jsonError("INTERNAL_ERROR", message, requestId, 500);
}

/**
 * Rate limited error response
 */
export function jsonRateLimited(
  message = "Too many requests",
  retryAfter?: number,
  requestId?: string
): NextResponse {
  const response = jsonError("RATE_LIMITED", message, requestId, 429);
  if (retryAfter) {
    response.headers.set("Retry-After", String(retryAfter));
  }
  return response;
}

/**
 * Created response (201)
 */
export function jsonCreated<T extends Record<string, any>>(data: T): NextResponse {
  return jsonOk(data, 201);
}

/**
 * No content response (204)
 */
export function jsonNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
