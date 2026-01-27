/***** CONFIG *****/
const SHEET_ID        = '11Csqf4Z4qeajajlanv1wgSyFUKhh_--m_dZeUvWdwDU';
const BON_SHEET_NAME  = 'BON';
const PROSPECTS_SHEET_NAME = 'PROSPECTS';
const NOTIF_EMAIL     = 'aircoolinghvac@gmail.com';

const SHEET_URL       = 'https://docs.google.com/spreadsheets/d/11Csqf4Z4qeajajlanv1wgSyFUKhh_--m_dZeUvWdwDU/edit';

// ✅ dossiers Drive (IDs)
const SIGNATURES_FOLDER_ID = '1WGMiuqcTNxWtsxJhrryAVmDIK5X2_wZn';
const PDF_FOLDER_ID        = '1cYRuHM-jufz9QAxzXKG4SrSG0wv0Y6Sh';
const PROSPECT_PLANS_FOLDER_ID = '1kkur49Q0XZHIG3CmWGcM0Qql1jvLfxo7';
const PROSPECT_PDF_FOLDER_ID = '1k5n2P01mUgnStrQ5xwIPttAXh981i5ny';


/************* WEB APP *************/
function doGet(e) {
  const page = (e && e.parameter && e.parameter.page)
    ? String(e.parameter.page)
    : 'bon';

  const scriptUrl = ScriptApp.getService().getUrl();

  if (page === 'prospect') {
    const tpl = HtmlService.createTemplateFromFile('Prospect');
    tpl.scriptUrl = scriptUrl;
    return tpl.evaluate()
      .setTitle("Fiche prospect – AirCooling")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (page === 'prospect-plan') {
    const tpl = HtmlService.createTemplateFromFile('ProspectPlan');
    tpl.scriptUrl = scriptUrl;
    tpl.prospectId = e.parameter.prospectId || '';
    return tpl.evaluate()
      .setTitle("Croquis du plan – AirCooling")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // défaut = BON
  const tpl = HtmlService.createTemplateFromFile('Bon');
  tpl.scriptUrl = scriptUrl;
  return tpl.evaluate()
    .setTitle("Bon d'intervention – AirCooling")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const form = (e && e.parameter) ? e.parameter : {};
    const formType = (form.formType || '').toString().toUpperCase().trim();

    if (!formType) return htmlOut_(errorHtml_("Champ formType manquant (BON / PROSPECT)."));

    if (formType === 'BON') return handleBonPost_(form);
    if (formType === 'PROSPECT') return handleProspectPost_(form);
    if (formType === 'PROSPECT_PLAN') return handleProspectPlanPost_(form);

    return htmlOut_(errorHtml_(`formType invalide: ${formType}`));
  } catch (err) {
    return htmlOut_(errorHtml_(String(err && err.message ? err.message : err)));
  }
}


/***************** BON *****************/
function handleBonPost_(form) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(BON_SHEET_NAME);
  if (!sheet) throw new Error(`Onglet introuvable: ${BON_SHEET_NAME}`);

  const now  = new Date();
  const bonId = 'BON-' + now.getTime();

  // 1) Signatures -> Drive (PNG)
  const sigTechFile   = saveSignaturePng_(form.Signature_Tech,   `${bonId}_SIGN_TECH.png`);
  const sigClientFile = saveSignaturePng_(form.Signature_Client, `${bonId}_SIGN_CLIENT.png`);

  // 2) PDF -> Drive
  const pdfFile = createBonPdf_(bonId, now, form, sigTechFile, sigClientFile);

  // 3) Append row (ordre = headers BON)
  const row = [
    form.Bon_N || '',
    form.Client_Nom || '',
    form.Client_Adresse || '',
    form.Client_Localite || '',
    form.Client_TVA || '',
    form.Resp_Nom || '',
    form.Resp_Adresse || '',
    form.Resp_Localite || '',
    form.Resp_TVA || '',
    form.Telephone || '',
    form.Email || '',
    form.Technicien_Nom || '',
    form.Date_Intervention || '',
    form.Heure_Debut || '',
    form.Heure_Fin || '',
    form.Type_Intervention || '',
    form.Travaux_Realises || '',
    form.Fournitures || '',
    form.Total_HT || '',
    form.TVA_EUR || '',
    form.Total_TTC || '',
    form.Acompte || '',
    form.Mode_Paiement || '',
    bonId,
    now,
    sigClientFile ? sigClientFile.getUrl() : '',
    sigTechFile ? sigTechFile.getUrl() : '',
    pdfFile ? pdfFile.getUrl() : '',
    'En attente',
    ''
  ];
  sheet.appendRow(row);

  // 4) Email + PJ
  sendNotificationEmailBon_(bonId, form, pdfFile);
  sendBonPdfToClient_(bonId, form, pdfFile);

  // 5) Merci
  return htmlOut_(thankYouHtml_({
    title: "✅ Votre bon a été envoyé",
    message: "Le bon d’intervention a bien été enregistré dans le système AirCooling.",
    backLabel: "Nouveau bon",
    backUrl: ScriptApp.getService().getUrl()
  }));
}

