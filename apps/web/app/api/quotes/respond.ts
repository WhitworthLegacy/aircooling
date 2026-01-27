import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

// POST /api/quote/[id]/respond - Public endpoint for client to accept/decline quote
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  try {
    const body = await request.json();
    const { response } = body; // 'accepted' or 'refused'

    if (!response || !["accepted", "refused"].includes(response)) {
      return NextResponse.json(
        { ok: false, error: "Invalid response. Must be 'accepted' or 'refused'" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Check quote exists and get client_id
    const { data: quote, error: fetchError } = await supabase
      .from("quotes")
      .select("id, client_id, status, quote_number")
      .eq("id", id)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json(
        { ok: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    // Check if already responded
    if (quote.status === "accepted" || quote.status === "refused") {
      return NextResponse.json({
        ok: true,
        message: "Quote already responded",
        status: quote.status,
      });
    }

    // Update quote status
    const updateData: { status: string; accepted_at?: string } = { status: response };
    if (response === "accepted") {
      updateData.accepted_at = new Date().toISOString();
    }

    const { error: updateQuoteError } = await supabase
      .from("quotes")
      .update(updateData)
      .eq("id", id);

    if (updateQuoteError) {
      console.error("[quote/respond] update quote error:", updateQuoteError);
      return NextResponse.json(
        { ok: false, error: "Failed to update quote" },
        { status: 500 }
      );
    }

    // Update client checklists and workflow_state
    const { data: client, error: clientFetchError } = await supabase
      .from("clients")
      .select("checklists, workflow_state, crm_stage")
      .eq("id", quote.client_id)
      .single();

    if (!clientFetchError && client) {
      // Update checklists - mark devis items as checked
      const updatedChecklists = client.checklists || {};
      if (updatedChecklists.devis?.items) {
        updatedChecklists.devis.items = updatedChecklists.devis.items.map(
          (item: { id: string; checked?: boolean; label?: string }) => {
            // q1 = Devis créé, q2 = Devis envoyé, q3 = Devis validé
            if (item.id === "q3") {
              return { ...item, checked: response === "accepted" };
            }
            return item;
          }
        );
      }

      // Update workflow_state - set both formats for compatibility
      const updatedWorkflowState = {
        ...(client.workflow_state || {}),
        devis_response: response,
        devis_accepted: response === "accepted", // Boolean flag for atelier substage logic
        devis_responded_at: new Date().toISOString(),
      };

      // Determine new stage based on response
      // - accepted: move to atelier (reparation)
      // - refused: move to 'annulé' column (now labeled "Devis Refusé" in UI)
      let newStage = client.crm_stage;
      if (response === "accepted") {
        newStage = "atelier";
      } else if (response === "refused") {
        newStage = "annulé"; // Maps to "Devis Refusé" column in CRM
      }

      const { error: clientUpdateError } = await supabase
        .from("clients")
        .update({
          checklists: updatedChecklists,
          workflow_state: updatedWorkflowState,
          crm_stage: newStage,
        })
        .eq("id", quote.client_id);

      if (clientUpdateError) {
        console.error("[quote/respond] client update error:", clientUpdateError);
        // Don't fail the request, quote is already updated
      }
    }

    console.log(
      `[quote/respond] Quote ${quote.quote_number} ${response} by client`
    );

    return NextResponse.json({
      ok: true,
      message: `Quote ${response}`,
      status: response,
    });
  } catch (error) {
    console.error("[quote/respond] error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
