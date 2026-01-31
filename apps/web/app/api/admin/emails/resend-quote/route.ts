import { NextRequest } from "next/server";
import { resend, FROM_EMAIL, generateQuoteEmailHtml, defaultBrand } from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  // Require admin authentication
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const body = await request.json();
    const { quote_id } = body;

    if (!quote_id) {
      return jsonError("VALIDATION_ERROR", "quote_id is required", requestId, 400);
    }

    const supabase = getSupabaseAdmin();

    // Fetch quote with items and client
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(`
        *,
        quote_items (*),
        clients (
          id,
          full_name,
          first_name,
          last_name,
          email
        )
      `)
      .eq("id", quote_id)
      .single();

    if (quoteError || !quote) {
      return jsonError("NOT_FOUND", "Quote not found", requestId, 404);
    }

    // Get client email
    const client = quote.clients as {
      id: string;
      full_name?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
    } | null;

    if (!client?.email) {
      return jsonError("VALIDATION_ERROR", "Client has no email address", requestId, 400);
    }

    const clientName = client.full_name ||
      [client.first_name, client.last_name].filter(Boolean).join(" ") ||
      "Client";

    // Build quote items for email
    const items = ((quote.quote_items || []) as Array<{
      label?: string;
      description?: string;
      quantity?: number;
      unit_price?: number;
      line_total?: number;
    }>).map((item) => ({
      description: item.label || item.description || "Article",
      quantity: item.quantity || 1,
      unitPrice: item.unit_price || 0,
      total: item.line_total || (item.quantity || 1) * (item.unit_price || 0),
    }));

    // Calculate total
    const totalAmount = quote.total || quote.total_amount || quote.subtotal ||
      items.reduce((sum, item) => sum + item.total, 0);

    // Format expires_at date (database column name)
    const validUntil = quote.expires_at
      ? new Date(quote.expires_at).toLocaleDateString("fr-BE", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-BE", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

    const html = generateQuoteEmailHtml({
      clientName,
      clientEmail: client.email,
      quoteNumber: quote.quote_number || quote.id.slice(0, 8).toUpperCase(),
      items,
      totalAmount,
      validUntil,
      brand: defaultBrand,
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: client.email,
      subject: `Devis Aircooling - ${quote.quote_number || quote.id.slice(0, 8).toUpperCase()}`,
      html,
    });

    // Update quote sent_at timestamp and status
    await supabase
      .from("quotes")
      .update({
        sent_at: new Date().toISOString(),
        status: "sent",
      })
      .eq("id", quote_id);

    return jsonOk({ ok: true, sent_to: client.email });
  } catch (error) {
    console.error(`[emails/resend-quote] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Failed to send email", requestId, 500);
  }
}
