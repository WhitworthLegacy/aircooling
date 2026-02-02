import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireTech } from "@/lib/techAuth";

// GET /api/tech/inventory - List available inventory items for parts selection
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireTech();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    let query = supabase
      .from("inventory_items")
      .select("id, name, reference, category, price_sell, quantity")
      .eq("is_active", true)
      .gt("quantity", 0) // Only show in-stock items
      .order("category")
      .order("name");

    if (search) {
      query = query.or(`name.ilike.%${search}%,reference.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data: items, error } = await query;

    if (error) {
      console.error("[tech/inventory] Fetch error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de récupération", requestId, 500);
    }

    // Group by category for easier frontend display
    const categories = [...new Set((items || []).map((item) => item.category))].filter(Boolean);

    return jsonOk({
      items: items || [],
      categories,
      total: items?.length || 0,
    });
  } catch (error) {
    console.error(`[tech/inventory] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
