import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";

const PlanSchema = z.object({
  plan_image: z.string().min(1, "L'image du plan est requise"),
});

// POST /api/clients/[id]/plan - Save plan drawing for a client
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await ctx.params;
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();
    const data = PlanSchema.parse(body);

    const supabase = getSupabaseAdmin();

    // 1. Verify client exists
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return jsonError("NOT_FOUND", "Client introuvable", requestId, 404);
    }

    // 2. Convert base64 to buffer
    const base64Data = data.plan_image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 3. Upload to Supabase Storage
    const fileName = `plans/clients/${clientId}.png`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[client-plan] Upload error:", uploadError);
      return jsonError("UPLOAD_ERROR", "Erreur lors de l'upload du plan", requestId, 500);
    }

    // 4. Get public URL
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName);
    const planUrl = urlData.publicUrl;

    // 5. Update client with plan URL
    const { error: updateError } = await supabase
      .from("clients")
      .update({ plan_image_url: planUrl })
      .eq("id", clientId);

    if (updateError) {
      console.error("[client-plan] Update error:", updateError);
      return jsonError("DATABASE_ERROR", "Erreur lors de la mise à jour", requestId, 500);
    }

    console.info(`[client-plan] requestId=${requestId} plan saved for client=${clientId}`);

    return jsonOk({
      plan_url: planUrl,
      message: "Plan enregistré avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("VALIDATION_ERROR", error.errors[0].message, requestId, 400);
    }
    console.error(`[client-plan] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne du serveur", requestId, 500);
  }
}

// GET /api/clients/[id]/plan - Get client's plan URL
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await ctx.params;
  const requestId = crypto.randomUUID();

  try {
    const supabase = getSupabaseAdmin();

    const { data: client, error } = await supabase
      .from("clients")
      .select("plan_image_url")
      .eq("id", clientId)
      .single();

    if (error || !client) {
      return jsonError("NOT_FOUND", "Client introuvable", requestId, 404);
    }

    return jsonOk({
      plan_url: client.plan_image_url || null,
    });
  } catch (error) {
    console.error(`[client-plan] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne du serveur", requestId, 500);
  }
}
