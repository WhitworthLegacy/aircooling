import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

// This endpoint captures client responses from the maintenance reminder email
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const action = searchParams.get("action"); // 'accept' or 'decline'

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aircooling.be";

  if (!token || !action) {
    return NextResponse.redirect(`${siteUrl}/maintenance-response?error=invalid`);
  }

  try {
    const supabase = getSupabaseAdmin();

    // Find client by token
    const { data: client, error } = await supabase
      .from("clients")
      .select("id, first_name, last_name, email, phone, crm_stage")
      .eq("reminder_token", token)
      .single();

    if (error || !client) {
      console.error("[maintenance-response] Client not found:", error);
      return NextResponse.redirect(`${siteUrl}/maintenance-response?error=not_found`);
    }

    if (action === "accept") {
      // Update client: mark as annual maintenance and move to pipeline
      await supabase
        .from("clients")
        .update({
          reminder_response: "accepted",
          is_annual_maintenance: true,
          crm_stage: "Visite planifiée",
          reminder_token: null, // Clear token after use
        })
        .eq("id", client.id);

      // Create an appointment request (optional: auto-create appointment)
      await supabase.from("appointments").insert({
        client_id: client.id,
        customer_name: `${client.first_name || ""} ${client.last_name || ""}`.trim(),
        customer_email: client.email,
        customer_phone: client.phone,
        service_type: "Entretien annuel",
        status: "pending",
        notes: "Demande d'entretien annuel suite au rappel M+9",
      });

      return NextResponse.redirect(`${siteUrl}/maintenance-response?status=accepted`);
    } else if (action === "decline") {
      // Update client: mark as declined
      await supabase
        .from("clients")
        .update({
          reminder_response: "declined",
          reminder_token: null,
        })
        .eq("id", client.id);

      return NextResponse.redirect(`${siteUrl}/maintenance-response?status=declined`);
    }

    return NextResponse.redirect(`${siteUrl}/maintenance-response?error=invalid_action`);
  } catch (error) {
    console.error("[maintenance-response] Error:", error);
    return NextResponse.redirect(`${siteUrl}/maintenance-response?error=server`);
  }
}
