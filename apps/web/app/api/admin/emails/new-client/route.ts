import { NextRequest } from "next/server";
import { resend, FROM_EMAIL, generateNewClientNotificationHtml, defaultBrand } from "@/lib/resend";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info@aircooling.be";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientName,
      clientPhone,
      clientEmail,
      clientAddress,
      serviceType,
      trackingId,
      source,
      preferredDate,
      preferredSlot,
    } = body;

    if (!clientName || !serviceType) {
      return Response.json(
        { ok: false, error: "clientName and serviceType are required" },
        { status: 400 }
      );
    }

    const createdAt = new Date().toLocaleDateString("fr-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const adminUrl = `${process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.aircooling.be"}/dashboard/clients`;

    const html = generateNewClientNotificationHtml({
      clientName,
      clientPhone,
      clientEmail,
      clientAddress,
      serviceType,
      trackingId: trackingId ? String(trackingId).padStart(4, "0") : "N/A",
      source: source || "Site web",
      preferredDate,
      preferredSlot,
      createdAt,
      adminUrl,
      brand: defaultBrand,
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Nouveau client : ${clientName} - ${serviceType}`,
      html,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[emails/new-client] Error:", error);
    return Response.json(
      { ok: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
