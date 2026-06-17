-- ===========================================================================
-- Sahayata AI — initial schema
-- Postgres / Supabase. Demo product: synthetic data only, no real PII.
-- Row-Level Security policies are defined in 0002_rls_policies.sql.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- --- Reference / tenancy --------------------------------------------------

create table if not exists public.branches (
    id          uuid primary key default gen_random_uuid(),
    name        text        not null,
    city        text        not null,
    created_at  timestamptz not null default now()
);

-- Staff are application users; id references Supabase auth.users.
create table if not exists public.staff (
    id                 uuid primary key references auth.users (id) on delete cascade,
    full_name          text        not null,
    email              text        not null unique,
    branch_id          uuid        not null references public.branches (id) on delete restrict,
    preferred_language text        not null default 'en',
    role               text        not null default 'officer'
        check (role in ('officer', 'manager', 'admin')),
    created_at         timestamptz not null default now()
);
create index if not exists staff_branch_id_idx on public.staff (branch_id);

-- Customers: pseudonymous. phone_hash is a hashed synthetic lookup key, never raw PII.
create table if not exists public.customers (
    id                 uuid primary key default gen_random_uuid(),
    display_name       text        not null,
    preferred_language text        not null default 'hi',
    phone_hash         text        unique,
    created_at         timestamptz not null default now()
);

-- --- Conversation domain --------------------------------------------------

create table if not exists public.conversations (
    id             uuid primary key default gen_random_uuid(),
    customer_id    uuid references public.customers (id) on delete set null,
    staff_id       uuid not null references public.staff (id) on delete restrict,
    branch_id      uuid not null references public.branches (id) on delete restrict,
    started_at     timestamptz not null default now(),
    ended_at       timestamptz,
    primary_intent text,
    sentiment_label text,
    escalated      boolean not null default false
);
create index if not exists conversations_branch_id_idx on public.conversations (branch_id);
create index if not exists conversations_customer_id_idx on public.conversations (customer_id);

create type public.speaker as enum ('customer', 'staff');

create table if not exists public.utterances (
    id              uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations (id) on delete cascade,
    speaker         public.speaker not null,
    original_text   text not null,
    original_lang   text not null,
    translated_text text,
    translated_lang text,
    sentiment       text,
    created_at      timestamptz not null default now()
);
create index if not exists utterances_conversation_id_idx on public.utterances (conversation_id);

create table if not exists public.summaries (
    id                       uuid primary key default gen_random_uuid(),
    conversation_id          uuid not null unique references public.conversations (id) on delete cascade,
    summary_in_customer_lang text not null,
    summary_in_staff_lang    text not null,
    action_items             jsonb not null default '[]'::jsonb,
    documents_required       jsonb not null default '[]'::jsonb,
    created_at               timestamptz not null default now()
);

-- Returning-customer memory (F8).
create table if not exists public.customer_memory (
    id                uuid primary key default gen_random_uuid(),
    customer_id       uuid not null unique references public.customers (id) on delete cascade,
    key_facts         jsonb not null default '{}'::jsonb,
    last_visit_summary text,
    visit_count       integer not null default 0,
    updated_at        timestamptz not null default now()
);

-- --- Banking knowledge base (F4 + F10) ------------------------------------

create table if not exists public.banking_processes (
    intent_key         text primary key,
    display_name       text not null,
    required_documents jsonb not null default '[]'::jsonb,
    steps              jsonb not null default '[]'::jsonb,
    keywords           text[] not null default '{}'
);

-- Enable RLS on every table now; policies live in the next migration.
alter table public.branches          enable row level security;
alter table public.staff             enable row level security;
alter table public.customers         enable row level security;
alter table public.conversations     enable row level security;
alter table public.utterances        enable row level security;
alter table public.summaries         enable row level security;
alter table public.customer_memory   enable row level security;
alter table public.banking_processes enable row level security;
