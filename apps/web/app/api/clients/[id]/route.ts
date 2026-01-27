import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError, jsonNotFound } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();

    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !client) {
      return jsonNotFound("Client non trouvé", requestId);
    }

    return jsonOk({ client });
  } catch (error) {
    console.error(`[clients/${(await context.params).id}] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = [
      "first_name", "last_name", "email", "phone",
      "address", "city", "postal_code",
      "system_type", "notes", "crm_stage",
      "language", "phone_e164", "whatsapp_optin",
      "preferred_channel", "checklists", "workflow_state",
      "selected_parts",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("VALIDATION_ERROR", "Aucun champ à mettre à jour", requestId, 400);
    }

    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[clients] Update error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de mise à jour", requestId, 500);
    }

    if (!data) {
      return jsonNotFound("Client non trouvé", requestId);
    }

    return jsonOk({ client: data });
  } catch (error) {
    console.error(`[clients/${(await context.params).id}] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