function sendNotificationEmailBon_(bonId, form, pdfFile) {
  const sheetUrl = SHEET_URL || `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
  const subject = `Nouveau bon d’intervention – ${form.Client_Nom || ''} – ${bonId}`;

  const body =
`Un nouveau bon d’intervention a été encodé.

Bon n°: ${form.Bon_N || ''}
ID: ${bonId}

Client: ${form.Client_Nom || ''}
Adresse: ${form.Client_Adresse || ''}, ${form.Client_Localite || ''}
Téléphone: ${form.Telephone || ''}
Email: ${form.Email || ''}

Technicien: ${form.Technicien_Nom || ''}
Date: ${form.Date_Intervention || ''} ${form.Heure_Debut || ''}-${form.Heure_Fin || ''}
Type: ${form.Type_Intervention || ''}

Montants:
- Total HT: ${form.Total_HT || ''} €
- TVA: ${form.TVA_EUR || ''} €
- Total TTC: ${form.Total_TTC || ''} €
- Acompte: ${form.Acompte || ''} €
- Paiement: ${form.Mode_Paiement || ''}

Lien Google Sheets:
${sheetUrl}
`;

  const attachments = [];
  if (pdfFile) attachments.push(pdfFile.getBlob());

  MailApp.sendEmail({ to: NOTIF_EMAIL, subject, body, attachments });
}


/***************** PROSPECT *****************/
function handleProspectPost_(form) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(PROSPECTS_SHEET_NAME);
  if (!sh) throw new Error(`Onglet introuvable: ${PROSPECTS_SHEET_NAME}`);

  const now = new Date();
  const prospectId = 'PROS-' + now.getTime();

  // ✅ On enregistre d'abord TOUTES les infos du prospect (sans plan),
  // puis on force la redirection vers la page "dessiner le plan"
  const row = [
    prospectId,
    form.Date_Prospect || '',
    form.Nom || '',
    form.Telephone || '',
    form.Email || '',
    form.Adresse || '',
    form.Localite || '',
    form.Code_Postal || '',
    form.Type_Demande || '',
    form.Type_Client || '',
    form.Description_Demande || '',
    form.Marque_Souhaitee || '',
    form.Nombre_Unites || '',
    form.Photos_URL || '',
    form.Video_URL || '',
    form.Visite_Technique_Date || '',
    form.Visite_Technique_Heure || '',
    form.Devis_Montant_Estimatif || '',
    form.Devis_Montant_Final || '',
    form.Signature_Acceptation_URL || '',
    form.Statut || 'Nouveau',
    form.Source || '',
    form.Technicien_Assigne || '',
    form.Notes_Interne || '',
    form.Bon_Lie_ID || '',
    '',          // 👈 planUrl vide pour l'instant
    now,
    now
  ];

  sh.appendRow(row);

  // Optionnel: email à ce stade (perso je conseille de le faire APRÈS le plan)
  // sendNotificationEmailProspect_(prospectId, form);

  // ✅ Redirection obligatoire vers la page plan
  return htmlOut_(redirectHtml_(
    ScriptApp.getService().getUrl() + '?page=prospect-plan&prospectId=' + encodeURIComponent(prospectId)
  ));
}

function handleProspectPlanPost_(form) {
  const prospectId = (form.prospectId || '').toString().trim();
  if (!prospectId) throw new Error("prospectId manquant.");

  const planDataUrl = form.Plan_Croquis || '';
  if (!planDataUrl) throw new Error("Plan_Croquis manquant (dessin obligatoire).");

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(PROSPECTS_SHEET_NAME);
  if (!sh) throw new Error(`Onglet introuvable: ${PROSPECTS_SHEET_NAME}`);

  // 1) Sauver le plan dans Drive
  const planFileId = saveProspectPlan_(planDataUrl, prospectId);
  const planUrl = planFileId ? DriveApp.getFileById(planFileId).getUrl() : '';

  // 2) Retrouver la ligne du prospect et mettre à jour la colonne planUrl + updatedAt
  const lastRow = sh.getLastRow();
  if (lastRow < 2) throw new Error("Aucune donnée prospect trouvée.");

  const ids = sh.getRange(2, 1, lastRow - 1, 1).getValues().flat(); // Col A = prospectId
  const idx = ids.indexOf(prospectId);
  if (idx === -1) throw new Error("Prospect introuvable pour ce prospectId.");

  const rowNumber = idx + 2; // +2 car on a commencé à la ligne 2

  // 🔎 Récupération dynamique des colonnes via les headers
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];

  const planColIndex = headers.indexOf('Plan_Croquis_URL') + 1;
  const updatedColIndex = headers.indexOf('Timestamp_MAJ') + 1;

  if (planColIndex === 0) {
    throw new Error("Colonne 'Plan_Croquis_URL' introuvable dans PROSPECTS");
  }
  if (updatedColIndex === 0) {
    throw new Error("Colonne 'Timestamp_MAJ' introuvable dans PROSPECTS");
  }

  // ✍️ Mise à jour
  sh.getRange(rowNumber, planColIndex).setValue(planUrl);
  sh.getRange(rowNumber, updatedColIndex).setValue(new Date());


  // ✅ Générer PDF prospect (avec plan)
  const now = new Date();
// ✅ Générer PDF prospect (avec plan) - IMPORTANT: on passe le dataURL (Plan_Croquis)
// ✅ on récupère les infos prospect depuis la sheet (car form ici contient juste le plan)
  const prospectObj = getProspectRowAsObject_(sh, prospectId);
  if (!prospectObj) throw new Error("Impossible de récupérer les données du prospect depuis la sheet.");

  const pdfFile = createProspectPdfHtml_(prospectId, prospectObj, planDataUrl);

  // ✅ Sauver l’URL du PDF dans la colonne Prospect_PDF_URL
  const pdfColIndex = headers.indexOf('Prospect_PDF_URL') + 1;
  if (pdfColIndex === 0) throw new Error("Colonne 'Prospect_PDF_URL' introuvable.");
  sh.getRange(rowNumber, pdfColIndex).setValue(pdfFile.getUrl());

  // ✅ ENVOI EMAIL PDF (interne + client si email)
  sendProspectPdfEmail_(prospectId, prospectObj, pdfFile);

  // 3) (Optionnel mais recommandé) envoyer l'email maintenant que le dossier est complet
  // Pour avoir le plan dans le mail, tu peux l'ajouter au body avec planUrl
  // sendNotificationEmailProspect_(prospectId, { ...form, planUrl });

  return HtmlService.createHtmlOutput(thankYouHtml_({
    title: "✅ Prospect terminé",
    message: "Le prospect et son plan ont été enregistrés avec succès.",
    backLabel: "➕ Nouveau prospect",
    backUrl: ScriptApp.getService().getUrl() + '?page=prospect'
  }));
}

function sendNotificationEmailProspect_(prospectId, form) {
  const sheetUrl = SHEET_URL || `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
  const subject = `Nouveau prospect – ${form.Nom || ''} – ${prospectId}`;

  const body =
`Un nouveau prospect a été encodé.

Prospect_ID: ${prospectId}
Date: ${form.Date_Prospect || ''}

Nom: ${form.Nom || ''}
Téléphone: ${form.Telephone || ''}
Email: ${form.Email || ''}

Adresse: ${form.Adresse || ''}, ${form.Localite || ''} ${form.Code_Postal || ''}

Type client: ${form.Type_Client || ''}
Type demande: ${form.Type_Demande || ''}

Description:
${form.Description_Demande || ''}

Marque: ${form.Marque_Souhaitee || ''}
Unités: ${form.Nombre_Unites || ''}

Photos: ${form.Photos_URL || ''}
Vidéo: ${form.Video_URL || ''}

Visite technique: ${form.Visite_Technique_Date || ''} ${form.Visite_Technique_Heure || ''}

Lien Google Sheets:
${sheetUrl}
`;

  MailApp.sendEmail({ to: NOTIF_EMAIL, subject, body });
}


