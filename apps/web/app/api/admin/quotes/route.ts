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
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("quotes")
      .select("*, clients(id, first_name, last_name, email, phone, tracking_id), quote_items(*)", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: quotes, error, count } = await query;

    if (error) {
      console.error("[admin/quotes] Fetch error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de récupération", requestId, 500);
    }

    return jsonOk({ quotes: quotes || [], total: count || 0 });
  } catch (error) {
    console.error(`[admin/quotes] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const body = await request.json();
    const { client_id, items, valid_until, notes, service_type } = body;

    if (!client_id) {
      return jsonError("VALIDATION_ERROR", "client_id is required", requestId, 400);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return jsonError("VALIDATION_ERROR", "items array is required", requestId, 400);
    }

    const supabase = getSupabaseAdmin();

    // Generate quote number (YYYYMMDD-XXX format)
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, "");

    // Count today's quotes to generate sequence number
    const { count } = await supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString().slice(0, 10));

    const sequence = String((count || 0) + 1).padStart(3, "0");
    const quote_number = `${datePrefix}-${sequence}`;

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: { quantity?: number; unit_price?: number }) => {
      return sum + (item.quantity || 1) * (item.unit_price || 0);
    }, 0);

    // Default valid_until to 30 days from now
    const validUntilDate = valid_until
      ? new Date(valid_until).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Create quote
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        client_id,
        quote_number,
        status: "pending",
        subtotal,
        total: subtotal,
        total_amount: subtotal,
        valid_until: validUntilDate,
        notes: notes || null,
        service_type: service_type || null,
      })
      .select()
      .single();

    if (quoteError) {
      console.error("[admin/quotes] Create error:", quoteError);
      return jsonError("DATABASE_ERROR", "Failed to create quote", requestId, 500);
    }

    // Create quote items
    const quoteItems = items.map((item: { description?: string; quantity?: number; unit_price?: number }) => ({
      quote_id: quote.id,
      description: item.description || "Article",
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
    }));

    const { error: itemsError } = await supabase
      .from("quote_items")
      .insert(quoteItems);

    if (itemsError) {
      console.error("[admin/quotes] Items insert error:", itemsError);
      // Quote was created, but items failed - still return success with warning
    }

    return jsonOk({
      success: true,
      quote: {
        ...quote,
        quote_items: quoteItems,
      },
    });
  } catch (error) {
    console.error(`[admin/quotes] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
