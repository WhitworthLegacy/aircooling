import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError, jsonCreated } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";
import { generateProspectPdf } from "@/lib/pdf/prospect-pdf";
import { generateProspectNotificationHtml } from "@/lib/pdf/prospect-email";
import { resend, FROM_EMAIL, getBaseUrl } from "@/lib/resend";
import { sendWelcomeEmail } from "@/lib/emails/nurturing";

// Schema accepts both old French field names (for backwards compat) and new English names
const ProspectSchema = z.object({
  type_client: z.enum(["Particulier", "Professionnel"]).default("Particulier"),
  // Support both nom/first_name
  nom: z.string().min(2, "Le nom est requis").optional(),
  first_name: z.string().min(2, "Le nom est requis").optional(),
  last_name: z.string().optional(),
  // Support both telephone/phone
  telephone: z.string().min(1, "Le téléphone est requis").optional(),
  phone: z.string().min(1, "Le téléphone est requis").optional(),
  email: z.string().email("Email invalide"),
  tva: z.string().optional(),
  source: z.string().default("Site web"),
  // Support both adresse/address_line1
  adresse: z.string().min(1, "L'adresse est requise").optional(),
  address_line1: z.string().min(1, "L'adresse est requise").optional(),
  // Support both localite/city
  localite: z.string().min(1, "La localité est requise").optional(),
  city: z.string().min(1, "La localité est requise").optional(),
  // Support both code_postal/postal_code
  code_postal: z.string().min(1, "Le code postal est requis").optional(),
  postal_code: z.string().min(1, "Le code postal est requis").optional(),
  // Support both type_demande/demand_type
  type_demande: z.string().min(1, "Le type de demande est requis").optional(),
  demand_type: z.string().min(1, "Le type de demande est requis").optional(),
  // Support both description_demande/demand_description
  description_demande: z.string().min(1, "La description est requise").optional(),
  demand_description: z.string().min(1, "La description est requise").optional(),
  // Support both marque_souhaitee/preferred_brand
  marque_souhaitee: z.string().optional(),
  preferred_brand: z.string().optional(),
  // Support both nombre_unites/unit_count
  nombre_unites: z.number().int().positive().optional(),
  unit_count: z.number().int().positive().optional(),
}).refine(
  (data) => data.nom || data.first_name,
  { message: "Le nom est requis", path: ["nom"] }
).refine(
  (data) => data.telephone || data.phone,
  { message: "Le téléphone est requis", path: ["telephone"] }
).refine(
  (data) => data.adresse || data.address_line1,
  { message: "L'adresse est requise", path: ["adresse"] }
).refine(
  (data) => data.localite || data.city,
  { message: "La localité est requise", path: ["localite"] }
).refine(
  (data) => data.code_postal || data.postal_code,
  { message: "Le code postal est requis", path: ["code_postal"] }
).refine(
  (data) => data.type_demande || data.demand_type,
  { message: "Le type de demande est requis", path: ["type_demande"] }
).refine(
  (data) => data.description_demande || data.demand_description,
  { message: "La description est requise", path: ["description_demande"] }
);

