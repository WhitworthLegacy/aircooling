import { Resend } from 'resend';

// Lazy-initialize Resend client to avoid build-time errors when env var is missing
let _resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!_resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('[Resend] RESEND_API_KEY is not configured');
    }
    _resendClient = new Resend(apiKey);
  }
  return _resendClient;
}

// Proxy object that lazily initializes the client on first use
export const resend = {
  emails: {
    send: async (params: Parameters<Resend['emails']['send']>[0]) => {
      return getResendClient().emails.send(params);
    },
  },
};

// Default sender email (must be verified in Resend)
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';

// Brand configuration
export interface BrandConfig {
  name: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  darkColor: string;
  phone: string;
  address: string;
  website?: string;
  logoUrl?: string;
}

export const defaultBrand: BrandConfig = {
  name: 'Aircooling',
  tagline: 'Climatisation & Chauffage',
  primaryColor: '#1B3B8A',
  accentColor: '#CC0A0A',
  darkColor: '#293133',
  phone: '02 725 33 85',
  address: 'Rue de Belgrade 75, 1190 Forest',
  website: 'https://aircooling.be',
};

// Types for email templates
export type QuoteEmailData = {
  clientName: string;
  clientEmail: string;
  quoteNumber: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totalAmount: number;
  validUntil: string;
  trackingUrl?: string;
  brand?: BrandConfig;
};

export type NewClientNotificationData = {
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  serviceType: string;
  trackingId: string;
  source?: string;
  preferredDate?: string;
  preferredSlot?: string;
  createdAt: string;
  adminUrl: string;
  brand?: BrandConfig;
};

export type BookingConfirmationEmailData = {
  clientName: string;
  clientEmail: string;
  appointmentDate: string;
  appointmentSlot: string;
  serviceType: string;
  address?: string;
  trackingId?: string;
  brand?: BrandConfig;
};

// Helper to get brand colors object
function getBrandColors(brand: BrandConfig) {
  return {
    primary: brand.primaryColor,
    accent: brand.accentColor,
    dark: brand.darkColor,
  };
}

// Generate email header HTML
function generateHeader(brand: BrandConfig, subtitle?: string): string {
  const colors = getBrandColors(brand);
  return `
    <div style="background: linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">${brand.name}</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${subtitle || brand.tagline}</p>
    </div>
  `;
}

// Generate email footer HTML
function generateFooter(brand: BrandConfig): string {
  return `
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 0;">${brand.name}</p>
      ${brand.address ? `<p style="margin: 5px 0 0 0;">${brand.address}</p>` : ''}
    </div>
  `;
}

// Generate CTA button HTML
function generateCTAButton(href: string, text: string, brand: BrandConfig): string {
  const colors = getBrandColors(brand);
  return `
    <a href="${href}" style="display: inline-block; background: linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">${text}</a>
  `;
}

