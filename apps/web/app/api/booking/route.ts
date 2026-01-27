import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import { getBaseUrl } from "@/lib/resend";

const BookingBodySchema = z.object({
  service_type: z.string(),
  date: z.string(),
  slot: z.string(),
  client_name: z.string(),
  client_phone: z.string(),
  client_email: z.string().optional(),
  address: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
  language: z.string().optional(),
  whatsapp_optin: z.boolean().optional(),
  whatsapp_number: z.string().optional(),
  preferred_channel: z.string().optional(),
});

const BookingResponseSchema = z.object({
  ok: z.boolean(),
  appointment_id: z.string(),
  client_id: z.string(),
  status: z.string(),
});

/**
 * Build a valid ISO datetime using slot start only
 */
function buildScheduledAt(date: string, slot: string) {
  const start = String(slot).split("-")[0].trim(); // "10:30"
  return `${date}T${start}:00`;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();

    // Extract optional client_id (from verified RDV flow) before schema validation
    const verifiedClientId: string | undefined = body.client_id;

    const payload = BookingBodySchema.parse(body);

    const supabase = await getSupabaseServerClient();

    /* ---------------- CLIENT FIND OR CREATE ---------------- */

    // Normalize email: empty string or undefined should be null
    const clientEmail = payload.client_email?.trim() || null;

    // Determine source: explicit source param, or default based on context
    const clientSource = payload.source || "booking";

    let clientId: string;

    // If client_id provided from verified flow, use it directly
    if (verifiedClientId) {
      const { data: verifiedClient } = await supabase
        .from("clients")
        .select("id")
        .eq("id", verifiedClientId)
        .single();

      if (verifiedClient) {
        clientId = verifiedClient.id;
      } else {
        return jsonError("CLIENT_NOT_FOUND", "Client vérifié introuvable", requestId, 404);
      }
    } else if (clientEmail) {
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("email", clientEmail)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
        // Update WhatsApp preferences and language for existing client
        // Also update source if coming from WhatsApp (higher intent signal)
        const updatePayload: Record<string, unknown> = {
          whatsapp_optin: payload.whatsapp_optin ?? false,
          preferred_channel: payload.preferred_channel || (payload.whatsapp_optin ? "whatsapp" : "email"),
          phone_e164: payload.whatsapp_number || payload.client_phone,
          language: payload.language || "fr",
        };
        // Update source if it's whatsapp (overwrite generic sources)
        if (clientSource === "whatsapp") {
          updatePayload.source = "whatsapp";
        }
        await supabase
          .from("clients")
          .update(updatePayload)
          .eq("id", clientId);
      } else {
        // Create new client
        const { data: newClient, error: insertError } = await supabase
          .from("clients")
          .insert({
            full_name: payload.client_name,
            email: clientEmail,
            phone: payload.client_phone,
            address: payload.address || null,
            source: clientSource,
            crm_stage: "clients",
            language: payload.language || "fr",
            // WhatsApp preferences
            whatsapp_optin: payload.whatsapp_optin ?? false,
            preferred_channel: payload.preferred_channel || (payload.whatsapp_optin ? "whatsapp" : "email"),
            phone_e164: payload.whatsapp_number || payload.client_phone,
          })
          .select("id")
          .single();

        if (insertError) {
          console.error(`[booking] Client insert error:`, JSON.stringify(insertError));
          return jsonError("DATABASE_ERROR", `Failed to create client: ${insertError.message || insertError.code}`, requestId);
        }
        clientId = newClient.id;
      }
    } else {
      // No email - always create new client
      const { data: newClient, error: insertError } = await supabase
        .from("clients")
        .insert({
          full_name: payload.client_name,
          email: null,
          phone: payload.client_phone,
          address: payload.address || null,
          source: clientSource,
          crm_stage: "clients",
          language: payload.language || "fr",
          // WhatsApp preferences
          whatsapp_optin: payload.whatsapp_optin ?? false,
          preferred_channel: payload.preferred_channel || (payload.whatsapp_optin ? "whatsapp" : "email"),
          phone_e164: payload.whatsapp_number || payload.client_phone,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(`[booking] Client insert error:`, JSON.stringify(insertError));
        return jsonError("DATABASE_ERROR", `Failed to create client: ${insertError.message || insertError.code}`, requestId);
      }
      clientId = newClient.id;
    }

    /* ---------------- APPOINTMENT ---------------- */

    const scheduledAt = buildScheduledAt(payload.date, payload.slot);

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        client_id: clientId,
        service_type: payload.service_type,
        scheduled_at: scheduledAt,
        status: "pending",
        address: payload.address,
        notes: payload.message,
        customer_name: payload.client_name,
        customer_phone: payload.client_phone,
        duration_minutes: 90,
      })
      .select("id")
      .single();

    if (appointmentError) {
      console.error(`[booking] Appointment insert error:`, appointmentError);
      return jsonError("DATABASE_ERROR", "Failed to create appointment", requestId);
    }

    const appointmentId = appointment.id;

    /* ---------------- NOTIFICATION (optional - queue for email) ---------------- */

    if (clientEmail) {
      // Queue notification in notifications table if it exists
      try {
        await supabase.from("notifications").insert({
          template: "VD_APPOINTMENT_CONFIRMED",
          target_email: clientEmail,
          locale: payload.language || "fr",
          send_after: new Date().toISOString(),
          status: "queued",
          payload: JSON.stringify({
            client: {
              id: clientId,
              name: payload.client_name,
              email: clientEmail,
              phone: payload.client_phone,
            },
            appointment: {
              id: appointmentId,
              date: payload.date,
              slot: payload.slot,
              service_type: payload.service_type,
            },
          }),
        });
      } catch {
        // Notifications table may not exist - that's okay
        console.info(`[booking] Notification queue skipped (table may not exist)`);
      }
    }

    /* ---------------- ADMIN NOTIFICATION (new client email) ---------------- */

    // Fetch the created client to get tracking_id
    const { data: createdClient } = await supabase
      .from("clients")
      .select("tracking_id")
      .eq("id", clientId)
      .single();

    // Send admin notification (fire and forget)
    const baseUrl = getBaseUrl();
    void fetch(`${baseUrl}/api/admin/emails/new-client`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: payload.client_name,
        clientPhone: payload.client_phone,
        clientEmail: clientEmail,
        clientAddress: payload.address,
        serviceType: payload.service_type,
        trackingId: createdClient?.tracking_id,
        source: "Site web (booking)",
        preferredDate: payload.date,
        preferredSlot: payload.slot,
      }),
    }).catch((err) => {
      console.error("[booking] Admin notification failed:", err);
    });

    /* ---------------- BOOKING CONFIRMATION (email and/or WhatsApp) ---------------- */

    // Format tracking ID as 4-digit number
    const trackingIdFormatted = createdClient?.tracking_id
      ? String(createdClient.tracking_id).padStart(4, '0')
      : undefined;

    // Send confirmation via preferred channel (email and/or WhatsApp)
    const whatsappNumber = payload.whatsapp_number || payload.client_phone;

    void fetch(`${baseUrl}/api/admin/emails/booking-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: payload.client_name,
        clientEmail: clientEmail,
        appointmentDate: payload.date,
        appointmentSlot: payload.slot,
        serviceType: payload.service_type,
        address: payload.address,
        trackingId: trackingIdFormatted,
        // Notification preferences
        preferred_channel: payload.preferred_channel || "email",
        whatsapp_optin: payload.whatsapp_optin ?? false,
        phone_e164: payload.whatsapp_optin ? whatsappNumber : null,
        language: payload.language,
      }),
    }).catch((err) => {
      console.error("[booking] Booking confirmation failed:", err);
    });

    const response = BookingResponseSchema.parse({
      ok: true,
      appointment_id: appointmentId,
      client_id: clientId,
      status: "scheduled",
    });

    console.info(
      `[booking] requestId=${requestId} appointment=${appointmentId} client=${clientId}`
    );
    return jsonOk(response);
  } catch (error) {
    console.error(`[booking] requestId=${requestId}`, error);
    return jsonError("VALIDATION_ERROR", (error as Error).message, requestId);
  }
}
