import { NextRequest } from "next/server";
import { AvailabilityQuerySchema, AvailabilityResponseSchema } from "@velodoctor/core";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { jsonError, jsonOk } from "@/lib/apiResponse";

const SLOT_DURATION_MINUTES = 90;
const SLOTS = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"];
const TIMEZONE = process.env.TZ || "Europe/Brussels";

function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(Date.UTC(0, 0, 1, hour, minute));
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString().substring(11, 16);
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const query = AvailabilityQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    const supabase = getSupabaseServerClient();

    // Query appointments for the requested date from Supabase
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("scheduled_at, status")
      .gte("scheduled_at", `${query.date}T00:00:00`)
      .lt("scheduled_at", `${query.date}T23:59:59`)
      .not("status", "in", '("cancelled")');

    if (error) {
      console.error(`[availability] Supabase error:`, error);
      return jsonError("DATABASE_ERROR", "Failed to fetch appointments", requestId);
    }

    // Extract taken slot start times
    const takenStarts = new Set(
      (appointments || [])
        .filter((appt) => appt.status !== "cancelled")
        .map((appt) => {
          if (!appt.scheduled_at) return "";
          // Extract HH:MM from scheduled_at
          const time = new Date(appt.scheduled_at).toTimeString().slice(0, 5);
          return time;
        })
        .filter(Boolean)
    );

    const slots = SLOTS.map((start) => ({
      start,
      end: addMinutes(start, SLOT_DURATION_MINUTES),
      available: !takenStarts.has(start),
    }));

    const response = AvailabilityResponseSchema.parse({
      ok: true,
      date: query.date,
      timezone: TIMEZONE,
      slots,
      meta: {
        totalSlots: SLOTS.length,
        takenSlots: takenStarts.size,
      },
    });

    console.info(
      `[availability] requestId=${requestId} date=${query.date} taken=${takenStarts.size}`
    );
    return jsonOk(response);
  } catch (error) {
    console.error(`[availability] requestId=${requestId}`, error);
    return jsonError("VALIDATION_ERROR", (error as Error).message, requestId);
  }
}
