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
      query = query.ilike("category", `%${category}%`);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,reference.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (inStock) {
      query = query.gt("quantity", 0);
    }

    const { data: items, error } = await query;

    if (error) {
      console.error("[admin/inventory] Fetch error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de récupération", requestId, 500);
    }

    // Transform items to match frontend expected format
    // Map database columns to frontend expected names
    const transformedItems = (items || []).map(item => ({
      id: item.id,
      sku: item.reference, // Map reference -> sku for frontend
      name: item.name,
      description: item.description,
      item_type: item.item_type || 'part',
      sell_price: item.price_sell || 0,
      cost_price: item.price_buy || 0,
      stock_qty: item.quantity || 0,
      category: item.category,
      supplier: item.supplier_name,
    }));

    // Group items by type for easier use in frontend
    const grouped = {
      labor: transformedItems.filter(i => i.item_type === "labor"),
      parts: transformedItems.filter(i => i.item_type === "part"),
      fees: transformedItems.filter(i => i.item_type === "fee"),
      services: transformedItems.filter(i => i.item_type === "service"),
    };

    return jsonOk({
      items: transformedItems,
      grouped,
      total: transformedItems.length
    });
  } catch (error) {
    console.error(`[admin/inventory] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
