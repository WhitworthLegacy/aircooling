import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getBaseUrl } from "@/lib/resend";

// GET /api/quote/[id]/decline - Direct link from email to decline quote
// No page needed, just update DB and redirect to confirmation
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const baseUrl = getBaseUrl();

  try {
    const supabase = await getSupabaseServerClient();

    // Check if quote exists and get current status
    const { data: quote, error: fetchError } = await supabase
      .from("quotes")
      .select("id, status, quote_number")
      .eq("id", id)
      .single();

    if (fetchError || !quote) {
      // Redirect to error page
      return NextResponse.redirect(`${baseUrl}/quote/error?reason=not_found`);
    }

    // If already responded, redirect to already responded page
    if (quote.status === "accepted" || quote.status === "refused") {
      return NextResponse.redirect(`${baseUrl}/quote/already-responded?status=${quote.status}`);
    }

    // Update quote status
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        status: "refused",
      })
      .eq("id", id);

    if (updateError) {
      console.error("[quote/decline] update error:", updateError);
      return NextResponse.redirect(`${baseUrl}/quote/error?reason=update_failed`);
    }

    // Redirect to success page
    return NextResponse.redirect(`${baseUrl}/quote/success?action=refused&number=${quote.quote_number}`);
  } catch (error) {
    console.error("[quote/decline] error:", error);
    return NextResponse.redirect(`${baseUrl}/quote/error?reason=server_error`);
  }
}
