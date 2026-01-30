import { NextRequest } from "next/server";
import { resend, FROM_EMAIL, generateBookingConfirmationEmailHtml, defaultBrand } from "@/lib/resend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientName,
      clientEmail,
      appointmentDate,
      appointmentSlot,
      serviceType,
      address,
      trackingId,
    } = body;

    // Email is optional - if not provided, skip sending
    if (!clientEmail) {
      return Response.json({ ok: true, skipped: true, reason: "No client email" });
    }

    if (!clientName || !appointmentDate || !appointmentSlot || !serviceType) {
      return Response.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const html = generateBookingConfirmationEmailHtml({
      clientName,
      clientEmail,
      appointmentDate,
      appointmentSlot,
      serviceType,
      address,
      trackingId,
      brand: defaultBrand,
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      subject: `Confirmation de RDV - ${serviceType}`,
      html,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[emails/booking-confirmation] Error:", error);
    return Response.json(
      { ok: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
