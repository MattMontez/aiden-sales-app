-- Campaign Steps: defines the email sequence for each campaign
-- Run this in Supabase SQL Editor

create table if not exists campaign_steps (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references campaigns(id) on delete cascade,
  step_number integer not null default 1,
  delay_days integer not null default 0,
  subject text not null,
  body text not null,
  created_at timestamptz default now()
);

-- Link leads to campaigns
create table if not exists campaign_leads (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references campaigns(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  current_step integer default 0,
  status text default 'active' check (status in ('active', 'paused', 'completed', 'bounced')),
  last_sent_at timestamptz,
  created_at timestamptz default now(),
  unique(campaign_id, lead_id)
);

-- RLS
alter table campaign_steps enable row level security;
alter table campaign_leads enable row level security;

create policy "Users see own campaign_steps" on campaign_steps for all using (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);
create policy "Users see own campaign_leads" on campaign_leads for all using (
  campaign_id in (select id from campaigns where user_id = auth.uid())
);

-- Indexes
create index if not exists idx_campaign_steps_campaign on campaign_steps(campaign_id);
create index if not exists idx_campaign_leads_campaign on campaign_leads(campaign_id);
create index if not exists idx_campaign_leads_lead on campaign_leads(lead_id);
