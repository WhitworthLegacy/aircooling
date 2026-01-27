-- Prospects table
-- For tracking incoming quote/devis requests (pre-client)

create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Type
  type_client text default 'Particulier', -- Particulier | Professionnel

  -- Contact
  nom text not null,
  telephone text,
  email text,
  tva text, -- Numéro de TVA (professionnels uniquement)
  source text default 'Site web', -- Site web | Téléphone | Recommandation | Autre

  -- Adresse
  adresse text,
  localite text,
  code_postal text,

  -- Demande
  type_demande text, -- Climatisation | Ventilation | Chauffage | Entretien | Dépannage | Autre
  description_demande text,

  -- Détails
  marque_souhaitee text,
  nombre_unites integer,

  -- Suivi (admin)
  statut text not null default 'Nouveau',
  -- Nouveau | A contacter | Visite planifiée | Devis envoyé | Gagné | Perdu
  visite_technique_date date,
  visite_technique_heure text,
  technicien_assigne uuid references profiles(id) on delete set null,

  -- Devis
  devis_montant_estimatif numeric,
  devis_montant_final numeric,

  -- Documents
  pdf_url text,
  plan_croquis_url text,

  -- Notes
  notes_internes text,

  -- Lien client (si converti)
  client_id uuid references clients(id) on delete set null
);

create index if not exists idx_prospects_statut on prospects(statut);
create index if not exists idx_prospects_email on prospects(email);
create index if not exists idx_prospects_created on prospects(created_at desc);
create index if not exists idx_prospects_client on prospects(client_id);

-- RLS
alter table prospects enable row level security;

create policy "Staff can manage prospects" on prospects
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- Trigger
create trigger prospects_updated_at
  before update on prospects
  for each row execute function update_updated_at();

-- Storage bucket for documents (PDFs, plans, etc.)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Staff can manage documents" on storage.objects
  for all using (bucket_id = 'documents' and (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  ));

create policy "Public can read documents" on storage.objects
  for select using (bucket_id = 'documents');

create policy "Anyone can upload to documents" on storage.objects
  for insert with check (bucket_id = 'documents');
