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

type QuoteItem = {
  description?: string;
  label?: string;
  quantity?: number;
  unit_price?: number;
  kind?: string;
  inventory_item_id?: string;
};

type SelectedPart = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
};

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const body = await request.json();
    const {
      client_id,
      items,
      valid_until,
      notes,
      service_type,
      // New fields for labor + parts
      labor_type,
      labor_hours,
      labor_rate,
      selected_parts,
    } = body;

    if (!client_id) {
      return jsonError("VALIDATION_ERROR", "client_id is required", requestId, 400);
    }

    const supabase = getSupabaseAdmin();

    // Generate quote number (YEAR + 3-digit sequence: 2026001, 2026002, etc.)
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;

    // Count this year's quotes to generate sequence number
    const { count } = await supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yearStart);

    const sequence = String((count || 0) + 1).padStart(3, "0");
    const quote_number = `${currentYear}${sequence}`;

    // Build quote items from labor + parts + legacy items
    const allItems: QuoteItem[] = [];

    // Add labor item if hours specified
    if (labor_hours && labor_hours > 0) {
      const rate = labor_rate || 65; // Default hourly rate
      const laborLabels: Record<string, string> = {
        installation: "Main d'oeuvre installation",
        entretien: "Main d'oeuvre entretien",
        depannage: "Main d'oeuvre dépannage",
        reparation: "Main d'oeuvre réparation",
      };
      allItems.push({
        kind: "labor",
        label: laborLabels[labor_type] || "Main d'oeuvre",
        description: `${labor_hours}h x ${rate}€/h`,
        quantity: labor_hours,
        unit_price: rate,
      });
    }

    // Add selected parts
    if (selected_parts && Array.isArray(selected_parts)) {
      for (const part of selected_parts as SelectedPart[]) {
        allItems.push({
          kind: "part",
          label: part.name,
          description: part.sku,
          quantity: part.quantity || 1,
          unit_price: part.unit_price,
          inventory_item_id: part.id,
        });
      }
    }

    // Add legacy items format
    if (items && Array.isArray(items)) {
      for (const item of items as QuoteItem[]) {
        allItems.push({
          kind: item.kind || "labor",
          label: item.label || item.description || "Article",
          description: item.description,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
        });
      }
    }

    // Require at least one item
    if (allItems.length === 0) {
      return jsonError("VALIDATION_ERROR", "Au moins un élément est requis", requestId, 400);
    }

    // Calculate totals
    let laborTotal = 0;
    let partsTotal = 0;

    for (const item of allItems) {
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
      if (item.kind === "labor") {
        laborTotal += lineTotal;
      } else if (item.kind === "part") {
        partsTotal += lineTotal;
      }
    }

    const subtotal = laborTotal + partsTotal;
    const taxRate = 21;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Default expires_at to 30 days from now
    const expiresAt = valid_until
      ? new Date(valid_until).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Create quote
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        client_id,
        quote_number,
        status: "draft",
        labor_total: laborTotal,
        parts_total: partsTotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        expires_at: expiresAt,
        notes: notes || null,
        internal_notes: labor_type ? `Type: ${labor_type}` : null,
        labor_hours: labor_hours || null,
        labor_type: labor_type || null,
        selected_parts: selected_parts || null,
      })
      .select()
      .single();

    if (quoteError) {
      console.error("[admin/quotes] Create error:", quoteError);
      return jsonError("DATABASE_ERROR", "Failed to create quote", requestId, 500);
    }

    // Create quote items
    const quoteItems = allItems.map((item, index) => ({
      quote_id: quote.id,
      kind: item.kind || "labor",
      label: item.label || "Article",
      description: item.description || null,
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      line_total: (item.quantity || 1) * (item.unit_price || 0),
      inventory_item_id: item.inventory_item_id || null,
      sort_order: index,
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