/************* PDF GENERATION *************/
function createBonPdf_(bonId, now, form, sigTechFile, sigClientFile) {
  const pdfFolder = DriveApp.getFolderById(PDF_FOLDER_ID);

  // ✅ DataURL robustes depuis les fichiers Drive (fonctionne TOUJOURS dans PDF)
  const sigTechDataUrl   = sigTechFile ? blobToDataUrl_(sigTechFile.getBlob()) : '';
  const sigClientDataUrl = sigClientFile ? blobToDataUrl_(sigClientFile.getBlob()) : '';

  const bon = {
    bonId,
    formattedNow: Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'),

    Bon_N: form.Bon_N || '',
    Client_Nom: form.Client_Nom || '',
    Client_Adresse: form.Client_Adresse || '',
    Client_Localite: form.Client_Localite || '',
    Client_TVA: form.Client_TVA || '',

    Resp_Nom: form.Resp_Nom || '',
    Resp_Adresse: form.Resp_Adresse || '',
    Resp_Localite: form.Resp_Localite || '',
    Resp_TVA: form.Resp_TVA || '',

    Telephone: form.Telephone || '',
    Email: form.Email || '',

    Technicien_Nom: form.Technicien_Nom || '',
    Date_Intervention: form.Date_Intervention || '',
    Heure_Debut: form.Heure_Debut || '',
    Heure_Fin: form.Heure_Fin || '',
    Type_Intervention: form.Type_Intervention || '',

    Travaux_Realises: form.Travaux_Realises || '',
    Fournitures: form.Fournitures || '',

    Total_HT: form.Total_HT || '',
    TVA_EUR: form.TVA_EUR || '',
    Total_TTC: form.Total_TTC || '',
    Acompte: form.Acompte || '',
    Mode_Paiement: form.Mode_Paiement || '',

    // ✅ signatures EMBED
    sigTechDataUrl: normalizeDataUrl_(form.Signature_Tech),
    sigClientDataUrl: normalizeDataUrl_(form.Signature_Client),
  };

  const tpl = HtmlService.createTemplateFromFile('BonPdf');
  tpl.bon = bon;

  const html = tpl.evaluate().getContent();

  const blob = Utilities
    .newBlob(html, 'text/html', `${bonId}.html`)
    .getAs(MimeType.PDF)
    .setName(`${bonId}.pdf`);

  return pdfFolder.createFile(blob);
}


