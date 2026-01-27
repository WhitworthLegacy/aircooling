import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";

function getSupabaseServiceRole() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const callerRole = auth.user?.user_metadata?.role;
  if (callerRole !== "super_admin") {
    return jsonError("FORBIDDEN", "Réservé aux super administrateurs", requestId, 403);
  }

  try {
    const body = await request.json();
    const { role } = body;

    if (!["technicien", "admin", "super_admin"].includes(role)) {
      return jsonError("VALIDATION_ERROR", "Rôle invalide", requestId, 400);
    }

    const supabase = getSupabaseServiceRole();
    const { data, error } = await supabase.auth.admin.updateUserById(id, {
      user_metadata: { role },
    });

    if (error) {
      console.error("[admin/users] Update error:", error);
      return jsonError("DATABASE_ERROR", error.message, requestId, 400);
    }

    return jsonOk({
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
      },
    });
  } catch (error) {
    console.error(`[admin/users] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
