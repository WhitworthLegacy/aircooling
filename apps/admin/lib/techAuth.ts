import { getSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonUnauthorized, jsonForbidden } from "@/lib/apiResponse";

export async function requireTech() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: jsonUnauthorized("Non authentifié") };
  }

  // Fetch role from profiles table
  const adminSupabase = getSupabaseAdmin();
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  if (role !== "technicien" && role !== "admin" && role !== "super_admin") {
    return { error: jsonForbidden("Accès réservé aux techniciens") };
  }

  return { user, role };
}