/************* SIGNATURE STORAGE *************/
function saveSignaturePng_(dataUrl, filename) {
  dataUrl = normalizeDataUrl_(dataUrl);
  if (!dataUrl) return null;

  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/i);
  if (!match) return null;

  const bytes = Utilities.base64Decode(match[1]);
  const blob = Utilities.newBlob(bytes, MimeType.PNG, filename);

  const folder = DriveApp.getFolderById(SIGNATURES_FOLDER_ID);
  return folder.createFile(blob);
}


/***************** UI HELPERS *****************/
function thankYouHtml_(opt) {
  const title = opt.title || "✅ Envoyé";
  const message = opt.message || "Votre envoi a bien été pris en compte.";
  const backUrl = opt.backUrl || ScriptApp.getService().getUrl();
  const backLabel = opt.backLabel || "Retour";

  return `<!doctype html>
<html lang="fr">
<head>
<base target="_top">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Confirmation</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f5f5f7;margin:0;padding:24px;}
  .card{max-width:720px;margin:80px auto;background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.08);padding:28px;text-align:center;}
  h1{margin:0 0 8px;font-size:22px;color:#0f172a;}
  p{margin:0 0 18px;color:#475569;line-height:1.5;}
  a.btn{display:inline-block;background:#0077c8;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600;}
</style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml_(title)}</h1>
    <p>${escapeHtml_(message)}</p>
    <a class="btn" href="${backUrl}" target="_top">${escapeHtml_(backLabel)}</a>
  </div>
</body>
</html>`;
}

