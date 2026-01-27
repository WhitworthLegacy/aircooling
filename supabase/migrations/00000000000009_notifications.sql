-- Notifications: Email and WhatsApp
-- For transactional messaging

create table if not exists notification_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Identification
  slug text not null unique,
  name text not null,
  description text,

  -- Type
  channel text not null default 'email', -- email|whatsapp|sms|push

  -- Contenu
  subject text, -- pour email
  body text not null,
  html_body text, -- pour email HTML

  -- Variables disponibles
  variables text[] default '{}',

  is_active boolean not null default true
);

create index if not exists idx_notification_templates_slug on notification_templates(slug);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Template (optionnel)
  template_id uuid references notification_templates(id) on delete set null,

  -- Destinataire
  recipient_type text not null, -- client|user|staff
  recipient_id uuid,
  recipient_email text,
  recipient_phone text,

  -- Canal
  channel text not null default 'email', -- email|whatsapp|sms|push

  -- Contenu
  subject text,
  body text not null,
  html_body text,

  -- Contexte
  context jsonb default '{}',

  -- Référence
  reference_type text, -- booking|order|quote|intervention
  reference_id uuid,

  -- Statut
  status text not null default 'pending', -- pending|sent|delivered|failed|bounced
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,

  -- Provider info
  provider text, -- resend|twilio|sendgrid
  provider_message_id text,
  error text
);

create index if not exists idx_notifications_recipient on notifications(recipient_type, recipient_id);
create index if not exists idx_notifications_reference on notifications(reference_type, reference_id);
create index if not exists idx_notifications_status on notifications(status);
create index if not exists idx_notifications_created on notifications(created_at);

-- Conversations (pour CRM/support)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Participant
  client_id uuid references clients(id) on delete cascade,

  -- Canal
  channel text not null default 'whatsapp', -- whatsapp|sms|email|chat

  -- Identifiant externe
  external_id text, -- numéro WhatsApp, email, etc.

  -- Statut
  status text not null default 'open', -- open|pending|resolved|closed

  -- Dernier message
  last_message_at timestamptz,
  last_message_preview text,

  -- Assignation
  assigned_to uuid references profiles(id) on delete set null,

  -- Tags
  tags text[] default '{}'
);

create index if not exists idx_conversations_client on conversations(client_id);
create index if not exists idx_conversations_external on conversations(channel, external_id);
create index if not exists idx_conversations_status on conversations(status);

create table if not exists conversation_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  conversation_id uuid not null references conversations(id) on delete cascade,

  -- Direction
  direction text not null, -- inbound|outbound

  -- Expéditeur
  sender_type text not null, -- client|staff|system
  sender_id uuid,

  -- Contenu
  content text not null,
  content_type text default 'text', -- text|image|audio|video|document

  -- Média
  media_url text,
  media_type text,

  -- Provider
  provider_message_id text,

  -- Statut
  status text default 'sent', -- sent|delivered|read|failed
  delivered_at timestamptz,
  read_at timestamptz
);

create index if not exists idx_conversation_messages_conv on conversation_messages(conversation_id);

-- RLS
alter table notification_templates enable row level security;
alter table notifications enable row level security;
alter table conversations enable row level security;
alter table conversation_messages enable row level security;

-- Staff can manage templates
create policy "Staff can manage notification_templates" on notification_templates
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- Staff can manage notifications
create policy "Staff can manage notifications" on notifications
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- Conversations
create policy "Staff can manage conversations" on conversations
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

create policy "Staff can manage conversation_messages" on conversation_messages
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- Triggers
create trigger notification_templates_updated_at
  before update on notification_templates
  for each row execute function update_updated_at();

create trigger conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();
