-- ============================================================
-- STRATA TECH — Supabase Schema
-- Run this once in the Supabase SQL Editor (project → SQL editor → New query)
-- ============================================================

-- Enquiries table (all booking form submissions)
create table if not exists enquiries (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- Contact
  name          text not null,
  email         text,
  phone         text not null,

  -- What they want
  service       text not null,  -- e.g. 'Website Design', 'Custom Web App'
  budget        text,           -- e.g. 'KES 50k–100k'
  timeline      text,           -- e.g. 'ASAP', '1–3 months'
  details       text,           -- freeform notes from the form

  -- Follow-up questions (dynamic per service)
  extra_data    jsonb default '{}',  -- e.g. {"platform":"Shopify","pages":"5"}

  -- Preferred contact channel
  channel       text default 'whatsapp',  -- whatsapp | call | email | zoom

  -- Admin tracking
  status        text not null default 'new',
  -- new | contacted | proposal_sent | in_progress | won | lost | archived
  admin_notes   text,
  updated_at    timestamptz
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger enquiries_updated_at
  before update on enquiries
  for each row execute procedure update_updated_at();

-- Index for admin dashboard (sort by newest)
create index if not exists enquiries_created_at_idx on enquiries(created_at desc);
create index if not exists enquiries_status_idx on enquiries(status);

-- Row-level security: anon can INSERT only, authenticated (you) can do everything
alter table enquiries enable row level security;

create policy "Anyone can submit an enquiry"
  on enquiries for insert
  to anon
  with check (true);

create policy "Authenticated users can read and update"
  on enquiries for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- Done. Check the Table Editor to confirm the table exists.
-- ============================================================