function errorHtml_(msg) {
  return `<!doctype html><html lang="fr"><head>
  <base target="_top">
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Erreur</title>
  <style>body{font-family:system-ui;padding:24px;background:#fff} .e{max-width:720px;margin:60px auto;border:1px solid #fecaca;background:#fff1f2;padding:18px;border-radius:12px;color:#7f1d1d}</style>
  </head><body><div class="e"><h2>❌ Erreur</h2><div>${escapeHtml_(msg)}</div></div></body></html>`;
}

function escapeHtml_(s) {
  return String(s || '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,"&#039;");
}


/************* AUTH TEST *************/
function testAuth() {
  MailApp.sendEmail(NOTIF_EMAIL, "Test auth", "OK");
}

function testDriveDocsAuth() {
  const folder = DriveApp.getRootFolder();
  const doc = DocumentApp.create('AUTH_TEST_DOC');
  doc.getBody().appendParagraph('ok');
  doc.saveAndClose();

  const file = DriveApp.getFileById(doc.getId());
  // optionnel: cleanup
  file.setTrashed(true);
  Logger.log('OK Drive+Docs');
}

function saveProspectPlan_(dataUrl, prospectId) {
  if (!dataUrl) return '';

  const match = String(dataUrl).match(/^data:image\/png;base64,(.+)$/);
  if (!match) return '';

  const bytes = Utilities.base64Decode(match[1]);
  const blob  = Utilities.newBlob(bytes, MimeType.PNG, `${prospectId}_PLAN.png`);

  const folder = DriveApp.getFolderById(PROSPECT_PLANS_FOLDER_ID);
  const file   = folder.createFile(blob);

  return file.getId(); // ✅ IMPORTANT: on retourne l'ID
}

function redirectHtml_(url) {
  const safeUrl = String(url || '');

  return `<!doctype html>
<html lang="fr">
<head>
  <base target="_top">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="refresh" content="0;url=${safeUrl}">
  <title>Redirection…</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f5f5f7;margin:0;padding:24px;}
    .card{max-width:720px;margin:80px auto;background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.08);padding:28px;text-align:center;}
    h1{margin:0 0 8px;font-size:20px;color:#0f172a;}
    p{margin:0 0 18px;color:#475569;line-height:1.5;}
    a.btn{display:inline-block;background:#0077c8;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;}
  </style>
</head>
<body>
  <div class="card">
    <h1>Redirection…</h1>
    <p>Ou clique si ça ne bouge pas :</p>
    <a class="btn" href="${safeUrl}" target="_top">Continuer →</a>
  </div>

  <script>
    // navigation dans le même contexte (iframe friendly)
    try { window.location.replace(${JSON.stringify(safeUrl)}); }
    catch(e){ window.location.href = ${JSON.stringify(safeUrl)}; }
  </script>
</body>
</html>`;
}

function htmlOut_(html) {
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


function createProspectPdfHtml_(prospectId, form, planDataUrl) {
  const pdfFolder = DriveApp.getFolderById(PROSPECT_PDF_FOLDER_ID);

  const now = new Date();
  const createdAt = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  const updatedAt = createdAt;

  // petit helper pour éviter "undefined" partout
  const p = Object.assign({}, form);
  p.Description_Demande_html = (p.Description_Demande || '').toString().replace(/\n/g, '<br>');
  p.Notes_Interne_html       = (p.Notes_Interne || '').toString().replace(/\n/g, '<br>');

  const tpl = HtmlService.createTemplateFromFile('ProspectPdf');
  tpl.prospectId  = prospectId;
  tpl.createdAt   = createdAt;
  tpl.updatedAt   = updatedAt;
  tpl.p           = p;

  // ✅ on embed le dessin DIRECTEMENT en base64 (sinon Drive URL = image cassée)
  tpl.planDataUrl = planDataUrl || '';

  const html = tpl.evaluate().getContent();

  const blob = Utilities.newBlob(html, 'text/html', `${prospectId}.html`)
    .getAs(MimeType.PDF)
    .setName(`${prospectId}.pdf`);

  return pdfFolder.createFile(blob);
}

function dataUrlToImageBlob_(dataUrl, filename) {
  if (!dataUrl) return null;

  const m = String(dataUrl).match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
  if (!m) return null;

  const bytes = Utilities.base64Decode(m[2]);
  const mime = (m[1].toLowerCase() === 'png') ? MimeType.PNG : MimeType.JPEG;
  return Utilities.newBlob(bytes, mime, filename || 'image');
}

function nl2br_(s) {
  return String(s || '').replace(/\n/g, '<br>');
}

function blobToDataUrl_(blob) {
  const bytes = blob.getBytes();
  const b64 = Utilities.base64Encode(bytes);
  const ct = blob.getContentType() || 'image/png';
  return `data:${ct};base64,${b64}`;
}

function normalizeDataUrl_(s) {
  s = String(s || '');
  if (!s) return '';

  // si c'est un dataURL base64, on répare les espaces => +
  // (les espaces viennent souvent du x-www-form-urlencoded)
  return s.replace(/^data:image\/png;base64,([\s\S]+)$/i, (m, b64) => {
    return 'data:image/png;base64,' + b64.replace(/ /g, '+').trim();
  });
}

function getProspectRowAsObject_(sh, prospectId) {
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return null;

  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const ids = sh.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const idx = ids.indexOf(prospectId);
  if (idx === -1) return null;

  const row = sh.getRange(idx + 2, 1, 1, sh.getLastColumn()).getValues()[0];
  const obj = {};
  headers.forEach((h, i) => obj[String(h || '').trim()] = row[i]);
  return obj;
}


function sendProspectPdfEmail_(prospectId, prospectObj, pdfFile) {
  const toInternal = NOTIF_EMAIL || 'aircoolinghvac@gmail.com';
  const clientEmail = String((prospectObj && prospectObj.Email) || '').trim();

  const typeDemande = String((prospectObj && prospectObj.Type_Demande) || 'demande').trim();
  const fullName = String((prospectObj && prospectObj.Nom) || '').trim();
  const greetingName = fullName || 'client';

  const subject = `Fiche prospect – ${typeDemande} – ${prospectId}`;

  const body =
`Bonjour ${greetingName},

Veuillez trouver ci-joint votre fiche prospect "${typeDemande}".

Bien à vous,
AirCooling`;

  const attachments = [];
  if (pdfFile) attachments.push(pdfFile.getBlob());

  // ✅ envoi interne + (option) client
  if (clientEmail) {
    // envoie au client et met l'interne en copie
    MailApp.sendEmail({
      to: clientEmail,
      cc: toInternal,
      subject,
      body,
      attachments
    });
  } else {
    // pas d'email client → interne seulement
    MailApp.sendEmail({
      to: toInternal,
      subject,
      body,
      attachments
    });
  }
}


function sendBonPdfToClient_(bonId, form, pdfFile) {
  const clientEmail = String(form.Email || '').trim();
  if (!clientEmail) return; // rien à faire

  const clientName = String(form.Client_Nom || '').trim() || 'client';
  const subject = `Votre bon d’intervention – ${bonId}`;

  const body =
`Bonjour ${clientName},

Veuillez trouver en pièce jointe votre bon d’intervention.

Bien à vous,
AirCooling`;

  const attachments = [];
  if (pdfFile) attachments.push(pdfFile.getBlob());

  MailApp.sendEmail({
    to: clientEmail,
    subject,
    body,
    attachments
  });
}