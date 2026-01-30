# 🔧 AirCooling HVAC - Platform Complete

**Plateforme tout-en-un pour AirCooling : Gestion client, Devis, Interventions, CRM & Plus**

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)

---

## 📋 Table des Matières

- [Vue d'Ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Déploiement](#déploiement)
- [Support](#support)

---

## 🎯 Vue d'Ensemble

AirCooling est une **plateforme complète de gestion HVAC** (chauffage, ventilation, climatisation) avec :

- **Application Web Client** (port 3000) : Formulaires de devis, dessin de plan, prise de rendez-vous
- **Dashboard Admin** (port 3001) : CRM, gestion devis, missions terrain, inventaire, finances
- **Système de Nurturing** : Emails automatiques pour convertir les prospects
- **Formulaires Techniciens** : BON d'intervention mobile avec signatures électroniques

---

## ✨ Fonctionnalités

### 🌐 Application Client (Public)

| Feature | Description | Route |
|---------|-------------|-------|
| **Demande de Devis** | Formulaire wizard 5 étapes | `/devis` |
| **Dessin de Plan** | Canvas tactile pour croquis technique | `/devis/plan` |
| **Prise de RDV** | Calendrier de disponibilités | `/rendez-vous` |
| **Blog** | Articles SEO | `/blog` |
| **Contact** | Formulaire de contact | `/contact` |

### 🎛️ Dashboard Admin

| Feature | Description | Accessibilité |
|---------|-------------|---------------|
| **CRM Kanban** | Pipeline ventes en 7 étapes | Admin |
| **Gestion Devis** | Création, envoi, suivi | Admin |
| **Clients** | Base complète + historique | Admin |
| **Missions Terrain** | GPS, navigation, statuts | Admin |
| **Interventions** | Planification + checklists | Admin |
| **Inventaire** | Stock, mouvements, alertes | Admin |
| **Prospects** | Leads + relance | Admin |
| **BONs** | Historique BONs + signatures | Admin |
| **Conversations** | Chat Twilio temps réel | Admin |
| **Finances** | KPIs, CA, exports | Super Admin |
| **Users** | Gestion rôles | Super Admin |

### 📱 Terrain (Techniciens)

| Feature | Description | Route |
|---------|-------------|-------|
| **BON Intervention** | Wizard 9 étapes + signatures | `/interventions/bon` |
| **Missions du Jour** | Liste GPS, navigation | `/dashboard/missions` |
| **Appels directs** | Click-to-call | Toutes pages |

### 🔔 Nurturing Automatique

| Email | Timing | Contenu |
|-------|--------|---------|
| **Welcome** | T+0 (immédiat) | Confirmation + infos entreprise |
| **Follow-up** | T+24h | Rappel devis + demande photos |
| **Urgency** | T+72h | Offre limitée -15% |

---

## 🏗️ Architecture

### Monorepo Structure

```
aircooling/
├── apps/
│   ├── web/          # Next.js 15 - Client public (port 3000)
│   │   ├── app/      # App Router
│   │   │   ├── api/  # API Routes
│   │   │   ├── devis/
│   │   │   └── interventions/
│   │   ├── components/
│   │   └── lib/
│   │
│   └── admin/        # Next.js 15 - Dashboard (port 3001)
│       ├── app/dashboard/
│       ├── components/
│       └── lib/
│
├── supabase/
│   └── migrations/   # PostgreSQL migrations
│
├── turbo.json        # Turbo config
├── pnpm-workspace.yaml
└── vercel.json       # Cron jobs config
```

### Tech Stack

**Frontend:**
- Next.js 15.0 (App Router)
- React 19.0
- TypeScript 5.0
- Tailwind CSS 4.0

**Backend:**
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- Vercel Edge Functions
- Cron jobs (Vercel)

**Intégrations:**
- **Email:** Resend (transactional + nurturing)
- **SMS/WhatsApp:** Twilio
- **PDF:** jsPDF + jsPDF-autotable
- **Signatures:** signature_pad 4.2.0
- **Analytics:** Google Analytics

---

## 🚀 Installation

### 1. Prérequis

- Node.js 20+
- pnpm 9+ (ou npm)
- Compte Supabase
- Compte Resend (emails)
- Compte Twilio (optionnel, pour SMS/WhatsApp)

### 2. Clone & Install

```bash
git clone https://github.com/WhitworthLegacy/aircooling.git
cd aircooling
pnpm install
```

### 3. Database Setup

```bash
# Appliquer les migrations Supabase
supabase db push

# Ou manuellement via Supabase Dashboard SQL Editor
# Copier/coller le contenu de chaque fichier .sql dans supabase/migrations/
```

---

## ⚙️ Configuration

### 1. Variables d'environnement

Créer `/apps/web/.env.local` :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@aircooling.be

# SMS/WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+32xxxxxxxxx

# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Admin
ADMIN_EMAIL=info@aircooling.be

# Cron Security
CRON_SECRET=your-random-secret-here
```

### 2. Supabase Storage Buckets

Créer le bucket `documents` dans Supabase Storage (si pas déjà créé par migration) :

```sql
-- Via Supabase SQL Editor
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;
```

### 3. Cron Jobs (Production)

Configurer dans Vercel Dashboard :
- Path: `/api/cron/nurturing-emails`
- Schedule: `0 9,14,18 * * *` (9h, 14h, 18h tous les jours)
- Authorization: Ajouter header `Authorization: Bearer ${CRON_SECRET}`

---

## 🎬 Utilisation

### Développement

```bash
# Lancer les deux apps
pnpm dev

# OU app web uniquement
pnpm dev:web

# OU app admin uniquement
pnpm dev:admin
```

**URLs:**
- Client: http://localhost:3000
- Admin: http://localhost:3001

### Build Production

```bash
pnpm build
```

---

## 📍 Routes Principales

### Client (Port 3000)

- `/` - Homepage
- `/devis` - Formulaire de devis
- `/devis/plan?prospectId=xxx` - Dessin de plan
- `/interventions/bon` - BON d'intervention (techniciens)
- `/rendez-vous` - Prise de RDV
- `/blog` - Articles
- `/contact` - Contact

### Admin (Port 3001)

- `/dashboard` - Vue d'ensemble
- `/dashboard/crm` - Pipeline CRM Kanban
- `/dashboard/devis` - Gestion des devis
- `/dashboard/clients` - Base clients
- `/dashboard/prospects` - Prospects & Leads
- `/dashboard/bons` - BONs d'intervention
- `/dashboard/missions` - Missions terrain (GPS)
- `/dashboard/interventions` - Interventions HVAC
- `/dashboard/inventory` - Gestion stock
- `/dashboard/conversations` - Chat Twilio
- `/dashboard/finances` - Rapports financiers (super admin)
- `/dashboard/users` - Gestion utilisateurs (super admin)

---

## 🔐 Rôles & Permissions

| Rôle | Accès Dashboard | Finances | Users | Notes |
|------|----------------|----------|-------|-------|
| **Technicien** | ✅ Missions seulement | ❌ | ❌ | Accès terrain uniquement |
| **Admin** | ✅ Tout sauf Finances/Users | ❌ | ❌ | Gestion quotidienne |
| **Super Admin** | ✅ Accès complet | ✅ | ✅ | Contrôle total |

---

## 📊 Base de Données

### Tables Principales

- `profiles` - Utilisateurs (staff, admin, super_admin)
- `clients` - Base clients CRM
- `prospects` - Leads avec plan dessiné
- `quotes` - Devis + quote_items
- `interventions` - BONs + interventions HVAC
- `appointments` - Rendez-vous
- `inventory` - Stock + movements
- `payments` - Paiements
- `blog` - Articles
- `drivers` - Chauffeurs/techniciens
- `notifications` - Système de notifications

### Storage Buckets

```
documents/
├── plans/{prospect_id}.png
├── prospects/{prospect_id}.pdf
└── signatures/
    ├── tech-{bon_n}-{timestamp}.png
    └── client-{bon_n}-{timestamp}.png
```

---

## 🎨 Design System

**Couleurs:**
- Primary: `#1B3B8A` (Bleu AirCooling)
- Accent: `#CC0A0A` (Rouge)
- Dark: `#1A1A2E`
- Surface: `#F5F5F7`

**Fonts:**
- Headings: Montserrat
- Body: Inter

**Components:**
- Design mobile-first
- Tailwind CSS 4.0
- Lucide Icons

---

## 📧 Email Nurturing

### Séquence Automatique

1. **Welcome Email (T+0)**
   - Envoyé immédiatement après soumission formulaire
   - Confirmation + présentation entreprise
   - CTA WhatsApp

2. **Follow-up Email (T+24h)**
   - Rappel devis en cours
   - Demande photos/mesures
   - CTA Email/Téléphone

3. **Urgency Email (T+72h)**
   - Offre spéciale -15%
   - Urgence (places limitées)
   - CTA Appel direct

**Cron Job:** 3x par jour (9h, 14h, 18h)

---

## 🚀 Déploiement

### Vercel (Recommandé)

1. Connecter repo GitHub à Vercel
2. Configurer variables d'environnement
3. Déployer :
   - `apps/web` → Production (aircooling.be)
   - `apps/admin` → Subdomain (admin.aircooling.be)

### Configuration Vercel

**vercel.json** (déjà configuré) :
```json
{
  "crons": [{
    "path": "/api/cron/nurturing-emails",
    "schedule": "0 9,14,18 * * *"
  }]
}
```

---

## 🛠️ Workflow Complet

### 1. Prospect → Client

```
Client visite /devis
    ↓
Remplit formulaire (5 étapes)
    ↓
Soumission → Création prospect DB
    ↓
📧 Email Welcome immédiat
    ↓
Redirection /devis/plan
    ↓
Dessine plan sur canvas
    ↓
Sauvegarde plan → Supabase Storage
    ↓
Admin voit prospect dans Dashboard
    ↓
Admin contacte → Convertit en client (CRM)
```

### 2. Intervention Terrain

```
Technicien ouvre /interventions/bon
    ↓
Wizard 9 étapes (client, travaux, montants)
    ↓
Signatures électroniques (tech + client)
    ↓
Sauvegarde BON + signatures → Supabase
    ↓
Admin voit BON dans /dashboard/bons
```

---

## 📱 Mobile-First

- **Formulaires:** Touch-friendly, gros boutons
- **Signatures:** Canvas tactile optimisé
- **Missions:** GPS natif (Waze/Google Maps)
- **Navigation:** Bottom Nav (admin mobile)

---

## 🤝 Support

**Contacts:**
- Email: info@aircooling.be
- Téléphone: 0487 17 06 10
- WhatsApp: +32 487 17 06 10

**Documentation technique:**
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 📝 License

© 2026 AirCooling HVAC. Tous droits réservés.

---

## 🎉 Crédits

Développé avec ❤️ pour AirCooling par **WhitworthLegacy**

**Technologies:**
- Next.js 15 + React 19
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- Tailwind CSS 4
- TypeScript 5
- Resend (Emails)
- Twilio (SMS/WhatsApp)
- signature_pad
- jsPDF

---

**🚀 Ready to deploy!**
