import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireTech } from "@/lib/techAuth";
import { resend, FROM_EMAIL, generateQuoteEmailHtml, defaultBrand } from "@/lib/resend";

const ReportItemSchema = z.object({
  inventory_item_id: z.string().uuid(),
  quantity: z.number().min(1).default(1),
});

const ReportSchema = z.object({
  client_id: z.string().uuid("Client ID invalide"),
  appointment_id: z.string().uuid().optional(),
  plan_image: z.string().min(1, "L'image du plan est requise"),
  estimated_hours: z.number().min(0.5, "Minimum 0.5 heure").max(100, "Maximum 100 heures"),
  items: z.array(ReportItemSchema).optional(),
  signature_image: z.string().min(1, "La signature est requise"),
  notes: z.string().optional(),
});

// Default hourly rate (can be overridden in env)
const HOURLY_RATE = parseFloat(process.env.TECH_HOURLY_RATE || "65");
const TAX_RATE = 21; // Belgium VAT

// POST /api/tech/reports - Submit a technician report (creates quote + sends email)
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireTech();
  if ("error" in auth && auth.error) return auth.error;

  const technicianId = auth.user.id;

  try {
    const body = await request.json();
    const data = ReportSchema.parse(body);

    const supabase = getSupabaseAdmin();

    // 1. Verify client exists and get their info
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, first_name, last_name, email, phone, address, city")
      .eq("id", data.client_id)
      .single();

    if (clientError || !client) {
      return jsonError("NOT_FOUND", "Client introuvable", requestId, 404);
    }

    if (!client.email) {
      return jsonError("VALIDATION_ERROR", "Le client n'a pas d'adresse email", requestId, 400);
    }

    // 2. Get inventory items for pricing
    const itemIds = (data.items || []).map((i) => i.inventory_item_id);
    let inventoryItems: Array<{ id: string; name: string; price_sell: number }> = [];

    if (itemIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from("inventory_items")
        .select("id, name, reference, price_sell")
        .in("id", itemIds);

      if (itemsError) {
        console.error("[tech/reports] Inventory fetch error:", itemsError);
        return jsonError("DATABASE_ERROR", "Erreur de récupération des pièces", requestId, 500);
      }

      inventoryItems = (items || []).map((item) => ({
        id: item.id,
        name: `${item.name}${item.reference ? ` (${item.reference})` : ""}`,
        price_sell: item.price_sell || 0,
      }));
    }

    // 3. Upload plan image to Supabase Storage
    const planBase64 = data.plan_image.replace(/^data:image\/\w+;base64,/, "");
    const planBuffer = Buffer.from(planBase64, "base64");
    const planFileName = `tech-reports/${data.client_id}/${requestId}-plan.png`;

    const { error: planUploadError } = await supabase.storage
      .from("documents")
      .upload(planFileName, planBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (planUploadError) {
      console.error("[tech/reports] Plan upload error:", planUploadError);
      return jsonError("UPLOAD_ERROR", "Erreur d'upload du plan", requestId, 500);
    }

    const { data: planUrlData } = supabase.storage.from("documents").getPublicUrl(planFileName);
    const planUrl = planUrlData.publicUrl;

    // 4. Upload signature image to Supabase Storage
    const sigBase64 = data.signature_image.replace(/^data:image\/\w+;base64,/, "");
    const sigBuffer = Buffer.from(sigBase64, "base64");
    const sigFileName = `tech-reports/${data.client_id}/${requestId}-signature.png`;

    const { error: sigUploadError } = await supabase.storage
      .from("documents")
      .upload(sigFileName, sigBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (sigUploadError) {
      console.error("[tech/reports] Signature upload error:", sigUploadError);
      return jsonError("UPLOAD_ERROR", "Erreur d'upload de la signature", requestId, 500);
    }

    const { data: sigUrlData } = supabase.storage.from("documents").getPublicUrl(sigFileName);
    const signatureUrl = sigUrlData.publicUrl;

    // 5. Calculate totals
    const laborTotal = data.estimated_hours * HOURLY_RATE;

    let partsTotal = 0;
    const partDetails: Array<{
      inventory_item_id: string;
      name: string;
      quantity: number;
      unit_price: number;
      line_total: number;
    }> = [];

    for (const item of data.items || []) {
      const invItem = inventoryItems.find((i) => i.id === item.inventory_item_id);
      if (invItem) {
        const lineTotal = invItem.price_sell * item.quantity;
        partsTotal += lineTotal;
        partDetails.push({
          inventory_item_id: item.inventory_item_id,
          name: invItem.name,
          quantity: item.quantity,
          unit_price: invItem.price_sell,
          line_total: lineTotal,
        });
      }
    }

    const subtotal = laborTotal + partsTotal;
    const taxAmount = subtotal * (TAX_RATE / 100);
    const total = subtotal + taxAmount;

    // 6. Generate quote number
    const currentYear = new Date().getFullYear();
    const { count } = await supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${currentYear}-01-01`);

    const sequence = String((count || 0) + 1).padStart(3, "0");
    const quoteNumber = `${currentYear}${sequence}`;

    // 7. Create quote
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        client_id: data.client_id,
        quote_number: quoteNumber,
        status: "sent", // Already sent after signature
        labor_total: laborTotal,
        parts_total: partsTotal,
        tax_rate: TAX_RATE,
        tax_amount: taxAmount,
        total,
        expires_at: expiresAt,
        notes: data.notes || null,
        internal_notes: `Rapport technicien - ${data.estimated_hours}h`,
        labor_hours: data.estimated_hours,
        labor_type: "intervention",
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (quoteError) {
      console.error("[tech/reports] Quote create error:", quoteError);
      return jsonError("DATABASE_ERROR", "Erreur de création du devis", requestId, 500);
    }

    // 8. Create quote_items
    const quoteItems = [
      {
        quote_id: quote.id,
        kind: "labor",
        label: "Main d'oeuvre intervention",
        description: `${data.estimated_hours}h x ${HOURLY_RATE}EUR/h`,
        quantity: data.estimated_hours,
        unit_price: HOURLY_RATE,
        line_total: laborTotal,
        sort_order: 0,
      },
      ...partDetails.map((part, index) => ({
        quote_id: quote.id,
        kind: "part",
        label: part.name,
        description: null,
        quantity: part.quantity,
        unit_price: part.unit_price,
        line_total: part.line_total,
        inventory_item_id: part.inventory_item_id,
        sort_order: index + 1,
      })),
    ];

    const { error: quoteItemsError } = await supabase.from("quote_items").insert(quoteItems);

    if (quoteItemsError) {
      console.error("[tech/reports] Quote items error:", quoteItemsError);
      // Non-blocking, quote was created
    }

    // 9. Create tech_report
    const { data: report, error: reportError } = await supabase
      .from("tech_reports")
      .insert({
        client_id: data.client_id,
        appointment_id: data.appointment_id || null,
        technician_id: technicianId,
        plan_image_url: planUrl,
        estimated_hours: data.estimated_hours,
        hourly_rate: HOURLY_RATE,
        notes: data.notes || null,
        signature_image_url: signatureUrl,
        signed_at: new Date().toISOString(),
        quote_id: quote.id,
        status: "signed",
      })
      .select()
      .single();

    if (reportError) {
      console.error("[tech/reports] Report create error:", reportError);
      return jsonError("DATABASE_ERROR", "Erreur de création du rapport", requestId, 500);
    }

    // 10. Create tech_report_items
    if (partDetails.length > 0) {
      const reportItems = partDetails.map((part) => ({
        report_id: report.id,
        inventory_item_id: part.inventory_item_id,
        quantity: part.quantity,
        unit_price: part.unit_price,
      }));

      const { error: reportItemsError } = await supabase
        .from("tech_report_items")
        .insert(reportItems);

      if (reportItemsError) {
        console.error("[tech/reports] Report items error:", reportItemsError);
        // Non-blocking
      }
    }

    // 11. Update client's plan_image_url
    await supabase
      .from("clients")
      .update({ plan_image_url: planUrl })
      .eq("id", data.client_id);

    // 12. Send quote email to client
    const clientName =
      [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client";

    const emailItems = [
      {
        description: `Main d'oeuvre (${data.estimated_hours}h)`,
        quantity: 1,
        unitPrice: laborTotal,
        total: laborTotal,
      },
      ...partDetails.map((part) => ({
        description: part.name,
        quantity: part.quantity,
        unitPrice: part.unit_price,
        total: part.line_total,
      })),
    ];

    const validUntil = new Date(expiresAt).toLocaleDateString("fr-BE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const html = generateQuoteEmailHtml({
      clientName,
      clientEmail: client.email,
      quoteNumber,
      quoteId: quote.id,
      items: emailItems,
      totalAmount: total,
      validUntil,
      brand: defaultBrand,
    });

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: client.email,
        subject: `Devis Aircooling - ${quoteNumber}`,
        html,
      });
      console.info(`[tech/reports] Quote email sent to ${client.email}`);
    } catch (emailError) {
      console.error("[tech/reports] Email send error:", emailError);
      // Non-blocking - report and quote are already created
    }

    // 13. Update quote status to quote_sent in tech_report
    await supabase
      .from("tech_reports")
      .update({ status: "quote_sent" })
      .eq("id", report.id);

    console.info(
      `[tech/reports] requestId=${requestId} report=${report.id} quote=${quote.id} client=${data.client_id}`
    );

    return jsonOk({
      success: true,
      report_id: report.id,
      quote_id: quote.id,
      quote_number: quoteNumber,
      total,
      email_sent_to: client.email,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("VALIDATION_ERROR", error.errors[0].message, requestId, 400);
    }
    console.error(`[tech/reports] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne du serveur", requestId, 500);
  }
}

// GET /api/tech/reports - List technician's own reports
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireTech();
  if ("error" in auth && auth.error) return auth.error;

  const technicianId = auth.user.id;

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const { data: reports, error, count } = await supabase
      .from("tech_reports")
      .select(
        `
        *,
        clients(id, first_name, last_name, phone, email),
        quotes(id, quote_number, total, status)
      `,
        { count: "exact" }
      )
      .eq("technician_id", technicianId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[tech/reports] Fetch error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de récupération", requestId, 500);
    }

    return jsonOk({
      reports: reports || [],
      total: count || 0,
    });
  } catch (error) {
    console.error(`[tech/reports] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
