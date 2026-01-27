import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError, jsonNotFound } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";

const UpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const body = await request.json();
    const updates = UpdateSchema.parse(body);

    const supabase = getSupabaseAdmin();

    const { data: appointment, error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[appointments] Update error:", error);
      if (error.code === "PGRST116") {
        return jsonNotFound("Rendez-vous introuvable", requestId);
      }
      return jsonError("DATABASE_ERROR", "Erreur de mise à jour", requestId, 500);
    }

    return jsonOk({ appointment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("VALIDATION_ERROR", error.errors[0].message, requestId, 400);
    }
    console.error(`[appointments] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
