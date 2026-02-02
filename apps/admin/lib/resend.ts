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
  quoteId: string;
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

// Base URL for links
export const getBaseUrl = () => process.env.WEB_API_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://aircooling.be';

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

      <!-- Action Buttons -->
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #4a4a4a; margin: 0 0 20px 0; font-size: 16px;">
          <strong>Acceptez-vous ce devis ?</strong>
        </p>
        <div style="display: inline-block;">
          <a href="${getBaseUrl()}/api/quotes/action?id=${data.quoteId}&action=accept&email=${encodeURIComponent(data.clientEmail)}"
             style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 5px;">
            ✓ Accepter le devis
          </a>
          <a href="${getBaseUrl()}/api/quotes/action?id=${data.quoteId}&action=refuse&email=${encodeURIComponent(data.clientEmail)}"
             style="display: inline-block; background: #f3f4f6; color: #6b7280; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 5px; border: 2px solid #e5e7eb;">
            ✗ Refuser
          </a>
        </div>
        <p style="color: #6b7280; margin: 20px 0 0 0; font-size: 13px;">
          Ou contactez-nous au <a href="tel:${brand.phone}" style="color: ${colors.primary};">${brand.phone}</a>
        </p>
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
