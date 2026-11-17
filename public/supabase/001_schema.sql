-- Daya Clothing Studio · Esquema inicial para un solo comercio
-- Ejecutar en Supabase SQL Editor después de configurar Supabase Auth.
-- NO crear cuentas de administrador ni inyectar datos de clientes desde SQL público.
-- Asignar app_metadata.daya_role = admin | operador | consulta desde un servidor de confianza.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  name text not null check(length(trim(name)) >= 2),
  sku text not null unique,
  category text not null,
  price numeric(12,2) not null check(price>=0),
  cost numeric(12,2) not null default 0 check(cost>=0),
  stock integer not null default 0 check(stock>=0),
  min_stock integer not null default 6 check(min_stock>=0),
  status text not null default 'Borrador' check(status in ('Activo','Borrador','Archivado')),
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id text primary key,
  name text not null,
  email text not null unique,
  phone text not null,
  city text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  customer_id text not null references public.customers(id) on delete restrict,
  items jsonb not null check (jsonb_typeof(items)='array'),
  total numeric(12,2) not null check(total>=0),
  status text not null default 'Nuevo' check(status in ('Nuevo','Preparando','Enviado','Entregado','Cancelado')),
  channel text not null,
  note text not null default '',
  placed_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key,
  type text not null check(type in ('Decisión','Pendiente','Riesgo','Próximo paso')),
  title text not null,
  detail text not null default '',
  status text not null default 'Pendiente',
  created_at timestamptz not null default now()
);

create table if not exists public.publication_checklist (
  id text primary key,
  title text not null,
  done boolean not null default false
);

create table if not exists public.shop_settings (
  id text primary key default 'shop' check(id='shop'),
  brand text not null default 'Daya Clothing',
  email text not null,
  test_email text not null,
  sender text not null default 'Daya Clothing',
  domain text,
  cloudflare_project text,
  site_url text,
  supabase_url text
);

create table if not exists public.activity_events (
  id text primary key,
  detail text not null,
  actor_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Sólo el back-end de confianza puede registrar los intentos de envío del correo.
create table if not exists public.mail_outbox (
  id text primary key,
  destination text not null,
  subject text not null,
  provider_message_id text,
  status text not null check(status in ('queued','sent','failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_status on public.orders(status,placed_at desc);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_products_status on public.products(status);

-- Los perfiles se deciden con app_metadata, NO con user_metadata (editable por el usuario).
-- Este esquema supone que un administrador confiable asigna daya_role.
create schema if not exists private;
create or replace function private.daya_role() returns text
language sql stable security invoker set search_path = '' as $$
  select coalesce((auth.jwt()->'app_metadata'->>'daya_role')::text, '')
$$;
grant usage on schema private to authenticated;
grant execute on function private.daya_role() to authenticated;

alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.publication_checklist enable row level security;
alter table public.shop_settings enable row level security;
alter table public.activity_events enable row level security;
alter table public.mail_outbox enable row level security;

create policy products_read on public.products for select to authenticated
 using (private.daya_role() in ('admin','operador','consulta'));
create policy products_insert on public.products for insert to authenticated
 with check (private.daya_role()='admin');
create policy products_update on public.products for update to authenticated
 using (private.daya_role()='admin') with check (private.daya_role()='admin');
create policy products_delete on public.products for delete to authenticated
 using (private.daya_role()='admin');

create policy customers_read on public.customers for select to authenticated
 using (private.daya_role() in ('admin','operador'));
create policy customers_insert on public.customers for insert to authenticated
 with check (private.daya_role() in ('admin','operador'));
create policy customers_update on public.customers for update to authenticated
 using (private.daya_role() in ('admin','operador')) with check (private.daya_role() in ('admin','operador'));

create policy orders_read on public.orders for select to authenticated
 using (private.daya_role() in ('admin','operador'));
create policy orders_insert on public.orders for insert to authenticated
 with check (private.daya_role() in ('admin','operador') and created_by=(select auth.uid()));
create policy orders_update on public.orders for update to authenticated
 using (private.daya_role() in ('admin','operador')) with check (private.daya_role() in ('admin','operador'));

create policy profiles_read on public.staff_profiles for select to authenticated
 using (user_id=(select auth.uid()) or private.daya_role()='admin');
create policy tasks_read on public.tasks for select to authenticated
 using (private.daya_role() in ('admin','operador','consulta'));
create policy tasks_insert on public.tasks for insert to authenticated
 with check (private.daya_role() in ('admin','operador'));
create policy tasks_update on public.tasks for update to authenticated
 using (private.daya_role() in ('admin','operador')) with check(private.daya_role() in ('admin','operador'));
create policy checklist_read on public.publication_checklist for select to authenticated
 using (private.daya_role() in ('admin','operador','consulta'));
create policy checklist_insert on public.publication_checklist for insert to authenticated
 with check(private.daya_role()='admin');
create policy checklist_update on public.publication_checklist for update to authenticated
 using(private.daya_role() in ('admin','operador')) with check(private.daya_role() in ('admin','operador'));
create policy settings_read on public.shop_settings for select to authenticated
 using(private.daya_role()='admin');
create policy settings_insert on public.shop_settings for insert to authenticated
 with check(private.daya_role()='admin');
create policy settings_update on public.shop_settings for update to authenticated
 using(private.daya_role()='admin') with check(private.daya_role()='admin');
create policy events_read on public.activity_events for select to authenticated
 using(private.daya_role()='admin');
create policy events_insert on public.activity_events for insert to authenticated
 with check(private.daya_role() in ('admin','operador') and actor_user_id=(select auth.uid()));
create policy mail_read on public.mail_outbox for select to authenticated
 using(private.daya_role()='admin');
-- No hay políticas INSERT/UPDATE cliente para mail_outbox. Insertar sólo desde servidor autenticado.

-- Nota: para órdenes/inventario, las transacciones se harán en una función RPC con
-- bloqueo FOR UPDATE del inventario. No transportar el algoritmo local de JS a producción.
-- Ejecutar antes de producción: Security Advisor + revisar privilegios API + pruebas de RLS.
