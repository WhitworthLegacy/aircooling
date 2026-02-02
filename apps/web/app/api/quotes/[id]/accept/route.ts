import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getBaseUrl, resend, FROM_EMAIL } from "@/lib/resend";
import { generateQuoteAcceptedEmail } from "@/lib/emails/quote-accepted";

// GET /api/quote/[id]/accept - Direct link from email to accept quote
// No page needed, just update DB and redirect to confirmation
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const baseUrl = getBaseUrl();

  try {
    const supabase = await getSupabaseServerClient();

    // Check if quote exists and get current status + client_id
    const { data: quote, error: fetchError } = await supabase
      .from("quotes")
      .select("id, status, quote_number, client_id")
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
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("[quote/accept] update error:", updateError);
      return NextResponse.redirect(`${baseUrl}/quote/error?reason=update_failed`);
    }

    // Update client: convert prospect to client, update workflow_state, auto-check devis items
    if (quote.client_id) {
      try {
        // Get current client data including email for thank you email
        const { data: client } = await supabase
          .from("clients")
          .select("checklists, workflow_state, first_name, last_name, email, crm_stage")
          .eq("id", quote.client_id)
          .single();

        // Update checklists - auto-check q3 (Devis validé)
        const updatedChecklists = client?.checklists || {};
        if (updatedChecklists.devis?.items) {
          updatedChecklists.devis.items = updatedChecklists.devis.items.map(
            (item: { id: string; checked?: boolean }) => {
              if (item.id === "q3") {
                return { ...item, checked: true };
              }
              return item;
            }
          );
        }

        // Update workflow state
        const updatedWorkflowState = {
          ...(client?.workflow_state || {}),
          devis_response: "accepted",
          devis_accepted: true,
          devis_accepted_at: new Date().toISOString(),
        };

        // Update client:
        // - is_prospect = false (prospect becomes client)
        // - Keep current stage (will move to Intervention when RDV is created)
        await supabase
          .from("clients")
          .update({
            is_prospect: false, // 🔄 Prospect → Client conversion
            checklists: updatedChecklists,
            workflow_state: updatedWorkflowState,
          })
          .eq("id", quote.client_id);

        console.log(`[quote/accept] Client ${quote.client_id} converted from prospect, devis accepted`);

        // 📧 Send thank you email with booking link
        if (client?.email) {
          try {
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

            console.log(`[quote/accept] Thank you email sent to ${client.email}`);
          } catch (emailError) {
            console.error("[quote/accept] email error:", emailError);
            // Don't fail - email is non-blocking
          }
        }
      } catch (clientError) {
        // Don't fail the whole request if client update fails
        console.error("[quote/accept] client update error:", clientError);
      }
    }

    // Redirect to success page
    return NextResponse.redirect(`${baseUrl}/quote/success?action=accepted&number=${quote.quote_number}`);
  } catch (error) {
    console.error("[quote/accept] error:", error);
    return NextResponse.redirect(`${baseUrl}/quote/error?reason=server_error`);
  }
}
