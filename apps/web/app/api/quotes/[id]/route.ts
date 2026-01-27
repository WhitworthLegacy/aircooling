import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

// GET /api/quote/[id] - Public endpoint to fetch quote data for response page
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  try {
    console.log(`[api/quote/${id}] Starting...`);
    console.log(`[api/quote/${id}] SUPABASE_URL exists: ${!!process.env.SUPABASE_URL}`);
    console.log(`[api/quote/${id}] SERVICE_ROLE_KEY exists: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);

    const supabase = await getSupabaseServerClient();

    console.log(`[api/quote/${id}] Fetching quote...`);

    const { data: quote, error } = await supabase
      .from("quotes")
      .select(
        `
        id,
        quote_number,
        status,
        total,
        accepted_at,
        clients (
          full_name
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error(`[api/quote/${id}] Supabase error:`, error);
      return NextResponse.json(
        { ok: false, error: "Quote not found", details: error.message },
        { status: 404 }
      );
    }

    if (!quote) {
      console.log(`[api/quote/${id}] Quote not found in database`);
      return NextResponse.json(
        { ok: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    console.log(`[api/quote/${id}] Found quote:`, quote.quote_number);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = quote.clients as any;

    return NextResponse.json({
      ok: true,
      quote: {
        id: quote.id,
        quote_number: quote.quote_number,
        status: quote.status,
        total: quote.total,
        client_name: client?.full_name || "Client",
        accepted_at: quote.accepted_at,
      },
    });
  } catch (error) {
    console.error("[api/quote] error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
