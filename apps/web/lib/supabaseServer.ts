/**
 * Supabase Server Client
 *
 * Creates a Supabase client for server-side operations.
 * Supports both service role (admin) and user context.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Types
export type SupabaseServerClient = SupabaseClient;

/**
 * Get Supabase URL from environment
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("[Supabase] NEXT_PUBLIC_SUPABASE_URL is not configured");
  }
  return url;
}

/**
 * Get Supabase anon key from environment
 */
function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured");
  }
  return key;
}

/**
 * Get Supabase service role key from environment
 */
function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("[Supabase] SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return key;
}

/**
 * Create a Supabase client with service role (admin) privileges
 * Use this for operations that need to bypass RLS
 */
export function getSupabaseAdmin(): SupabaseServerClient {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a Supabase client with user context from cookies.
 * Uses @supabase/ssr to properly read/write auth cookies.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // setAll can be called from a Server Component where cookies are read-only.
            // This is safe to ignore if middleware refreshes the session.
          }
        });
      },
    },
  });
}

/**
 * Create a Supabase client for use inside Next.js middleware.
 * Reads cookies from the request and writes them to the response.
 */
export function getSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

/**
 * Create a Supabase client from an access token
 */
export function getSupabaseWithToken(accessToken: string): SupabaseServerClient {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Extract access token from Authorization header
 */
export function getTokenFromHeader(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Get the current user from a request
 */
export async function getCurrentUser(request: Request) {
  const token = getTokenFromHeader(request);
  if (!token) {
    return null;
  }

  const supabase = getSupabaseWithToken(token);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
