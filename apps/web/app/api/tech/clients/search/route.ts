import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireTech } from "@/lib/techAuth";

const SearchSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
});

// POST /api/tech/clients/search - Secure client search (requires 2/3 fields to match)
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireTech();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const body = await request.json();
    const data = SearchSchema.parse(body);

    const { first_name, last_name, phone } = data;

    // Count provided fields
    const providedFields = [first_name, last_name, phone].filter(
      (f) => f && f.trim().length > 0
    ).length;

    if (providedFields < 2) {
      return jsonError(
        "VALIDATION_ERROR",
        "Veuillez remplir au moins 2 champs sur 3 (prénom, nom, téléphone)",
        requestId,
        400
      );
    }

    const supabase = getSupabaseAdmin();

    // Build query - fetch all clients and filter in code
    // This approach is more reliable for matching 2/3 fields
    const { data: potentialMatches, error } = await supabase
      .from("clients")
      .select("id, first_name, last_name, phone, email, city, address, plan_image_url")
      .limit(500);

    if (error) {
      console.error("[tech/clients/search] Search error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de recherche", requestId, 500);
    }

    // Now filter to find clients with at least 2 matching fields
    const normalizePhone = (p: string | null) =>
      p ? p.replace(/[\s\-\.]/g, "").toLowerCase() : "";

    const matchingClients = (potentialMatches || []).filter((client) => {
      let matchCount = 0;

      if (
        first_name?.trim() &&
        client.first_name?.toLowerCase().includes(first_name.trim().toLowerCase())
      ) {
        matchCount++;
      }

      if (
        last_name?.trim() &&
        client.last_name?.toLowerCase().includes(last_name.trim().toLowerCase())
      ) {
        matchCount++;
      }

      if (phone?.trim()) {
        const searchPhone = normalizePhone(phone);
        const clientPhone = normalizePhone(client.phone);
        if (clientPhone.includes(searchPhone) || searchPhone.includes(clientPhone)) {
          matchCount++;
        }
      }

      return matchCount >= 2;
    });

    if (matchingClients.length === 0) {
      return jsonError(
        "NOT_FOUND",
        "Aucun client trouvé avec ces informations. Vérifiez les données.",
        requestId,
        404
      );
    }

    // Return first match (or could return multiple if needed)
    return jsonOk({
      client: matchingClients[0],
      total_matches: matchingClients.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("VALIDATION_ERROR", error.errors[0].message, requestId, 400);
    }
    console.error(`[tech/clients/search] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
