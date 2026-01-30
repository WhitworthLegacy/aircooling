import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError, jsonCreated } from "@/lib/apiResponse";

const BonSchema = z.object({
  bon_n: z.string().min(1, "Le numéro de bon est requis"),
  client_nom: z.string().min(1, "Le nom du client est requis"),
  client_tva: z.string().min(1, "Le numéro de TVA est requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(1, "Le téléphone est requis"),
  client_adresse: z.string().min(1, "L'adresse est requise"),
  client_localite: z.string().min(1, "La localité est requise"),
  resp_nom: z.string().optional(),
  resp_adresse: z.string().optional(),
  resp_localite: z.string().optional(),
  resp_tva: z.string().optional(),
  technicien_nom: z.string().min(1, "Le nom du technicien est requis"),
  date_intervention: z.string().min(1, "La date d'intervention est requise"),
  type_intervention: z.enum(["Entretien", "Depannage", "Installation"]),
  heure_debut: z.string().min(1, "L'heure de début est requise"),
  heure_fin: z.string().min(1, "L'heure de fin est requise"),
  travaux_realises: z.string().min(1, "Les travaux réalisés sont requis"),
  fournitures: z.string().optional(),
  total_ht: z.string().min(1, "Le montant HT est requis"),
  tva_eur: z.string().optional(),
  total_ttc: z.string().optional(),
  acompte: z.string().min(1, "L'acompte est requis"),
  mode_paiement: z.enum(["Cash", "Virement"]),
  signature_tech: z.string().min(1, "La signature du technicien est requise"),
  signature_client: z.string().min(1, "La signature du client est requise"),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();
    const data = BonSchema.parse(body);

    const supabase = getSupabaseAdmin();

    // 1. Upload signatures to Storage
    let techSigUrl: string | null = null;
    let clientSigUrl: string | null = null;

    try {
      // Upload tech signature
      const techBase64 = data.signature_tech.replace(/^data:image\/\w+;base64,/, "");
      const techBuffer = Buffer.from(techBase64, "base64");
      const techFileName = `signatures/tech-${data.bon_n}-${Date.now()}.png`;

      const { error: techUploadError } = await supabase.storage
        .from("documents")
        .upload(techFileName, techBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (!techUploadError) {
        const { data: techUrlData } = supabase.storage.from("documents").getPublicUrl(techFileName);
        techSigUrl = techUrlData.publicUrl;
      }

      // Upload client signature
      const clientBase64 = data.signature_client.replace(/^data:image\/\w+;base64,/, "");
      const clientBuffer = Buffer.from(clientBase64, "base64");
      const clientFileName = `signatures/client-${data.bon_n}-${Date.now()}.png`;

      const { error: clientUploadError } = await supabase.storage
        .from("documents")
        .upload(clientFileName, clientBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (!clientUploadError) {
        const { data: clientUrlData } = supabase.storage.from("documents").getPublicUrl(clientFileName);
        clientSigUrl = clientUrlData.publicUrl;
      }
    } catch (sigError) {
      console.error("[bon] Signature upload error:", sigError);
      // Non-blocking
    }

    // 2. Insert intervention/bon into database
    const { data: intervention, error: insertError } = await supabase
      .from("interventions")
      .insert({
        bon_n: data.bon_n,
        client_nom: data.client_nom,
        client_tva: data.client_tva,
        email: data.email,
        telephone: data.telephone,
        client_adresse: data.client_adresse,
        client_localite: data.client_localite,
        resp_nom: data.resp_nom || null,
        resp_adresse: data.resp_adresse || null,
        resp_localite: data.resp_localite || null,
        resp_tva: data.resp_tva || null,
        technicien_nom: data.technicien_nom,
        date_intervention: data.date_intervention,
        type_intervention: data.type_intervention,
        heure_debut: data.heure_debut,
        heure_fin: data.heure_fin,
        travaux_realises: data.travaux_realises,
        fournitures: data.fournitures || null,
        total_ht: parseFloat(data.total_ht),
        tva_eur: data.tva_eur ? parseFloat(data.tva_eur) : null,
        total_ttc: data.total_ttc ? parseFloat(data.total_ttc) : null,
        acompte: parseFloat(data.acompte),
        mode_paiement: data.mode_paiement,
        signature_tech_url: techSigUrl,
        signature_client_url: clientSigUrl,
        statut: "Nouveau",
      })
      .select()
      .single();

    if (insertError || !intervention) {
      console.error("[bon] Insert error:", insertError);
      return jsonError("DATABASE_ERROR", "Erreur lors de la création du bon", requestId, 500);
    }

    console.info(`[bon] requestId=${requestId} created intervention=${intervention.id}`);

    // 3. TODO: Generate PDF and send email notification (similar to prospect)

    return jsonCreated({
      intervention_id: intervention.id,
      message: "Bon d'intervention enregistré avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("VALIDATION_ERROR", error.errors[0].message, requestId, 400);
    }
    console.error(`[bon] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne du serveur", requestId, 500);
  }
}
