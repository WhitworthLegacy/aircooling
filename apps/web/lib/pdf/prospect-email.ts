export interface ProspectEmailData {
  prospectId: string;
  nom: string;
  telephone?: string;
  email?: string;
  type_client?: string;
  type_demande?: string;
  adresse?: string;
  localite?: string;
  code_postal?: string;
  description_demande?: string;
  createdAt: string;
  adminUrl: string;
}

export function generateProspectNotificationHtml(data: ProspectEmailData): string {
  const fullAddress = [data.adresse, data.localite, data.code_postal].filter(Boolean).join(", ");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau prospect – AirCooling</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#CC0A0A 0%,#1B3B8A 100%);padding:30px;border-radius:16px 16px 0 0;text-align:center;">
      <h1 style="color:white;margin:0;font-size:28px;font-weight:700;">Nouveau Prospect</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0 0;font-size:14px;">Une nouvelle demande de devis vient d'arriver</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:30px;border-radius:0 0 16px 16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">

      <!-- Type badge -->
      <div style="background:#e6f2fb;border:2px solid #1B3B8A;border-radius:12px;padding:15px;margin-bottom:20px;text-align:center;">
        <p style="color:#1B3B8A;font-size:18px;font-weight:600;margin:0;">
          ${data.type_demande || "Demande de devis"}
        </p>
        <p style="color:#64748b;font-size:13px;margin:6px 0 0 0;">
          ${data.type_client || "Particulier"}
        </p>
      </div>

      <!-- Prospect ID -->
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <p style="margin:0;font-size:13px;color:#6b7280;">Prospect</p>
            <p style="margin:4px 0 0 0;font-size:18px;font-weight:700;color:#1a1a1a;">${data.nom}</p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0;font-size:13px;color:#6b7280;">Date</p>
            <p style="margin:4px 0 0 0;font-size:14px;font-weight:600;color:#1a1a1a;">${data.createdAt}</p>
          </div>
        </div>
      </div>

      <!-- Contact Info -->
      <div style="background:#fafafa;border-radius:12px;padding:20px;margin-bottom:20px;">
        <h3 style="margin:0 0 15px 0;font-size:16px;color:#374151;">Informations contact</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${data.telephone ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;width:100px;">Telephone</td>
            <td style="padding:8px 0;color:#1a1a1a;"><a href="tel:${data.telephone}" style="color:#1B3B8A;text-decoration:none;">${data.telephone}</a></td>
          </tr>` : ""}
          ${data.email ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Email</td>
            <td style="padding:8px 0;color:#1a1a1a;"><a href="mailto:${data.email}" style="color:#1B3B8A;text-decoration:none;">${data.email}</a></td>
          </tr>` : ""}
          ${fullAddress ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;vertical-align:top;">Adresse</td>
            <td style="padding:8px 0;color:#1a1a1a;">${fullAddress}</td>
          </tr>` : ""}
        </table>
      </div>

      ${data.description_demande ? `
      <!-- Description -->
      <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 10px 0;font-weight:600;color:#92400e;">Description de la demande</p>
        <p style="margin:0;color:#78350f;font-size:14px;">${data.description_demande}</p>
      </div>` : ""}

      <!-- CTA -->
      <div style="text-align:center;margin:30px 0 0 0;">
        <a href="${data.adminUrl}" style="display:inline-block;background:linear-gradient(135deg,#CC0A0A 0%,#1B3B8A 100%);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;">Voir le prospect</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px;color:#6b7280;font-size:12px;">
      <p style="margin:0;">AirCooling Admin</p>
    </div>
  </div>
</body>
</html>
  `;
}
