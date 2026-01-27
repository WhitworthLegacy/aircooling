import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError, jsonCreated } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";
import { generateProspectPdf } from "@/lib/pdf/prospect-pdf";
import { generateProspectNotificationHtml } from "@/lib/pdf/prospect-email";
import { resend, FROM_EMAIL, getBaseUrl } from "@/lib/resend";

const ProspectSchema = z.object({
  type_client: z.enum(["Particulier", "Professionnel"]).default("Particulier"),
  nom: z.string().min(2, "Le nom est requis"),
  telephone: z.string().min(1, "Le téléphone est requis"),
  email: z.string().email("Email invalide"),
  tva: z.string().optional(),
  source: z.string().default("Site web"),
  adresse: z.string().min(1, "L'adresse est requise"),
  localite: z.string().min(1, "La localité est requise"),
  code_postal: z.string().min(1, "Le code postal est requis"),
  type_demande: z.string().min(1, "Le type de demande est requis"),
  description_demande: z.string().min(1, "La description est requise"),
  marque_souhaitee: z.string().optional(),
  nombre_unites: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();
    const data = ProspectSchema.parse(body);

    const supabase = getSupabaseAdmin();

    // 1. Insert prospect
    const { data: prospect, error: insertError } = await supabase
      .from("prospects")
      .insert({
        type_client: data.type_client,
        nom: data.nom,
        telephone: data.telephone || null,
        email: data.email || null,
        tva: data.tva || null,
        source: data.source,
        adresse: data.adresse || null,
        localite: data.localite || null,
        code_postal: data.code_postal || null,
        type_demande: data.type_demande || null,
        description_demande: data.description_demande || null,
        marque_souhaitee: data.marque_souhaitee || null,
        nombre_unites: data.nombre_unites || null,
        statut: "Nouveau",
      })
      .select()
      .single();

    if (insertError || !prospect) {
      console.error("[prospects] Insert error:", insertError);
      return jsonError("DATABASE_ERROR", "Erreur lors de la création du prospect", requestId, 500);
    }

    console.info(`[prospects] requestId=${requestId} created prospect=${prospect.id}`);

    // 2. Generate PDF
    let pdfUrl: string | null = null;
    try {
      const pdfBuffer = generateProspectPdf({
        id: prospect.id,
        created_at: prospect.created_at,
        updated_at: prospect.updated_at,
        type_client: data.type_client,
        nom: data.nom,
        telephone: data.telephone,
        email: data.email,
        tva: data.tva,
        source: data.source,
        adresse: data.adresse,
        localite: data.localite,
        code_postal: data.code_postal,
        type_demande: data.type_demande,
        description_demande: data.description_demande,
        marque_souhaitee: data.marque_souhaitee,
        nombre_unites: data.nombre_unites,
        statut: "Nouveau",
      });

      const fileName = `prospects/${prospect.id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        console.error("[prospects] PDF upload error:", uploadError);
      } else {
        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(fileName);
        pdfUrl = urlData.publicUrl;

        // Update prospect with PDF URL
        await supabase
          .from("prospects")
          .update({ pdf_url: pdfUrl })
          .eq("id", prospect.id);

        console.info(`[prospects] PDF uploaded: ${pdfUrl}`);
      }
    } catch (pdfError) {
      console.error("[prospects] PDF generation error:", pdfError);
      // Non-blocking: prospect is still created even if PDF fails
    }

    // 3. Send notification email to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "info@aircooling.be";
      const baseUrl = getBaseUrl();
      const createdAt = new Date(prospect.created_at).toLocaleDateString("fr-BE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const html = generateProspectNotificationHtml({
        prospectId: prospect.id,
        nom: data.nom,
        telephone: data.telephone,
        email: data.email,
        type_client: data.type_client,
        type_demande: data.type_demande,
        adresse: data.adresse,
        localite: data.localite,
        code_postal: data.code_postal,
        description_demande: data.description_demande,
        createdAt,
        adminUrl: `${baseUrl}/admin/prospects`,
      });

      await resend.emails.send({
        from: FROM_EMAIL,
        to: adminEmail,
        subject: `Nouveau prospect : ${data.nom} – ${data.type_demande || "Demande de devis"}`,
        html,
      });

      console.info(`[prospects] Notification email sent to ${adminEmail}`);
    } catch (emailError) {
      console.error("[prospects] Email notification error:", emailError);
      // Non-blocking: prospect is still created
    }

    return jsonCreated({
      prospect_id: prospect.id,
      pdf_url: pdfUrl,
      message: "Votre demande de devis a été envoyée avec succès.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("VALIDATION_ERROR", error.errors[0].message, requestId, 400);
    }
    console.error(`[prospects] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne du serveur", requestId, 500);
  }
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  // Admin-only endpoint
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get("statut");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("prospects")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (statut && statut !== "all") {
      query = query.eq("statut", statut);
    }

    const { data: prospects, error, count } = await query;

    if (error) {
      console.error("[prospects] Fetch error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de récupération", requestId, 500);
    }

    return jsonOk({ prospects: prospects || [], total: count || 0 });
  } catch (error) {
    console.error(`[prospects] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
