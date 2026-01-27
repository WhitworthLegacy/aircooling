import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";

const ClientVerifySchema = z
  .object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
  })
  .refine(
    (d) => [d.name, d.phone, d.email].filter((v) => v && v.trim()).length >= 2,
    { message: "Au moins 2 champs sur 3 sont requis" }
  );

/** Strip everything except digits */
function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/**
 * Compare two phone numbers by their last 9 digits.
 * Handles Belgian formats: +32487170610, 0487170610, 0487/17.06.10, etc.
 */
function phonesMatch(a: string, b: string): boolean {
  const da = digitsOnly(a);
  const db = digitsOnly(b);
  if (da.length < 8 || db.length < 8) return false;
  return da.slice(-9) === db.slice(-9);
}

/**
 * Case-insensitive name match.
 * Checks if all words from the input appear in the stored name.
 */
function namesMatch(input: string, stored: string): boolean {
  const inputWords = input.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const storedLower = stored.toLowerCase();
  if (inputWords.length === 0) return false;
  return inputWords.every((w) => storedLower.includes(w));
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();
    const payload = ClientVerifySchema.parse(body);

    const supabase = getSupabaseAdmin();

    // Build OR conditions to find candidate clients
    const orConditions: string[] = [];

    if (payload.email?.trim()) {
      orConditions.push(`email.ilike.${payload.email.trim()}`);
    }
    if (payload.phone?.trim()) {
      // Search by phone digits (partial match)
      const digits = digitsOnly(payload.phone);
      const last9 = digits.slice(-9);
      if (last9.length >= 8) {
        orConditions.push(`phone.ilike.%${last9.slice(-6)}%`);
      }
    }
    if (payload.name?.trim()) {
      // Search by first word of name
      const firstWord = payload.name.trim().split(/\s+/)[0];
      if (firstWord.length >= 2) {
        orConditions.push(`first_name.ilike.%${firstWord}%`);
        orConditions.push(`last_name.ilike.%${firstWord}%`);
      }
    }

    if (orConditions.length === 0) {
      return jsonOk({ verified: false, client_id: null });
    }

    const { data: candidates, error } = await supabase
      .from("clients")
      .select("id, first_name, last_name, email, phone")
      .or(orConditions.join(","))
      .limit(50);

    if (error) {
      console.error("[client-verify] DB error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de recherche", requestId, 500);
    }

    // Score each candidate: count how many of the 3 fields match
    let bestMatch: { id: string; score: number; first_name: string; last_name: string; email: string | null; phone: string | null } | null = null;

    for (const client of candidates || []) {
      let score = 0;

      // Check email match (case-insensitive exact)
      if (
        payload.email?.trim() &&
        client.email &&
        client.email.toLowerCase() === payload.email.trim().toLowerCase()
      ) {
        score++;
      }

      // Check phone match (last 9 digits)
      if (payload.phone?.trim() && client.phone) {
        if (phonesMatch(payload.phone, client.phone)) {
          score++;
        }
      }

      // Check name match (all input words appear in first_name + last_name)
      if (payload.name?.trim()) {
        const fullName = `${client.first_name || ""} ${client.last_name || ""}`;
        if (namesMatch(payload.name, fullName)) {
          score++;
        }
      }

      if (score >= 2 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { ...client, score };
      }
    }

    if (bestMatch) {
      console.info(`[client-verify] requestId=${requestId} verified=true client=${bestMatch.id} score=${bestMatch.score}`);
      return jsonOk({
        verified: true,
        client_id: bestMatch.id,
        client_name: `${bestMatch.first_name || ""} ${bestMatch.last_name || ""}`.trim(),
        client_email: bestMatch.email,
        client_phone: bestMatch.phone,
      });
    }

    console.info(`[client-verify] requestId=${requestId} verified=false candidates=${(candidates || []).length}`);
    return jsonOk({ verified: false, client_id: null });
  } catch (error) {
    console.error(`[client-verify] requestId=${requestId}`, error);
    return jsonError("VALIDATION_ERROR", (error as Error).message, requestId);
  }
}
