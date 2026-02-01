import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { defaultBrand, getBaseUrl } from "@/lib/resend";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quoteId = searchParams.get("id");
    const action = searchParams.get("action");
    const clientEmail = searchParams.get("email");

    if (!quoteId || !action) {
      return createHtmlResponse("error", "Lien invalide", "Les paramètres requis sont manquants.");
    }

    if (action !== "accept" && action !== "refuse") {
      return createHtmlResponse("error", "Action invalide", "L'action demandée n'est pas reconnue.");
    }

    const supabase = getSupabaseAdmin();

    // Fetch the quote
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(`
        *,
        clients (
          id,
          email,
          first_name,
          last_name,
          crm_stage
        )
      `)
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      return createHtmlResponse("error", "Devis non trouvé", "Ce devis n'existe pas ou a été supprimé.");
    }

    // Verify email matches (basic security)
    const client = quote.clients as { id: string; email?: string; crm_stage?: string } | null;
    if (clientEmail && client?.email && client.email.toLowerCase() !== decodeURIComponent(clientEmail).toLowerCase()) {
      return createHtmlResponse("error", "Non autorisé", "Vous n'êtes pas autorisé à effectuer cette action.");
    }

    // Check if already processed
    if (quote.status === "accepted" || quote.status === "refused") {
      const statusLabel = quote.status === "accepted" ? "accepté" : "refusé";
      return createHtmlResponse(
        quote.status === "accepted" ? "success" : "info",
        `Devis déjà ${statusLabel}`,
        `Ce devis a déjà été ${statusLabel}. Aucune action supplémentaire n'est nécessaire.`
      );
    }

    // Update quote status
    const newStatus = action === "accept" ? "accepted" : "refused";
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        status: newStatus,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    if (updateError) {
      console.error("[quotes/action] Update failed:", updateError);
      return createHtmlResponse("error", "Erreur", "Une erreur s'est produite. Veuillez réessayer ou nous contacter.");
    }

    // If accepted, update client CRM stage to "Intervention"
    if (action === "accept" && client?.id) {
      await supabase
        .from("clients")
        .update({ crm_stage: "intervention" })
        .eq("id", client.id);
    }

    // Return success page
    if (action === "accept") {
      return createHtmlResponse(
        "success",
        "Merci ! Votre devis est accepté",
        `Nous avons bien reçu votre confirmation pour le devis ${quote.quote_number}. Notre équipe vous contactera très prochainement pour planifier l'intervention.`
      );
    } else {
      return createHtmlResponse(
        "info",
        "Devis refusé",
        `Nous avons bien noté votre refus pour le devis ${quote.quote_number}. N'hésitez pas à nous contacter si vous changez d'avis ou avez des questions.`
      );
    }
  } catch (error) {
    console.error("[quotes/action] Error:", error);
    return createHtmlResponse("error", "Erreur", "Une erreur inattendue s'est produite.");
  }
}

function createHtmlResponse(
  type: "success" | "error" | "info",
  title: string,
  message: string
): NextResponse {
  const brand = defaultBrand;
  const colors = {
    success: { bg: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
    error: { bg: "#ef4444", gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
    info: { bg: "#6b7280", gradient: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)" },
  };
  const color = colors[type];
  const icon = type === "success" ? "✓" : type === "error" ? "✗" : "ℹ";

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${brand.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
      max-width: 500px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: ${color.gradient};
      padding: 40px 30px;
      text-align: center;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 40px;
      color: white;
    }
    .header h1 {
      color: white;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .content p {
      color: #4b5563;
      line-height: 1.7;
      font-size: 16px;
      margin-bottom: 30px;
    }
    .contact {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      margin-top: 20px;
    }
    .contact p {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
    }
    .contact a {
      color: ${brand.primaryColor};
      text-decoration: none;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #9ca3af;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">${icon}</div>
      <h1>${title}</h1>
    </div>
    <div class="content">
      <p>${message}</p>
      <div class="contact">
        <p>Des questions ? Contactez-nous :</p>
        <p style="margin-top: 10px;">
          <a href="tel:${brand.phone}">${brand.phone}</a>
        </p>
      </div>
    </div>
    <div class="footer">
      ${brand.name} - ${brand.address}
    </div>
  </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
