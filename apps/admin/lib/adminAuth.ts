import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { jsonForbidden, jsonUnauthorized } from "./apiResponse";

export type AdminRole = "admin" | "super_admin";

export type AuthResult =
  | { user: { id: string; email: string }; role: AdminRole }
  | { error: Response };

/**
 * Require admin authentication for API routes
 * Returns user info if authenticated as admin/super_admin, or error response
 */
export async function requireAdmin(): Promise<AuthResult> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: jsonUnauthorized("Non authentifié") };
  }

  // Get role from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "technicien";

  // Check if user is admin or super_admin
  if (role !== "admin" && role !== "super_admin") {
    return { error: jsonForbidden("Accès réservé aux administrateurs") };
  }

  return {
    user: { id: user.id, email: user.email || "" },
    role: role as AdminRole,
  };
}
