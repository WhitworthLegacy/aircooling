import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError, jsonCreated } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "200");

    let query = supabase
      .from("clients")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (stage && stage !== "all") {
      query = query.eq("crm_stage", stage);
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data: clients, error, count } = await query;

    if (error) {
      console.error("[clients] Fetch error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de récupération", requestId, 500);
    }

    return jsonOk({ clients: clients || [], total: count || 0 });
  } catch (error) {
    console.error(`[clients] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const { data, error } = await supabase
      .from("clients")
      .insert({
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        postal_code: body.postal_code,
        system_type: body.system_type,
        notes: body.notes,
        crm_stage: body.crm_stage || "Nouveau",
      })
      .select()
      .single();

    if (error) {
      console.error("[clients] Insert error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de création", requestId, 500);
    }

    return jsonCreated({ client: data });
  } catch (error) {
    console.error(`[clients] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
