import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";

const PlanSchema = z.object({
  prospect_id: z.string().uuid("Prospect ID invalide"),
  plan_image: z.string().min(1, "L'image du plan est requise"),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();
    const data = PlanSchema.parse(body);

    const supabase = getSupabaseAdmin();

    // 1. Verify prospect exists
    const { data: prospect, error: prospectError } = await supabase
      .from("prospects")
      .select("id")
      .eq("id", data.prospect_id)
      .single();

    if (prospectError || !prospect) {
      return jsonError("NOT_FOUND", "Prospect introuvable", requestId, 404);
    }

    // 2. Convert base64 to buffer
    const base64Data = data.plan_image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 3. Upload to Supabase Storage
    const fileName = `plans/${data.prospect_id}.png`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[prospect-plan] Upload error:", uploadError);
      return jsonError("UPLOAD_ERROR", "Erreur lors de l'upload du plan", requestId, 500);
    }

    // 4. Get public URL
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName);
    const planUrl = urlData.publicUrl;

    // 5. Update prospect with plan URL
    const { error: updateError } = await supabase
      .from("prospects")
      .update({ plan_image_url: planUrl })
      .eq("id", data.prospect_id);

    if (updateError) {
      console.error("[prospect-plan] Update error:", updateError);
      return jsonError("DATABASE_ERROR", "Erreur lors de la mise à jour", requestId, 500);
    }

    console.info(`[prospect-plan] requestId=${requestId} plan saved for prospect=${data.prospect_id}`);

    return jsonOk({
      plan_url: planUrl,
      message: "Plan enregistré avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("VALIDATION_ERROR", error.errors[0].message, requestId, 400);
    }
    console.error(`[prospect-plan] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne du serveur", requestId, 500);
  }
}
