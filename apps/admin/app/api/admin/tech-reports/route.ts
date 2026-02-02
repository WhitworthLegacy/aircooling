import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/adminAuth";

// GET /api/admin/tech-reports - List all tech reports (admin only)
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  // requireAdmin already ensures user is admin or super_admin

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("tech_reports")
      .select(
        `
        *,
        clients(id, first_name, last_name, phone, email),
        profiles!tech_reports_technician_id_fkey(id, full_name, email),
        quotes(id, quote_number, total, status),
        tech_report_items(
          id,
          inventory_item_id,
          quantity,
          unit_price,
          inventory_items(id, name, reference)
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: reports, error, count } = await query;

    if (error) {
      console.error("[admin/tech-reports] Fetch error:", error);
      return jsonError("DATABASE_ERROR", "Erreur de récupération", requestId, 500);
    }

    // If search query provided, filter by client name (post-query since Supabase doesn't support cross-table text search easily)
    let filteredReports = reports || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredReports = filteredReports.filter((report) => {
        const clientName = [
          (report.clients as { first_name?: string })?.first_name,
          (report.clients as { last_name?: string })?.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return clientName.includes(searchLower);
      });
    }

    return jsonOk({
      reports: filteredReports,
      total: search ? filteredReports.length : (count || 0),
    });
  } catch (error) {
    console.error(`[admin/tech-reports] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}

const UpdateReportSchema = z.object({
  id: z.string().uuid(),
  estimated_hours: z.number().min(0.5).max(100).optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        inventory_item_id: z.string().uuid(),
        quantity: z.number().min(1),
      })
    )
    .optional(),
});

