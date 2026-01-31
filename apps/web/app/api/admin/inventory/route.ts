import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type"); // part, labor, fee, service
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const inStock = searchParams.get("in_stock") === "true";
    const limit = parseInt(searchParams.get("limit") || "100");

    let query = supabase
      .from("inventory_items")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true })
      .limit(limit);

    if (type) {
      query = query.eq("item_type", type);
    }

    if (category) {
      query = query.ilike("supplier", `%${category}%`);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (inStock) {
      query = query.or("track_stock.eq.false,stock_qty.gt.0");
    }

    const { data: items, error } = await query;

    if (error) {
      console.error("[admin/inventory] Fetch error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de récupération", requestId, 500);
    }

    // Group items by type for easier use in frontend
    const grouped = {
      labor: items?.filter(i => i.item_type === "labor") || [],
      parts: items?.filter(i => i.item_type === "part") || [],
      fees: items?.filter(i => i.item_type === "fee") || [],
      services: items?.filter(i => i.item_type === "service") || [],
    };

    return jsonOk({
      items: items || [],
      grouped,
      total: items?.length || 0
    });
  } catch (error) {
    console.error(`[admin/inventory] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
