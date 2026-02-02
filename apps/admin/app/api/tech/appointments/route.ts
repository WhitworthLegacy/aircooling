import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireTech } from "@/lib/techAuth";

// GET /api/tech/appointments - List appointments assigned to current technician
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireTech();
  if ("error" in auth && auth.error) return auth.error;

  const technicianId = auth.user.id;

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = supabase
      .from("appointments")
      .select(
        `
        *,
        clients(id, first_name, last_name, email, phone, city, address)
      `,
        { count: "exact" }
      )
      .eq("technician_id", technicianId)
      .order("scheduled_at", { ascending: true });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("scheduled_at", `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte("scheduled_at", `${endDate}T23:59:59`);
    }

    const { data: appointments, error, count } = await query;

    if (error) {
      console.error("[tech/appointments] Fetch error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de récupération", requestId, 500);
    }

    // Transform for frontend
    const transformed = (appointments || []).map((appt) => ({
      ...appt,
      date: appt.scheduled_at ? appt.scheduled_at.split("T")[0] : null,
      slot: appt.scheduled_at
        ? new Date(appt.scheduled_at).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
    }));

    return jsonOk({
      appointments: transformed,
      total: count || 0,
    });
  } catch (error) {
    console.error(`[tech/appointments] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
