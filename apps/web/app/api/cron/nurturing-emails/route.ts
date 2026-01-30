import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { sendFollowUpEmail, sendUrgencyEmail } from "@/lib/emails/nurturing";

/**
 * Cron job to send nurturing emails to prospects
 *
 * Schedule in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/nurturing-emails",
 *     "schedule": "0 9 * * *"  // Every day at 9:00 AM
 *   }]
 * }
 *
 * Or use Vercel dashboard to set up cron
 */
export async function GET(request: NextRequest) {
  // Verify this is a cron request (check authorization header)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "dev-secret-change-in-production";

  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const results = {
    followUps: 0,
    urgency: 0,
    errors: 0,
  };

  try {
    // Fetch prospects created in last 7 days who haven't been contacted
    const { data: prospects, error } = await supabase
      .from("prospects")
      .select("id, created_at, nom, email, type_demande, statut")
      .in("statut", ["Nouveau", "A contacter"])
      .gte("created_at", new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString())
      .not("email", "is", null);

    if (error) throw error;

    for (const prospect of prospects || []) {
      const createdAt = new Date(prospect.created_at);
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 3600);

      try {
        // Send follow-up email 24h after creation (±1h tolerance)
        if (hoursSinceCreation >= 23 && hoursSinceCreation <= 25) {
          await sendFollowUpEmail({
            to: prospect.email,
            prospectName: prospect.nom,
            prospectId: prospect.id,
            demandType: prospect.type_demande || undefined,
          });
          results.followUps++;
          console.log(`[cron] Follow-up sent to ${prospect.email} (T+24h)`);
        }

        // Send urgency email 72h after creation (±1h tolerance)
        if (hoursSinceCreation >= 71 && hoursSinceCreation <= 73) {
          await sendUrgencyEmail({
            to: prospect.email,
            prospectName: prospect.nom,
            prospectId: prospect.id,
          });
          results.urgency++;
          console.log(`[cron] Urgency sent to ${prospect.email} (T+72h)`);
        }
      } catch (emailError) {
        console.error(`[cron] Error sending to ${prospect.email}:`, emailError);
        results.errors++;
      }
    }

    return Response.json({
      success: true,
      processed: prospects?.length || 0,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[cron] Nurturing emails failed:", error);
    return Response.json({
      success: false,
      error: "Internal server error",
      timestamp: now.toISOString(),
    }, { status: 500 });
  }
}