// PATCH /api/admin/tech-reports - Update a tech report (admin only)
export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  // requireAdmin already ensures user is admin or super_admin

  try {
    const body = await request.json();
    const data = UpdateReportSchema.parse(body);

    const supabase = getSupabaseAdmin();

    // 1. Get existing report with quote
    const { data: existingReport, error: fetchError } = await supabase
      .from("tech_reports")
      .select("*, quotes(id, labor_total, parts_total, tax_rate)")
      .eq("id", data.id)
      .single();

    if (fetchError || !existingReport) {
      return jsonError("NOT_FOUND", "Rapport introuvable", requestId, 404);
    }

    const hourlyRate = existingReport.hourly_rate || 65;

    // 2. Update tech_report fields
    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.estimated_hours !== undefined) {
      updateFields.estimated_hours = data.estimated_hours;
    }
    if (data.notes !== undefined) {
      updateFields.notes = data.notes;
    }

    const { error: updateError } = await supabase
      .from("tech_reports")
      .update(updateFields)
      .eq("id", data.id);

    if (updateError) {
      console.error("[admin/tech-reports] Update error:", updateError);
      return jsonError("DATABASE_ERROR", "Erreur de mise à jour", requestId, 500);
    }

    // 3. Update tech_report_items if provided
    if (data.items !== undefined) {
      // Delete existing items
      await supabase.from("tech_report_items").delete().eq("report_id", data.id);

      // Get inventory items for pricing
      const itemIds = data.items.map((i) => i.inventory_item_id);
      let inventoryPrices: Record<string, number> = {};

      if (itemIds.length > 0) {
        const { data: invItems } = await supabase
          .from("inventory_items")
          .select("id, price_sell")
          .in("id", itemIds);

        inventoryPrices = (invItems || []).reduce(
          (acc, item) => ({ ...acc, [item.id]: item.price_sell || 0 }),
          {}
        );
      }

      // Insert new items
      if (data.items.length > 0) {
        const reportItems = data.items.map((item) => ({
          report_id: data.id,
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity,
          unit_price: inventoryPrices[item.inventory_item_id] || 0,
        }));

        const { error: itemsError } = await supabase
          .from("tech_report_items")
          .insert(reportItems);

        if (itemsError) {
          console.error("[admin/tech-reports] Items update error:", itemsError);
        }
      }
    }

    // 4. Recalculate and update quote if exists
    if (existingReport.quote_id) {
      const newEstimatedHours = data.estimated_hours ?? existingReport.estimated_hours;
      const laborTotal = newEstimatedHours * hourlyRate;

      // Calculate parts total from items
      let partsTotal = 0;
      if (data.items !== undefined) {
        const itemIds = data.items.map((i) => i.inventory_item_id);
        if (itemIds.length > 0) {
          const { data: invItems } = await supabase
            .from("inventory_items")
            .select("id, price_sell")
            .in("id", itemIds);

          const prices = (invItems || []).reduce(
            (acc, item) => ({ ...acc, [item.id]: item.price_sell || 0 }),
            {} as Record<string, number>
          );

          partsTotal = data.items.reduce(
            (sum, item) => sum + (prices[item.inventory_item_id] || 0) * item.quantity,
            0
          );
        }
      } else {
        // Get existing parts total from tech_report_items
        const { data: existingItems } = await supabase
          .from("tech_report_items")
          .select("quantity, unit_price")
          .eq("report_id", data.id);

        partsTotal = (existingItems || []).reduce(
          (sum, item) => sum + item.unit_price * item.quantity,
          0
        );
      }

      const taxRate = (existingReport.quotes as { tax_rate?: number })?.tax_rate || 21;
      const subtotal = laborTotal + partsTotal;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      // Update quote
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({
          labor_total: laborTotal,
          parts_total: partsTotal,
          tax_amount: taxAmount,
          total,
          labor_hours: newEstimatedHours,
          notes: data.notes ?? existingReport.notes,
          internal_notes: `Rapport technicien - ${newEstimatedHours}h (modifié)`,
        })
        .eq("id", existingReport.quote_id);

      if (quoteError) {
        console.error("[admin/tech-reports] Quote update error:", quoteError);
      }

      // Update quote_items
      if (data.items !== undefined) {
        // Delete existing quote items
        await supabase.from("quote_items").delete().eq("quote_id", existingReport.quote_id);

        // Get inventory items for names
        const itemIds = data.items.map((i) => i.inventory_item_id);
        let inventoryNames: Record<string, { name: string; reference?: string; price_sell: number }> = {};

        if (itemIds.length > 0) {
          const { data: invItems } = await supabase
            .from("inventory_items")
            .select("id, name, reference, price_sell")
            .in("id", itemIds);

          inventoryNames = (invItems || []).reduce(
            (acc, item) => ({
              ...acc,
              [item.id]: { name: item.name, reference: item.reference, price_sell: item.price_sell || 0 },
            }),
            {}
          );
        }

        // Insert new quote items
        const quoteItems = [
          {
            quote_id: existingReport.quote_id,
            kind: "labor",
            label: "Main d'oeuvre intervention",
            description: `${newEstimatedHours}h x ${hourlyRate}€/h`,
            quantity: newEstimatedHours,
            unit_price: hourlyRate,
            line_total: laborTotal,
            sort_order: 0,
          },
          ...data.items.map((item, index) => {
            const inv = inventoryNames[item.inventory_item_id];
            return {
              quote_id: existingReport.quote_id,
              kind: "part",
              label: inv ? `${inv.name}${inv.reference ? ` (${inv.reference})` : ""}` : "Pièce",
              description: null,
              quantity: item.quantity,
              unit_price: inv?.price_sell || 0,
              line_total: (inv?.price_sell || 0) * item.quantity,
              inventory_item_id: item.inventory_item_id,
              sort_order: index + 1,
            };
          }),
        ];

        const { error: quoteItemsError } = await supabase.from("quote_items").insert(quoteItems);

        if (quoteItemsError) {
          console.error("[admin/tech-reports] Quote items update error:", quoteItemsError);
        }
      }
    }

    console.info(`[admin/tech-reports] requestId=${requestId} Updated report ${data.id}`);

    return jsonOk({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("VALIDATION_ERROR", error.errors[0].message, requestId, 400);
    }
    console.error(`[admin/tech-reports] requestId=${requestId}`, error);
    return jsonError("INTERNAL_ERROR", "Erreur interne", requestId, 500);
  }
}
