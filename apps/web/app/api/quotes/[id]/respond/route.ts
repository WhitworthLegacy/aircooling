import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getBaseUrl, resend, FROM_EMAIL } from "@/lib/resend";
import { generateQuoteAcceptedEmail } from "@/lib/emails/quote-accepted";

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

    const supabase = await getSupabaseServerClient();

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
      .select("checklists, workflow_state, crm_stage, first_name, last_name, email")
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

      // Determine updates based on response
      // - accepted: convert prospect to client (is_prospect=false), keep stage (will move to Intervention when RDV created)
      // - refused: move to 'annulé' column (labeled "Devis Refusé" in UI)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clientUpdate: Record<string, any> = {
        checklists: updatedChecklists,
        workflow_state: updatedWorkflowState,
      };

      if (response === "accepted") {
        clientUpdate.is_prospect = false; // 🔄 Prospect → Client conversion
      } else if (response === "refused") {
        clientUpdate.crm_stage = "annulé"; // Maps to "Devis Refusé" column in CRM
      }

      const { error: clientUpdateError } = await supabase
        .from("clients")
        .update(clientUpdate)
        .eq("id", quote.client_id);

      if (clientUpdateError) {
        console.error("[quote/respond] client update error:", clientUpdateError);
        // Don't fail the request, quote is already updated
      }

      console.log(`[quote/respond] Client ${quote.client_id} updated: is_prospect=${response === "accepted" ? false : "unchanged"}`);

      // 📧 Send thank you email with booking link (only for accepted quotes)
      if (response === "accepted" && client?.email) {
        try {
          const baseUrl = getBaseUrl();
          const clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Client';
          const bookingUrl = `${baseUrl}/booking?client_id=${quote.client_id}`;

          await resend.emails.send({
            from: FROM_EMAIL,
            to: client.email,
            subject: `✅ Devis accepté – Planifiez votre intervention | AirCooling`,
            html: generateQuoteAcceptedEmail({
              clientName,
              quoteNumber: quote.quote_number,
              bookingUrl,
            }),
          });

          console.log(`[quote/respond] Thank you email sent to ${client.email}`);
        } catch (emailError) {
          console.error("[quote/respond] email error:", emailError);
          // Don't fail - email is non-blocking
        }
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
