import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// This endpoint should be called by a cron job daily
// It finds clients who had their last intervention 9 months ago and sends reminder emails
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("UNAUTHORIZED", "Invalid cron secret", requestId, 401);
  }

  try {
    const supabase = getSupabaseAdmin();

    // Find clients where last_intervention_date is approximately 9 months ago
    // and no reminder has been sent yet
    const nineMonthsAgo = new Date();
    nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);
    const nineMonthsAgoStart = new Date(nineMonthsAgo);
    nineMonthsAgoStart.setHours(0, 0, 0, 0);
    const nineMonthsAgoEnd = new Date(nineMonthsAgo);
    nineMonthsAgoEnd.setHours(23, 59, 59, 999);

    const { data: clients, error } = await supabase
      .from("clients")
      .select("id, first_name, last_name, email, phone, last_intervention_date")
      .gte("last_intervention_date", nineMonthsAgoStart.toISOString())
      .lte("last_intervention_date", nineMonthsAgoEnd.toISOString())
      .is("reminder_sent_at", null)
      .not("email", "is", null);

    if (error) {
      console.error("[cron/maintenance-reminders] Query error:", error);
      return jsonError("DATABASE_ERROR", "Failed to query clients", requestId, 500);
    }

    if (!clients || clients.length === 0) {
      return jsonOk({ message: "No clients to remind today", count: 0 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aircooling.be";
    const results = [];

    for (const client of clients) {
      // Generate unique token for this reminder
      const token = crypto.randomUUID();

      // Update client with token
      await supabase
        .from("clients")
        .update({
          reminder_token: token,
          reminder_sent_at: new Date().toISOString(),
        })
        .eq("id", client.id);

      // Build response URLs
      const acceptUrl = `${siteUrl}/api/maintenance-response?token=${token}&action=accept`;
      const declineUrl = `${siteUrl}/api/maintenance-response?token=${token}&action=decline`;

      const clientName = `${client.first_name || ""} ${client.last_name || ""}`.trim() || "Client";

      // Send email
      try {
        await resend.emails.send({
          from: process.env.FROM_EMAIL || "noreply@aircooling.be",
          to: client.email!,
          subject: "🔧 Votre entretien annuel climatisation - AirCooling",
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #ff6b35 0%, #1e40af 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🌀 AirCooling</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Entretien annuel climatisation</p>
    </div>

    <div style="padding: 30px;">
      <p style="font-size: 18px; color: #333;">Bonjour ${clientName},</p>

      <p style="color: #666; line-height: 1.6;">
        Cela fait maintenant <strong>9 mois</strong> depuis notre dernière intervention chez vous.
        Pour garantir le bon fonctionnement et la longévité de votre système de climatisation,
        nous vous recommandons un <strong>entretien annuel</strong>.
      </p>

      <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin: 25px 0;">
        <h3 style="margin: 0 0 10px; color: #1e40af;">✅ L'entretien comprend :</h3>
        <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Nettoyage des filtres et unités</li>
          <li>Vérification du gaz réfrigérant</li>
          <li>Contrôle des performances</li>
          <li>Diagnostic complet du système</li>
        </ul>
      </div>

      <p style="color: #666; margin-bottom: 25px;">
        Souhaitez-vous planifier votre entretien annuel ?
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 5px;">
          ✓ Oui, planifier mon entretien
        </a>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <a href="${declineUrl}" style="color: #999; font-size: 14px; text-decoration: underline;">
          Non merci, pas cette année
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

      <p style="color: #999; font-size: 14px; text-align: center;">
        Des questions ? Appelez-nous au <a href="tel:+32XXXXXXXX" style="color: #ff6b35;">+32 XXX XX XX XX</a><br>
        ou répondez simplement à cet email.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px; text-align: center;">
      <p style="color: #999; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} AirCooling - Climatisation & HVAC
      </p>
    </div>
  </div>
</body>
</html>
          `,
        });

        results.push({ client_id: client.id, status: "sent" });
      } catch (emailError) {
        console.error(`[cron/maintenance-reminders] Email failed for ${client.id}:`, emailError);
        results.push({ client_id: client.id, status: "failed", error: String(emailError) });
      }
    }

    return jsonOk({
      message: `Processed ${clients.length} clients`,
      count: clients.length,
      results,
    });
  } catch (error) {
    console.error(`[cron/maintenance-reminders] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
