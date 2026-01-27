import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError, jsonNotFound } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";

const UpdateProspectSchema = z.object({
  statut: z.string().optional(),
  notes_internes: z.string().optional(),
  visite_technique_date: z.string().optional(),
  visite_technique_heure: z.string().optional(),
  technicien_assigne: z.string().uuid().optional(),
  devis_montant_estimatif: z.number().optional(),
  devis_montant_final: z.number().optional(),
  client_id: z.string().uuid().optional(),
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
    const updates = UpdateProspectSchema.parse(body);

    const supabase = getSupabaseAdmin();

    const { data: prospect, error } = await supabase
      .from("prospects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[prospects] Update error:", error);
      if (error.code === "PGRST116") {
        return jsonNotFound("Prospect introuvable", requestId);
      }
      return jsonError("DATABASE_ERROR", "Erreur de mise à jour", requestId, 500);
    }

    console.info(`[prospects] requestId=${requestId} updated prospect=${id}`);
    return jsonOk({ prospect });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("VALIDATION_ERROR", error.errors[0].message, requestId, 400);
    }
    console.error(`[prospects] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const supabase = getSupabaseAdmin();

    const { data: prospect, error } = await supabase
      .from("prospects")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !prospect) {
      return jsonNotFound("Prospect introuvable", requestId);
    }

    return jsonOk({ prospect });
  } catch (error) {
    console.error(`[prospects] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
