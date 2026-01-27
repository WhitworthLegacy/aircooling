import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";

function getSupabaseServiceRole() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const role = auth.user?.user_metadata?.role;
  if (role !== "super_admin") {
    return jsonError("FORBIDDEN", "Réservé aux super administrateurs", requestId, 403);
  }

  try {
    const supabase = getSupabaseServiceRole();
    const db = getSupabaseAdmin();

    const [authResult, profilesResult] = await Promise.all([
      supabase.auth.admin.listUsers(),
      db.from("profiles").select("*"),
    ]);

    if (authResult.error) {
      console.error("[admin/users] List error:", authResult.error);
      return jsonError("DATABASE_ERROR", "Erreur de récupération", requestId, 500);
    }

    const profileMap = new Map(
      (profilesResult.data || []).map((p) => [p.id, p])
    );

    const users = (authResult.data.users || []).map((u) => {
      const profile = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        role: profile?.role || u.user_metadata?.role || "technicien",
        full_name: profile?.full_name || "",
        avatar_url: profile?.avatar_url || "",
        phone: profile?.phone || "",
        is_active: profile?.is_active ?? true,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      };
    });

    return jsonOk({ users });
  } catch (error) {
    console.error(`[admin/users] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const role = auth.user?.user_metadata?.role;
  if (role !== "super_admin") {
    return jsonError("FORBIDDEN", "Réservé aux super administrateurs", requestId, 403);
  }

  try {
    const body = await request.json();
    const { email, password, role: userRole, full_name } = body;

    if (!email || !password) {
      return jsonError("VALIDATION_ERROR", "Email et mot de passe requis", requestId, 400);
    }

    if (!["technicien", "admin", "super_admin"].includes(userRole)) {
      return jsonError("VALIDATION_ERROR", "Rôle invalide", requestId, 400);
    }

    const supabase = getSupabaseServiceRole();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { role: userRole, full_name: full_name || "" },
      email_confirm: true,
    });

    if (error) {
      console.error("[admin/users] Create error:", error);
      return jsonError("DATABASE_ERROR", error.message, requestId, 400);
    }

    // Profile is auto-created by the on_auth_user_created trigger

    return jsonOk({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole,
        full_name: full_name || "",
        created_at: data.user.created_at,
      },
    });
  } catch (error) {
    console.error(`[admin/users] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
