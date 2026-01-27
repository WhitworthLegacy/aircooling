-- Blog: Posts and Categories
-- For content/SEO feature

create table if not exists blog_categories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  slug text not null unique,
  description text,

  -- SEO
  seo_title text,
  seo_description text,

  -- Hiérarchie
  parent_id uuid references blog_categories(id) on delete set null,
  sort_order integer default 0,

  is_active boolean not null default true
);

create index if not exists idx_blog_categories_slug on blog_categories(slug);

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Auteur
  author_id uuid references profiles(id) on delete set null,

  -- Identification
  slug text not null unique,
  title text not null,

  -- Contenu
  excerpt text,
  content text not null,

  -- Images
  cover_image_url text,
  images text[] default '{}',

  -- Catégorie et tags
  category_id uuid references blog_categories(id) on delete set null,
  tags text[] default '{}',

  -- SEO
  seo_title text,
  seo_description text,
  seo_keywords text[],

  -- Publication
  status text not null default 'draft', -- draft|published|scheduled|archived
  published_at timestamptz,
  scheduled_for timestamptz,

  -- Métriques
  view_count integer not null default 0,

  -- Options
  is_featured boolean not null default false,
  allow_comments boolean not null default true
);

create index if not exists idx_blog_posts_slug on blog_posts(slug);
create index if not exists idx_blog_posts_status on blog_posts(status);
create index if not exists idx_blog_posts_published on blog_posts(published_at);
create index if not exists idx_blog_posts_category on blog_posts(category_id);
create index if not exists idx_blog_posts_author on blog_posts(author_id);

-- Full text search
create index if not exists idx_blog_posts_search on blog_posts
  using gin(to_tsvector('french', coalesce(title, '') || ' ' || coalesce(content, '')));

-- RLS
alter table blog_categories enable row level security;
alter table blog_posts enable row level security;

-- Public can view published posts
create policy "Anyone can view active categories" on blog_categories
  for select using (is_active = true);

create policy "Anyone can view published posts" on blog_posts
  for select using (status = 'published' and published_at <= now());

-- Staff can manage
create policy "Staff can manage blog_categories" on blog_categories
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

create policy "Staff can manage blog_posts" on blog_posts
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- Triggers
create trigger blog_categories_updated_at
  before update on blog_categories
  for each row execute function update_updated_at();

create trigger blog_posts_updated_at
  before update on blog_posts
  for each row execute function update_updated_at();

-- Auto-set published_at when publishing
create or replace function set_published_at()
returns trigger as $$
begin
  if new.status = 'published' and old.status != 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger blog_posts_set_published
  before update on blog_posts
  for each row execute function set_published_at();
