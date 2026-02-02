import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("client_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("appointments")
      .select("*, clients(first_name, last_name, email, phone)", {
        count: "exact",
      })
      .order("scheduled_at", { ascending: true })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    // Filter by date range if provided
    if (startDate) {
      query = query.gte("scheduled_at", `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte("scheduled_at", `${endDate}T23:59:59`);
    }

    const { data: appointments, error, count } = await query;

    if (error) {
      console.error("[appointments] Fetch error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de récupération", requestId, 500);
    }

    // Transform appointments to include slot/date for frontend compatibility
    const transformedAppointments = (appointments || []).map((appt) => ({
      ...appt,
      date: appt.scheduled_at ? appt.scheduled_at.split("T")[0] : null,
      slot: appt.scheduled_at
        ? new Date(appt.scheduled_at).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
    }));

    return jsonOk({ data: transformedAppointments, appointments: transformedAppointments, total: count || 0 });
  } catch (error) {
    console.error(`[appointments] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const body = await request.json();
    const {
      client_id,
      customer_name,
      customer_phone,
      service_type,
      date,
      slot,
      notes,
      address,
      driver_id,
      driver_name,
      duration_minutes,
    } = body;

    if (!service_type) {
      return jsonError("VALIDATION_ERROR", "service_type is required", requestId, 400);
    }

    if (!date) {
      return jsonError("VALIDATION_ERROR", "date is required", requestId, 400);
    }

    // Combine date and slot into scheduled_at timestamp
    const slotTime = slot || "09:00";
    const scheduled_at = new Date(`${date}T${slotTime}:00`).toISOString();

    const supabase = getSupabaseAdmin();

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        client_id: client_id || null,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        service_type,
        scheduled_at,
        duration_minutes: duration_minutes || 90,
        address: address || null,
        status: "pending",
        notes: notes || null,
        driver_id: driver_id || null,
        driver_name: driver_name || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[appointments] Create error:", error);
      return jsonError("DATABASE_ERROR", "Failed to create appointment", requestId, 500);
    }

    // 🔄 Auto-stage transition based on service_type
    if (client_id) {
      const isVisitType = ['devis', 'diagnostic'].includes(service_type);
      const isInterventionType = ['installation', 'entretien', 'depannage'].includes(service_type);

      if (isVisitType) {
        await supabase
          .from('clients')
          .update({ crm_stage: 'Visite planifiée' })
          .eq('id', client_id);
        console.info(`[appointments] Auto-moved client ${client_id} to "Visite planifiée"`);
      } else if (isInterventionType) {
        await supabase
          .from('clients')
          .update({ crm_stage: 'Intervention' })
          .eq('id', client_id);
        console.info(`[appointments] Auto-moved client ${client_id} to "Intervention"`);
      }
    }

    return jsonOk({
      success: true,
      appointment: {
        ...appointment,
        date: appointment.scheduled_at.split("T")[0],
        slot: slotTime,
      },
    });
  } catch (error) {
    console.error(`[appointments] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, status, date, slot, notes, driver_id, driver_name } = body;

    if (!id) {
      return jsonError("VALIDATION_ERROR", "id is required", requestId, 400);
    }

    const supabase = getSupabaseAdmin();

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (driver_id !== undefined) updateData.driver_id = driver_id;
    if (driver_name !== undefined) updateData.driver_name = driver_name;

    // If date/slot provided, update scheduled_at
    if (date && slot) {
      updateData.scheduled_at = new Date(`${date}T${slot}:00`).toISOString();
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[appointments] Update error:", error);
      return jsonError("DATABASE_ERROR", "Failed to update appointment", requestId, 500);
    }

    return jsonOk({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error(`[appointments] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
