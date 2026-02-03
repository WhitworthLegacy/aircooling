import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";
import { resend, FROM_EMAIL, generateQuoteEmailHtml, defaultBrand, getBaseUrl } from "@/lib/resend";

// GET /api/admin/quotes/validate?id=xxx - Validate quote and send to client (via email link)
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);
  const quoteId = searchParams.get("id");

  if (!quoteId) {
    // Redirect to devis page with error
    return NextResponse.redirect(`${getBaseUrl()}/dashboard/devis?error=missing_id`);
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1. Get quote with client info
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(`
        *,
        clients(id, first_name, last_name, email, phone),
        quote_items(id, kind, label, description, quantity, unit_price, line_total)
      `)
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      console.error("[admin/quotes/validate] Quote not found:", quoteError);
      return NextResponse.redirect(`${getBaseUrl()}/dashboard/devis?error=quote_not_found`);
    }

    const client = quote.clients as { id: string; first_name?: string; last_name?: string; email?: string; phone?: string } | null;

    if (!client?.email) {
      return NextResponse.redirect(`${getBaseUrl()}/dashboard/devis?error=no_client_email`);
    }

    // 2. Check if already sent
    if (quote.status === "sent" || quote.status === "accepted" || quote.status === "refused") {
      return NextResponse.redirect(`${getBaseUrl()}/dashboard/devis?message=already_processed&quote=${quoteId}`);
    }

    // 3. Prepare email data
    const clientName = [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client";

    const emailItems = (quote.quote_items as Array<{ label?: string; description?: string; quantity: number; unit_price: number; line_total: number }> || []).map((item) => ({
      description: item.label || item.description || "Article",
      quantity: item.quantity,
      unitPrice: item.unit_price,
      total: item.line_total,
    }));

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
      quoteNumber: quote.quote_number,
      quoteId: quote.id,
      items: emailItems,
      totalAmount: quote.total,
      validUntil,
      brand: defaultBrand,
    });

    // 4. Send email to client
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: client.email,
        subject: `Devis Aircooling - ${quote.quote_number}`,
        html,
      });
      console.info(`[admin/quotes/validate] Quote email sent to ${client.email}`);
    } catch (emailError) {
      console.error("[admin/quotes/validate] Email send error:", emailError);
      return NextResponse.redirect(`${getBaseUrl()}/dashboard/devis?error=email_failed&quote=${quoteId}`);
    }

    // 5. Update quote status to "sent"
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    if (updateError) {
      console.error("[admin/quotes/validate] Update error:", updateError);
    }

    // 6. Update tech_report status if exists
    await supabase
      .from("tech_reports")
      .update({ status: "quote_sent" })
      .eq("quote_id", quoteId);

    console.info(`[admin/quotes/validate] Quote ${quote.quote_number} validated and sent to ${client.email}`);

    // 7. Redirect to devis page with success message
    return NextResponse.redirect(`${getBaseUrl()}/dashboard/devis?success=quote_sent&quote=${quoteId}`);
  } catch (error) {
    console.error(`[admin/quotes/validate] requestId=${requestId}`, error);
    return NextResponse.redirect(`${getBaseUrl()}/dashboard/devis?error=internal_error`);
  }
}

// POST /api/admin/quotes/validate - Validate quote via API call
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const quoteId = body.quote_id;

    if (!quoteId) {
      return jsonError("VALIDATION_ERROR", "ID du devis requis", requestId, 400);
    }

    const supabase = getSupabaseAdmin();

    // 1. Get quote with client info
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(`
        *,
        clients(id, first_name, last_name, email, phone),
        quote_items(id, kind, label, description, quantity, unit_price, line_total)
      `)
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      return jsonError("NOT_FOUND", "Devis introuvable", requestId, 404);
    }

    const client = quote.clients as { id: string; first_name?: string; last_name?: string; email?: string; phone?: string } | null;

    if (!client?.email) {
      return jsonError("VALIDATION_ERROR", "Le client n'a pas d'adresse email", requestId, 400);
    }

    // 2. Check if already sent
    if (quote.status === "sent" || quote.status === "accepted" || quote.status === "refused") {
      return jsonError("VALIDATION_ERROR", "Ce devis a déjà été traité", requestId, 400);
    }

    // 3. Prepare email data
    const clientName = [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client";

    const emailItems = (quote.quote_items as Array<{ label?: string; description?: string; quantity: number; unit_price: number; line_total: number }> || []).map((item) => ({
      description: item.label || item.description || "Article",
      quantity: item.quantity,
      unitPrice: item.unit_price,
      total: item.line_total,
    }));

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
      quoteNumber: quote.quote_number,
      quoteId: quote.id,
      items: emailItems,
      totalAmount: quote.total,
      validUntil,
      brand: defaultBrand,
    });

    // 4. Send email to client
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: client.email,
        subject: `Devis Aircooling - ${quote.quote_number}`,
        html,
      });
      console.info(`[admin/quotes/validate] Quote email sent to ${client.email}`);
    } catch (emailError) {
      console.error("[admin/quotes/validate] Email send error:", emailError);
      return jsonError("EMAIL_ERROR", "Erreur d'envoi de l'email", requestId, 500);
    }

    // 5. Update quote status to "sent"
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    if (updateError) {
      console.error("[admin/quotes/validate] Update error:", updateError);
      return jsonError("DATABASE_ERROR", "Erreur de mise à jour", requestId, 500);
    }

    // 6. Update tech_report status if exists
    await supabase
      .from("tech_reports")
      .update({ status: "quote_sent" })
      .eq("quote_id", quoteId);

    console.info(`[admin/quotes/validate] requestId=${requestId} Quote ${quote.quote_number} validated and sent`);

    return jsonOk({
      success: true,
      quote_id: quoteId,
      quote_number: quote.quote_number,
      sent_to: client.email,
    });
  } catch (error) {
    console.error(`[admin/quotes/validate] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
