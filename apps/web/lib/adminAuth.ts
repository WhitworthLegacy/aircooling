import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { jsonUnauthorized, jsonForbidden } from "@/lib/apiResponse";

export async function requireAdmin() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: jsonUnauthorized("Non authentifié") };
  }

  const role = user.user_metadata?.role;
  if (role !== "admin" && role !== "super_admin") {
    return { error: jsonForbidden("Accès réservé aux administrateurs") };
  }

  return { user };
}