// Helper to normalize field names (support old French + new English names)
function normalizeProspectData(data: z.infer<typeof ProspectSchema>) {
  const firstName = data.first_name || (data.nom ? data.nom.split(' ')[0] : '');
  const lastName = data.last_name || (data.nom ? data.nom.split(' ').slice(1).join(' ') : '');

  return {
    first_name: firstName,
    last_name: lastName,
    phone: data.phone || data.telephone || '',
    email: data.email,
    tva: data.tva,
    source: data.source,
    address_line1: data.address_line1 || data.adresse || '',
    city: data.city || data.localite || '',
    postal_code: data.postal_code || data.code_postal || '',
    demand_type: data.demand_type || data.type_demande || '',
    demand_description: data.demand_description || data.description_demande || '',
    preferred_brand: data.preferred_brand || data.marque_souhaitee,
    unit_count: data.unit_count || data.nombre_unites,
    type_client: data.type_client,
    // Full name for display
    fullName: `${firstName} ${lastName}`.trim() || data.nom || '',
  };
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();
    const rawData = ProspectSchema.parse(body);
    const data = normalizeProspectData(rawData);

    const supabase = getSupabaseAdmin();

    // 1. Insert prospect (using new aligned column names)
    const { data: prospect, error: insertError } = await supabase
      .from("prospects")
      .insert({
        type_client: data.type_client,
        first_name: data.first_name,
        last_name: data.last_name || null,
        phone: data.phone || null,
        email: data.email || null,
        tva: data.tva || null,
        source: data.source,
        address_line1: data.address_line1 || null,
        city: data.city || null,
        postal_code: data.postal_code || null,
        demand_type: data.demand_type || null,
        demand_description: data.demand_description || null,
        preferred_brand: data.preferred_brand || null,
        unit_count: data.unit_count || null,
        crm_stage: "Nouveau",
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
        nom: data.fullName,
        telephone: data.phone,
        email: data.email,
        tva: data.tva,
        source: data.source,
        adresse: data.address_line1,
        localite: data.city,
        code_postal: data.postal_code,
        type_demande: data.demand_type,
        description_demande: data.demand_description,
        marque_souhaitee: data.preferred_brand,
        nombre_unites: data.unit_count,
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
        nom: data.fullName,
        telephone: data.phone,
        email: data.email,
        type_client: data.type_client,
        type_demande: data.demand_type,
        adresse: data.address_line1,
        localite: data.city,
        code_postal: data.postal_code,
        description_demande: data.demand_description,
        createdAt,
        adminUrl: `${baseUrl}/admin/prospects`,
      });

      await resend.emails.send({
        from: FROM_EMAIL,
        to: adminEmail,
        subject: `Nouveau prospect : ${data.fullName} – ${data.demand_type || "Demande de devis"}`,
        html,
      });

      console.info(`[prospects] Notification email sent to ${adminEmail}`);
    } catch (emailError) {
      console.error("[prospects] Email notification error:", emailError);
      // Non-blocking: prospect is still created
    }

    // 4. 🔥 Send welcome email to prospect (NURTURING SEQUENCE START)
    if (data.email) {
      try {
        await sendWelcomeEmail({
          to: data.email,
          prospectName: data.fullName,
          prospectId: prospect.id,
          demandType: data.demand_type,
        });
        console.info(`[prospects] ✅ Welcome email sent to ${data.email} (nurturing T+0)`);
      } catch (welcomeError) {
        console.error("[prospects] Welcome email error:", welcomeError);
        // Non-blocking
      }
    }

    // 5. 🔄 Create client entry in CRM with "Nouveau" stage and prospect badge
    let clientId: string | null = null;
    try {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          first_name: data.first_name,
          last_name: data.last_name || null,
          email: data.email || null,
          phone: data.phone || null,
          address_line1: data.address_line1 || null,
          city: data.city || null,
          postal_code: data.postal_code || null,
          notes: data.demand_description || null,
          source: data.source || "Site web",
          crm_stage: "Nouveau",
          is_prospect: true,
          prospect_id: prospect.id,
          demand_type: data.demand_type || null,
          type_client: data.type_client,
          tva: data.tva || null,
        })
        .select("id")
        .single();

      if (clientError) {
        console.error("[prospects] Client creation error:", clientError);
      } else {
        clientId = client.id;
        console.info(`[prospects] ✅ Client created in CRM: ${clientId} (is_prospect=true)`);
      }
    } catch (clientCreateError) {
      console.error("[prospects] Client creation failed:", clientCreateError);
      // Non-blocking: prospect is still created
    }

    return jsonCreated({
      prospect_id: prospect.id,
      client_id: clientId,
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
    const stage = searchParams.get("stage") || searchParams.get("statut");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("prospects")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (stage && stage !== "all") {
      query = query.eq("crm_stage", stage);
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
