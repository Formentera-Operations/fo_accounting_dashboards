-- =============================================================================
-- Initial schema for fo_accounting_dashboards
-- Data synced from Snowflake FO_PROD_DB marts + app-level tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Reference tables (synced from Snowflake dim_ models)
-- ---------------------------------------------------------------------------

create table public.basins (
  id          text primary key,  -- 'permian', 'eagle_ford', 'scoop_stack', 'williston'
  name        text not null,
  created_at  timestamptz default now()
);

insert into public.basins (id, name) values
  ('permian',     'Permian'),
  ('eagle_ford',  'Eagle Ford'),
  ('scoop_stack', 'SCOOP/STACK'),
  ('williston',   'Williston');

create table public.properties (
  property_id   text primary key,  -- matches Snowflake dim_properties.property_id
  property_name text not null,
  basin_id      text references public.basins(id),
  api_number    text,
  operator      text,
  is_active     boolean default true,
  synced_at     timestamptz default now()
);

create table public.wells (
  well_id       text primary key,  -- matches Snowflake dim_wells.well_id
  well_name     text not null,
  property_id   text references public.properties(property_id),
  basin_id      text references public.basins(id),
  api_number    text,
  spud_date     date,
  first_prod_date date,
  is_active     boolean default true,
  synced_at     timestamptz default now()
);

create index on public.wells (property_id);
create index on public.wells (basin_id);

-- ---------------------------------------------------------------------------
-- Financial snapshot tables (synced from Snowflake fct_ models)
-- All monetary values in USD, volumes in BOE unless noted
-- ---------------------------------------------------------------------------

create table public.revenue_snapshots (
  id              uuid primary key default gen_random_uuid(),
  property_id     text references public.properties(property_id),
  well_id         text references public.wells(well_id),
  basin_id        text references public.basins(id),
  report_month    date not null,  -- first day of month
  oil_revenue     numeric(18,2),
  gas_revenue     numeric(18,2),
  ngl_revenue     numeric(18,2),
  total_revenue   numeric(18,2),
  oil_volume_bbl  numeric(18,3),
  gas_volume_mcf  numeric(18,3),
  ngl_volume_bbl  numeric(18,3),
  synced_at       timestamptz default now()
);

create index on public.revenue_snapshots (property_id, report_month);
create index on public.revenue_snapshots (basin_id, report_month);
create unique index on public.revenue_snapshots (well_id, report_month);

create table public.loe_snapshots (
  id                  uuid primary key default gen_random_uuid(),
  property_id         text references public.properties(property_id),
  well_id             text references public.wells(well_id),
  basin_id            text references public.basins(id),
  report_month        date not null,
  gathering           numeric(18,2),
  compression         numeric(18,2),
  processing          numeric(18,2),
  transportation      numeric(18,2),
  saltwater_disposal  numeric(18,2),
  chemicals           numeric(18,2),
  contract_labor      numeric(18,2),
  fuel                numeric(18,2),
  repairs_maintenance numeric(18,2),
  other_loe           numeric(18,2),
  total_loe           numeric(18,2),
  loe_per_boe         numeric(18,4),
  synced_at           timestamptz default now()
);

create index on public.loe_snapshots (property_id, report_month);
create index on public.loe_snapshots (basin_id, report_month);
create unique index on public.loe_snapshots (well_id, report_month);

create table public.production_snapshots (
  id              uuid primary key default gen_random_uuid(),
  property_id     text references public.properties(property_id),
  well_id         text references public.wells(well_id),
  basin_id        text references public.basins(id),
  report_month    date not null,
  oil_bbl         numeric(18,3),
  gas_mcf         numeric(18,3),
  ngl_bbl         numeric(18,3),
  boe             numeric(18,3),
  run_time_hours  numeric(10,2),
  synced_at       timestamptz default now()
);

create index on public.production_snapshots (property_id, report_month);
create index on public.production_snapshots (basin_id, report_month);
create unique index on public.production_snapshots (well_id, report_month);

create table public.pnl_snapshots (
  id              uuid primary key default gen_random_uuid(),
  property_id     text references public.properties(property_id),
  well_id         text references public.wells(well_id),
  basin_id        text references public.basins(id),
  report_month    date not null,
  total_revenue   numeric(18,2),
  total_loe       numeric(18,2),
  production_taxes numeric(18,2),
  workover_expenses numeric(18,2),
  net_income      numeric(18,2),
  synced_at       timestamptz default now()
);

create index on public.pnl_snapshots (property_id, report_month);
create index on public.pnl_snapshots (basin_id, report_month);
create unique index on public.pnl_snapshots (well_id, report_month);

-- ---------------------------------------------------------------------------
-- App tables
-- ---------------------------------------------------------------------------

create table public.sync_log (
  id            uuid primary key default gen_random_uuid(),
  sync_type     text not null,  -- 'full' | 'incremental'
  table_name    text not null,
  status        text not null,  -- 'running' | 'success' | 'failed'
  rows_synced   integer,
  error_message text,
  started_at    timestamptz default now(),
  completed_at  timestamptz
);

create index on public.sync_log (table_name, started_at desc);

create table public.report_configs (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  report_type   text not null,  -- 'los' | 'revenue' | 'loe' | 'pnl' | 'production'
  basin_ids     text[],         -- null = all basins
  property_ids  text[],         -- null = all properties
  date_range    jsonb,          -- { "type": "rolling_12" } or { "from": "2024-01", "to": "2024-12" }
  powerbi_report_id text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.basins             enable row level security;
alter table public.properties         enable row level security;
alter table public.wells              enable row level security;
alter table public.revenue_snapshots  enable row level security;
alter table public.loe_snapshots      enable row level security;
alter table public.production_snapshots enable row level security;
alter table public.pnl_snapshots      enable row level security;
alter table public.sync_log           enable row level security;
alter table public.report_configs     enable row level security;

-- Authenticated users can read all financial data (internal app only)
create policy "authenticated read"
  on public.basins for select to authenticated using (true);

create policy "authenticated read"
  on public.properties for select to authenticated using (true);

create policy "authenticated read"
  on public.wells for select to authenticated using (true);

create policy "authenticated read"
  on public.revenue_snapshots for select to authenticated using (true);

create policy "authenticated read"
  on public.loe_snapshots for select to authenticated using (true);

create policy "authenticated read"
  on public.production_snapshots for select to authenticated using (true);

create policy "authenticated read"
  on public.pnl_snapshots for select to authenticated using (true);

create policy "authenticated read"
  on public.sync_log for select to authenticated using (true);

create policy "authenticated read"
  on public.report_configs for select to authenticated using (true);

-- Service role handles all writes (sync jobs only)
