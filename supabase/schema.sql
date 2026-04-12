-- Aiden Sales App - Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- LEADS
-- ============================================
create table if not exists leads (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text,
  phone text,
  company text,
  title text,
  status text default 'New' check (status in ('New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost')),
  source text,
  value numeric default 0,
  score integer default 0 check (score >= 0 and score <= 100),
  notes text,
  last_contact_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

-- ============================================
-- DEALS (Pipeline)
-- ============================================
create table if not exists deals (
  id uuid default uuid_generate_v4() primary key,
  lead_id uuid references leads(id) on delete set null,
  name text not null,
  company text,
  value numeric default 0,
  stage text default 'New' check (stage in ('New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost')),
  probability integer default 0 check (probability >= 0 and probability <= 100),
  expected_close_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

-- ============================================
-- CAMPAIGNS
-- ============================================
create table if not exists campaigns (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  status text default 'draft' check (status in ('active', 'paused', 'draft', 'completed')),
  steps integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

-- ============================================
-- CAMPAIGN EMAILS (individual sends)
-- ============================================
create table if not exists campaign_emails (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references campaigns(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  subject text,
  body text,
  status text default 'pending' check (status in ('pending', 'sent', 'opened', 'clicked', 'replied', 'bounced')),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- EMAIL TEMPLATES
-- ============================================
create table if not exists email_templates (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  subject text not null,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

-- ============================================
-- ACTIVITY LOG
-- ============================================
create table if not exists activity_log (
  id uuid default uuid_generate_v4() primary key,
  lead_id uuid references leads(id) on delete cascade,
  type text not null check (type in ('email', 'call', 'note', 'meeting', 'status_change', 'ai_action')),
  description text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table leads enable row level security;
alter table deals enable row level security;
alter table campaigns enable row level security;
alter table campaign_emails enable row level security;
alter table email_templates enable row level security;
alter table activity_log enable row level security;

-- Policies: users can only see their own data
create policy "Users see own leads" on leads for all using (auth.uid() = user_id);
create policy "Users see own deals" on deals for all using (auth.uid() = user_id);
create policy "Users see own campaigns" on campaigns for all using (auth.uid() = user_id);
create policy "Users see own campaign_emails" on campaign_emails for all using (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);
create policy "Users see own templates" on email_templates for all using (auth.uid() = user_id);
create policy "Users see own activity" on activity_log for all using (auth.uid() = user_id);

-- ============================================
-- AUTO-UPDATE updated_at
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at before update on leads for each row execute function update_updated_at();
create trigger deals_updated_at before update on deals for each row execute function update_updated_at();
create trigger campaigns_updated_at before update on campaigns for each row execute function update_updated_at();
create trigger email_templates_updated_at before update on email_templates for each row execute function update_updated_at();

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_leads_user on leads(user_id);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_deals_user on deals(user_id);
create index if not exists idx_deals_stage on deals(stage);
create index if not exists idx_campaigns_user on campaigns(user_id);
create index if not exists idx_activity_lead on activity_log(lead_id);
