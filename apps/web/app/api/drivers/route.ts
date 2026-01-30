import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("drivers")
      .select("id, full_name, email, phone, is_active, created_at")
      .eq("is_active", true)
      .order("full_name");

    if (error) {
      console.error("[drivers] GET error:", error);
      return jsonError("DATABASE_ERROR", "Failed to fetch drivers", requestId, 500);
    }

    return jsonOk({ success: true, data });
  } catch (error) {
    console.error(`[drivers] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Internal error", requestId, 500);
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  // Only admin/super_admin can create drivers
  const role = auth.user?.user_metadata?.role;
  if (!["admin", "super_admin"].includes(role)) {
    return jsonError("FORBIDDEN", "Admin access required", requestId, 403);
  }

  try {
    const body = await request.json();
    const { full_name, email, phone } = body;

    if (!full_name) {
      return jsonError("VALIDATION_ERROR", "full_name is required", requestId, 400);
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("drivers")
      .insert({
        full_name,
        email: email || null,
        phone: phone || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[drivers] POST error:", error);
      return jsonError("DATABASE_ERROR", "Failed to create driver", requestId, 500);
    }

    return jsonOk({ success: true, data });
  } catch (error) {
    console.error(`[drivers] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Internal error", requestId, 500);
  }
}
