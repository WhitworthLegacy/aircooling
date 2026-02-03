import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";
import { getBaseUrl } from "@/lib/resend";

// GET /api/admin/quotes/refuse?id=xxx - Refuse quote (via email link)
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);
  const quoteId = searchParams.get("id");
  const reason = searchParams.get("reason") || "Refusé par l'administrateur";

  if (!quoteId) {
    return NextResponse.redirect(`${getBaseUrl()}/dashboard/devis?error=missing_id`);
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1. Get quote
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("id, quote_number, status")
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      console.error("[admin/quotes/refuse] Quote not found:", quoteError);
      return NextResponse.redirect(`${getBaseUrl()}/dashboard/devis?error=quote_not_found`);
    }

    // 2. Check if already processed
    if (quote.status === "sent" || quote.status === "accepted" || quote.status === "refused") {
      return NextResponse.redirect(`${getBaseUrl()}/dashboard/devis?message=already_processed&quote=${quoteId}`);
    }

    // 3. Update quote status to "refused"
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        status: "refused",
        internal_notes: reason,
        accepted_at: new Date().toISOString(), // Using accepted_at as decision timestamp
      })
      .eq("id", quoteId);

    if (updateError) {
      console.error("[admin/quotes/refuse] Update error:", updateError);
      return NextResponse.redirect(`${getBaseUrl()}/dashboard/devis?error=update_failed`);
    }

    // 4. Update tech_report status if exists
    await supabase
      .from("tech_reports")
      .update({ status: "refused" })
      .eq("quote_id", quoteId);

    console.info(`[admin/quotes/refuse] Quote ${quote.quote_number} refused`);

    // 5. Redirect to devis page with success message
    return NextResponse.redirect(`${getBaseUrl()}/dashboard/devis?success=quote_refused&quote=${quoteId}`);
  } catch (error) {
    console.error(`[admin/quotes/refuse] requestId=${requestId}`, error);
    return NextResponse.redirect(`${getBaseUrl()}/dashboard/devis?error=internal_error`);
  }
}

// POST /api/admin/quotes/refuse - Refuse quote via API call
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const quoteId = body.quote_id;
    const reason = body.reason || "Refusé par l'administrateur";

    if (!quoteId) {
      return jsonError("VALIDATION_ERROR", "ID du devis requis", requestId, 400);
    }

    const supabase = getSupabaseAdmin();

    // 1. Get quote
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("id, quote_number, status")
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      return jsonError("NOT_FOUND", "Devis introuvable", requestId, 404);
    }

    // 2. Check if already processed
    if (quote.status === "sent" || quote.status === "accepted" || quote.status === "refused") {
      return jsonError("VALIDATION_ERROR", "Ce devis a déjà été traité", requestId, 400);
    }

    // 3. Update quote status to "refused"
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        status: "refused",
        internal_notes: reason,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    if (updateError) {
      console.error("[admin/quotes/refuse] Update error:", updateError);
      return jsonError("DATABASE_ERROR", "Erreur de mise à jour", requestId, 500);
    }

    // 4. Update tech_report status if exists
    await supabase
      .from("tech_reports")
      .update({ status: "refused" })
      .eq("quote_id", quoteId);

    console.info(`[admin/quotes/refuse] requestId=${requestId} Quote ${quote.quote_number} refused`);

    return jsonOk({
      success: true,
      quote_id: quoteId,
      quote_number: quote.quote_number,
    });
  } catch (error) {
    console.error(`[admin/quotes/refuse] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
