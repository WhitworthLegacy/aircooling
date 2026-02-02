/**
 * Email template for quote acceptance confirmation
 * Sent to client when they accept a quote - includes booking link for intervention
 */

export type QuoteAcceptedEmailParams = {
  clientName: string;
  quoteNumber: string;
  bookingUrl: string;
};

export function generateQuoteAcceptedEmail(params: QuoteAcceptedEmailParams): string {
  const { clientName, quoteNumber, bookingUrl } = params;

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
    .success-box {
      background: linear-gradient(135deg, #d1fae5 0%, #eef6ff 100%);
      border-left: 4px solid #059669;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .success-box p {
      margin: 0;
      color: #065f46;
    }
    .quote-ref {
      background: #f8fafc;
      padding: 15px 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
    .quote-ref span {
      font-size: 13px;
      color: #6b7280;
      display: block;
      margin-bottom: 5px;
    }
    .quote-ref strong {
      font-size: 18px;
      color: #1B3B8A;
      font-weight: 700;
    }
    .cta-section {
      text-align: center;
      margin: 30px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #059669 0%, #1B3B8A 100%);
      color: white;
      padding: 18px 40px;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 10px 25px rgba(5, 150, 105, 0.3);
    }
    .next-steps {
      background: #f8fafc;
      padding: 25px;
      border-radius: 12px;
      margin: 25px 0;
    }
    .next-steps h3 {
      color: #1B3B8A;
      font-size: 16px;
      margin: 0 0 15px;
      font-weight: 700;
    }
    .next-steps ol {
      margin: 0;
      padding-left: 20px;
      color: #4a5568;
      line-height: 1.8;
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
      <h1>Merci pour votre confiance ! 🎉</h1>

      <p>Bonjour ${clientName},</p>

      <div class="success-box">
        <p><strong>✅ Votre acceptation du devis a bien été enregistrée !</strong></p>
      </div>

      <div class="quote-ref">
        <span>Référence du devis</span>
        <strong>${quoteNumber}</strong>
      </div>

      <p>Nous sommes ravis de vous compter parmi nos clients. La prochaine étape est de <strong>planifier votre intervention</strong> à un moment qui vous convient.</p>

      <div class="cta-section">
        <a href="${bookingUrl}" class="cta-button">
          📅 Planifier mon intervention
        </a>
      </div>

      <div class="next-steps">
        <h3>Prochaines étapes :</h3>
        <ol>
          <li>Cliquez sur le bouton ci-dessus pour choisir une date</li>
          <li>Sélectionnez un créneau qui vous convient</li>
          <li>Notre technicien vous contactera pour confirmer</li>
          <li>Intervention réalisée par nos experts !</li>
        </ol>
      </div>

      <p>Des questions ? Notre équipe reste à votre disposition :</p>
      <p style="text-align: center;">
        <a href="tel:+3248717610" style="color: #1B3B8A; font-weight: 700; text-decoration: none; font-size: 18px;">
          📞 0487 17 06 10
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
