import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";

// GET /api/admin/quotes - List all quotes (admin only)
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("quotes")
      .select(
        `
        *,
        clients(id, first_name, last_name, phone, email, tracking_id),
        quote_items(id, kind, label, description, quantity, unit_price, line_total)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: quotes, error, count } = await query;

    if (error) {
      console.error("[admin/quotes] Fetch error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de récupération", requestId, 500);
    }

    return jsonOk({
      quotes: quotes || [],
      total: count || 0,
    });
  } catch (error) {
    console.error(`[admin/quotes] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
