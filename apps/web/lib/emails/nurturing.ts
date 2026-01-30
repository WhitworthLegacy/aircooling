/**
 * Email Nurturing System for Prospects
 * Automatic follow-up emails to convert leads into clients
 */

import { resend, FROM_EMAIL } from "@/lib/resend";

export type NurturingEmail = {
  to: string;
  prospectName: string;
  prospectId: string;
  demandType?: string;
  delay?: number; // Delay in hours before sending
};

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL 1: Immediate confirmation (T+0)
// ═══════════════════════════════════════════════════════════════════════════
export function generateWelcomeEmailHtml(params: {
  prospectName: string;
  demandType?: string;
}) {
  const { prospectName, demandType } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f7;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
    }
    .header {
      background: linear-gradient(135deg, #1B3B8A 0%, #CC0A0A 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      color: white;
      font-size: 32px;
      font-weight: 900;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .tagline {
      color: rgba(255,255,255,0.9);
      font-size: 14px;
      margin-top: 8px;
    }
    .content {
      padding: 40px 30px;
      color: #1a1a2e;
    }
    h1 {
      color: #1B3B8A;
      font-size: 24px;
      margin: 0 0 20px;
      font-weight: 800;
    }
    p {
      line-height: 1.6;
      color: #4a5568;
      margin: 0 0 16px;
    }
    .highlight-box {
      background: linear-gradient(135deg, #eef6ff 0%, #fef0f0 100%);
      border-left: 4px solid #1B3B8A;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #1B3B8A 0%, #CC0A0A 100%);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 700;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 10px 25px rgba(27, 59, 138, 0.3);
    }
    .features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 30px 0;
    }
    .feature {
      background: #f8fafc;
      padding: 15px;
      border-radius: 12px;
      text-align: center;
    }
    .feature-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }
    .feature-text {
      font-size: 13px;
      color: #1B3B8A;
      font-weight: 600;
    }
    .footer {
      background: #1a1a2e;
      color: #9ca3af;
      padding: 30px;
      text-align: center;
      font-size: 13px;
    }
    .footer a {
      color: #60a5fa;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">AirCooling</h1>
      <p class="tagline">Votre expert HVAC en Belgique</p>
    </div>

    <div class="content">
      <h1>Bonjour ${prospectName} 👋</h1>

      <p>Merci d'avoir contacté <strong>AirCooling</strong> pour votre projet ${demandType ? `de <strong>${demandType.toLowerCase()}</strong>` : ""}.</p>

      <div class="highlight-box">
        <p style="margin: 0; font-weight: 600; color: #1B3B8A;">✅ Votre demande a bien été reçue !</p>
        <p style="margin: 8px 0 0; font-size: 14px;">Notre équipe va l'analyser et vous recontacter dans les <strong>24 heures</strong>.</p>
      </div>

      <p>En attendant, découvrez pourquoi nos clients nous font confiance :</p>

      <div class="features">
        <div class="feature">
          <div class="feature-icon">⚡</div>
          <div class="feature-text">Installation rapide</div>
        </div>
        <div class="feature">
          <div class="feature-icon">🛡️</div>
          <div class="feature-text">Garantie 5 ans</div>
        </div>
        <div class="feature">
          <div class="feature-icon">💰</div>
          <div class="feature-text">Devis gratuit</div>
        </div>
        <div class="feature">
          <div class="feature-icon">⭐</div>
          <div class="feature-text">4.9/5 étoiles</div>
        </div>
      </div>

      <p>Des questions urgentes ? Contactez-nous directement :</p>
      <p style="text-align: center;">
        <a href="tel:+3248717610" style="color: #1B3B8A; font-weight: 700; text-decoration: none; font-size: 18px;">
          📞 0487 17 06 10
        </a>
      </p>

      <p style="text-align: center;">
        <a href="https://wa.me/3248717610" class="cta-button">
          💬 Discuter sur WhatsApp
        </a>
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 10px;"><strong>AirCooling HVAC</strong></p>
      <p style="margin: 0;">Rue de Belgrade 75, 1190 Forest, Belgique</p>
      <p style="margin: 10px 0 0;">
        <a href="mailto:info@aircooling.be">info@aircooling.be</a> •
        <a href="tel:+3227253385">02 725 33 85</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL 2: Follow-up reminder (T+24h)
// ═══════════════════════════════════════════════════════════════════════════
export function generateFollowUpEmailHtml(params: {
  prospectName: string;
  demandType?: string;
}) {
  const { prospectName, demandType } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f7; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #1B3B8A 0%, #CC0A0A 100%); padding: 40px 20px; text-align: center; }
    .logo { color: white; font-size: 32px; font-weight: 900; margin: 0; }
    .content { padding: 40px 30px; color: #1a1a2e; }
    h1 { color: #1B3B8A; font-size: 24px; margin: 0 0 20px; font-weight: 800; }
    p { line-height: 1.6; color: #4a5568; margin: 0 0 16px; }
    .urgency-box { background: #fef0f0; border-left: 4px solid #CC0A0A; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #CC0A0A 0%, #1B3B8A 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; margin: 20px 0; box-shadow: 0 10px 25px rgba(204, 10, 10, 0.3); }
    .footer { background: #1a1a2e; color: #9ca3af; padding: 30px; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">AirCooling</h1>
    </div>

    <div class="content">
      <h1>Bonjour ${prospectName},</h1>

      <p>Nous avons bien reçu votre demande ${demandType ? `concernant votre projet de <strong>${demandType.toLowerCase()}</strong>` : ""} hier.</p>

      <div class="urgency-box">
        <p style="margin: 0; font-weight: 600; color: #CC0A0A;">⏰ Votre projet nous intéresse !</p>
        <p style="margin: 8px 0 0; font-size: 14px;">Nous finalisons votre devis personnalisé. Il sera prêt sous <strong>48h maximum</strong>.</p>
      </div>

      <p><strong>En attendant, avez-vous pensé à :</strong></p>
      <ul style="color: #4a5568; line-height: 1.8;">
        <li>Prendre des photos de votre installation actuelle ?</li>
        <li>Mesurer les dimensions de la pièce ?</li>
        <li>Noter vos préférences de marque (Daikin, Mitsubishi, etc.) ?</li>
      </ul>

      <p>Ces informations nous aideront à affiner votre devis !</p>

      <p style="text-align: center;">
        <a href="https://wa.me/3248717610?text=Bonjour%2C%20j'ai%20reçu%20votre%20email%20de%20suivi" class="cta-button">
          📸 Envoyer mes photos par WhatsApp
        </a>
      </p>

      <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
        Besoin de nous parler ? Appelez-nous au <strong>0487 17 06 10</strong>
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0;"><strong>AirCooling HVAC</strong></p>
      <p style="margin: 10px 0 0;">Rue de Belgrade 75, 1190 Forest • info@aircooling.be</p>
    </div>
  </div>
</body>
</html>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL 3: Urgency email (T+72h)
// ═══════════════════════════════════════════════════════════════════════════
export function generateUrgencyEmailHtml(params: {
  prospectName: string;
}) {
  const { prospectName } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f7; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #CC0A0A 0%, #1B3B8A 100%); padding: 40px 20px; text-align: center; }
    .logo { color: white; font-size: 32px; font-weight: 900; margin: 0; }
    .content { padding: 40px 30px; color: #1a1a2e; }
    h1 { color: #CC0A0A; font-size: 26px; margin: 0 0 20px; font-weight: 900; }
    p { line-height: 1.6; color: #4a5568; margin: 0 0 16px; }
    .offer-box { background: linear-gradient(135deg, #fef0f0 0%, #eef6ff 100%); border: 3px solid #CC0A0A; padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center; }
    .big-text { font-size: 42px; font-weight: 900; color: #CC0A0A; margin: 10px 0; }
    .cta-button { display: inline-block; background: #CC0A0A; color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: 900; font-size: 18px; margin: 20px 0; box-shadow: 0 15px 35px rgba(204, 10, 10, 0.4); }
    .footer { background: #1a1a2e; color: #9ca3af; padding: 30px; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">AirCooling</h1>
    </div>

    <div class="content">
      <h1>🔥 Dernière chance ${prospectName} !</h1>

      <p>Nous n'avons pas encore eu de vos nouvelles concernant votre projet de climatisation.</p>

      <div class="offer-box">
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1B3B8A;">🎁 OFFRE SPÉCIALE LIMITÉE</p>
        <div class="big-text">-15%</div>
        <p style="margin: 0; font-weight: 600; color: #CC0A0A;">sur votre installation</p>
        <p style="margin: 15px 0 0; font-size: 14px; color: #6b7280;">Valable uniquement pour les 5 premiers clients de février</p>
      </div>

      <p><strong>Cette offre expire dans 48 heures.</strong></p>

      <p>Ne manquez pas cette opportunité de bénéficier :</p>
      <ul style="color: #4a5568; line-height: 1.8; font-weight: 600;">
        <li>✅ Installation professionnelle garantie 5 ans</li>
        <li>✅ Matériel premium (Daikin, Mitsubishi)</li>
        <li>✅ SAV réactif 7j/7</li>
        <li>✅ Paiement en 3x sans frais</li>
      </ul>

      <p style="text-align: center;">
        <a href="tel:+3248717610" class="cta-button">
          📞 J'en profite maintenant !
        </a>
      </p>

      <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 30px;">
        Places limitées • Offre valable jusqu'au ${new Date(Date.now() + 48 * 3600 * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0;"><strong>AirCooling HVAC</strong></p>
      <p style="margin: 10px 0 0;">0487 17 06 10 • info@aircooling.be</p>
    </div>
  </div>
</body>
</html>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// Send nurturing sequence
// ═══════════════════════════════════════════════════════════════════════════
export async function sendWelcomeEmail(params: NurturingEmail) {
  const { to, prospectName, demandType } = params;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `✅ Votre demande a été reçue - AirCooling`,
      html: generateWelcomeEmailHtml({ prospectName, demandType }),
    });
    console.log(`[nurturing] Welcome email sent to ${to}`);
  } catch (error) {
    console.error(`[nurturing] Failed to send welcome email to ${to}:`, error);
  }
}

export async function sendFollowUpEmail(params: NurturingEmail) {
  const { to, prospectName, demandType } = params;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `⏰ Votre devis est bientôt prêt - AirCooling`,
      html: generateFollowUpEmailHtml({ prospectName, demandType }),
    });
    console.log(`[nurturing] Follow-up email sent to ${to}`);
  } catch (error) {
    console.error(`[nurturing] Failed to send follow-up email to ${to}:`, error);
  }
}

export async function sendUrgencyEmail(params: NurturingEmail) {
  const { to, prospectName } = params;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `🔥 Dernière chance : -15% sur votre installation !`,
      html: generateUrgencyEmailHtml({ prospectName }),
    });
    console.log(`[nurturing] Urgency email sent to ${to}`);
  } catch (error) {
    console.error(`[nurturing] Failed to send urgency email to ${to}:`, error);
  }
}