// Generate HTML for new client admin notification
export function generateNewClientNotificationHtml(data: NewClientNotificationData): string {
  const brand = data.brand || defaultBrand;
  const colors = getBrandColors(brand);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau client - ${brand.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Nouveau Client!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Un nouveau dossier vient d'etre cree</p>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

      <!-- Service Type Badge -->
      <div style="background: #dbeafe; border: 2px solid ${colors.primary}; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
        <p style="color: ${colors.primary}; font-size: 18px; font-weight: 600; margin: 0;">
          ${data.serviceType}
        </p>
      </div>

      <!-- Tracking ID -->
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="margin: 0; font-size: 13px; color: #6b7280;">Dossier N</p>
            <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">${data.trackingId}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 13px; color: #6b7280;">Cree le</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #1a1a1a;">${data.createdAt}</p>
          </div>
        </div>
      </div>

      <!-- Client Info -->
      <div style="background: #fafafa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #374151;">Informations client</h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 100px;">Nom</td>
            <td style="padding: 8px 0; color: #1a1a1a; font-weight: 600;">${data.clientName}</td>
          </tr>
          ${data.clientPhone ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Telephone</td>
            <td style="padding: 8px 0; color: #1a1a1a;"><a href="tel:${data.clientPhone}" style="color: ${colors.primary}; text-decoration: none;">${data.clientPhone}</a></td>
          </tr>
          ` : ''}
          ${data.clientEmail ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Email</td>
            <td style="padding: 8px 0; color: #1a1a1a;"><a href="mailto:${data.clientEmail}" style="color: ${colors.primary}; text-decoration: none;">${data.clientEmail}</a></td>
          </tr>
          ` : ''}
          ${data.clientAddress ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Adresse</td>
            <td style="padding: 8px 0; color: #1a1a1a;">${data.clientAddress}</td>
          </tr>
          ` : ''}
          ${data.source ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Source</td>
            <td style="padding: 8px 0; color: #1a1a1a;">${data.source}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      ${data.preferredDate ? `
      <!-- Appointment Preference -->
      <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #92400e;">RDV souhaite</h3>
        <p style="margin: 0; color: #78350f; font-size: 16px; font-weight: 600;">
          ${data.preferredDate}${data.preferredSlot ? ` a ${data.preferredSlot}` : ''}
        </p>
      </div>
      ` : ''}

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0 0 0;">
        ${generateCTAButton(data.adminUrl, 'Voir le dossier', brand)}
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 0;">${brand.name} Admin</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Generate HTML for quote email
export function generateQuoteEmailHtml(data: QuoteEmailData): string {
  const brand = data.brand || defaultBrand;
  const colors = getBrandColors(brand);

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice.toFixed(2)}EUR</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${item.total.toFixed(2)}EUR</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devis ${brand.name} - ${data.quoteNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    ${generateHeader(brand)}

    <!-- Content -->
    <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 22px;">Bonjour ${data.clientName},</h2>

      <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
        Voici votre devis pour les travaux prevus. Ce devis est valable jusqu'au <strong>${data.validUntil}</strong>.
      </p>

      <!-- Quote Box -->
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <span style="color: #6b7280; font-size: 14px;">Devis N</span>
          <span style="color: #1a1a1a; font-weight: 700; font-size: 18px;">${data.quoteNumber}</span>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <thead>
            <tr style="background: #e2e8f0;">
              <th style="padding: 12px; text-align: left; font-size: 13px; color: #475569;">Description</th>
              <th style="padding: 12px; text-align: center; font-size: 13px; color: #475569;">Qte</th>
              <th style="padding: 12px; text-align: right; font-size: 13px; color: #475569;">P.U.</th>
              <th style="padding: 12px; text-align: right; font-size: 13px; color: #475569;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Total -->
        <div style="border-top: 2px solid #e2e8f0; padding-top: 15px; margin-top: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #1a1a1a; font-size: 18px; font-weight: 600;">Total TTC</span>
            <span style="color: ${colors.accent}; font-size: 24px; font-weight: 700;">${data.totalAmount.toFixed(2)}EUR</span>
          </div>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #4a4a4a; margin: 0 0 15px 0;">Pour accepter ce devis, repondez simplement a cet email ou contactez-nous :</p>
        ${generateCTAButton(`tel:${brand.phone}`, 'Nous appeler', brand)}
      </div>

      ${data.trackingUrl ? `
      <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
        Suivez l'avancement : <a href="${data.trackingUrl}" style="color: ${colors.primary};">${data.trackingUrl}</a>
      </p>
      ` : ''}
    </div>

    ${generateFooter(brand)}
  </div>
</body>
</html>
  `;
}

// Base URL for links
export const getBaseUrl = () => process.env.WEB_API_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://aircooling.be';

// Generate HTML for booking confirmation email
export function generateBookingConfirmationEmailHtml(data: BookingConfirmationEmailData): string {
  const brand = data.brand || defaultBrand;
  const colors = getBrandColors(brand);

  const formattedDate = new Date(data.appointmentDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de rendez-vous - ${brand.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    ${generateHeader(brand)}

    <!-- Content -->
    <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="color: ${colors.dark}; margin: 0 0 20px 0; font-size: 22px; text-align: center;">
        Bonjour ${data.clientName},
      </h2>

      <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0; text-align: center; font-size: 18px;">
        <strong>Votre rendez-vous est confirme !</strong>
      </p>

      <!-- Appointment Details Box -->
      <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%); border: 2px solid ${colors.primary}; border-radius: 12px; padding: 25px; margin: 20px 0;">
        <div style="text-align: center; margin-bottom: 15px;">
          <span style="display: inline-block; background: ${colors.primary}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
            ${data.serviceType}
          </span>
        </div>

        <div style="text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Date</p>
          <p style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: ${colors.dark};">
            ${formattedDate}
          </p>

          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Creneau horaire</p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${colors.primary};">
            ${data.appointmentSlot}
          </p>
        </div>

        ${data.address ? `
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Adresse</p>
          <p style="margin: 0; font-size: 16px; color: ${colors.dark};">${data.address}</p>
        </div>
        ` : ''}

        ${data.trackingId ? `
        <div style="margin-top: 15px; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: #6b7280;">
            Dossier N <strong style="color: ${colors.primary};">${data.trackingId}</strong>
          </p>
        </div>
        ` : ''}
      </div>

      <!-- What to expect -->
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="color: ${colors.dark}; margin: 0 0 15px 0; font-size: 16px;">Prochaines etapes :</h3>
        <ol style="color: #4a4a4a; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Notre technicien vous contactera pour confirmer l'heure exacte</li>
          <li>Intervention a l'adresse indiquee</li>
          <li>Vous recevrez un devis si des travaux supplementaires sont necessaires</li>
        </ol>
      </div>

      <!-- Contact -->
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #6b7280; margin: 0 0 15px 0; font-size: 14px;">
          Besoin de modifier ou annuler votre rendez-vous ?
        </p>
        ${generateCTAButton(`tel:${brand.phone}`, 'Nous contacter', brand)}
      </div>

      <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
        Merci de votre confiance !
      </p>
    </div>

    ${generateFooter(brand)}
  </div>
</body>
</html>
  `;
}
