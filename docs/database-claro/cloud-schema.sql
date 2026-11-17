-- Daya Clothing: esquema aislado. El navegador no puede leer tablas de negocio.
create table public.daya_cloud_config (
 id text primary key check(id='main'),
 owner_email text,
 site_url text,
 created_at timestamptz not null default now()
);
create table public.daya_cloud_state (
 id text primary key check(id='main'),
 data jsonb not null default '{}'::jsonb,
 revision bigint not null default 0,
 sample boolean not null default false,
 updated_at timestamptz not null default now()
);
create table public.daya_cloud_members (
 id uuid primary key references auth.users(id) on delete cascade,
 nombre text not null,
 email text not null unique,
 rol text not null check(rol in ('d','v')),
 activo boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.daya_cloud_requests (
 uid uuid not null references auth.users(id) on delete cascade,
 request_id text not null,
 response jsonb not null,
 created_at timestamptz not null default now(),
 primary key(uid, request_id)
);
create table public.daya_cloud_snapshots (
 id bigint generated always as identity primary key,
 data jsonb not null,
 created_at timestamptz not null default now()
);
insert into public.daya_cloud_config(id) values('main');
insert into public.daya_cloud_state(id) values('main');
alter table public.daya_cloud_config enable row level security;
alter table public.daya_cloud_state enable row level security;
alter table public.daya_cloud_members enable row level security;
alter table public.daya_cloud_requests enable row level security;
alter table public.daya_cloud_snapshots enable row level security;
revoke all on public.daya_cloud_config,public.daya_cloud_state,public.daya_cloud_members,public.daya_cloud_requests,public.daya_cloud_snapshots from anon,authenticated;
grant all on public.daya_cloud_config,public.daya_cloud_state,public.daya_cloud_members,public.daya_cloud_requests,public.daya_cloud_snapshots to service_role;
grant usage,select on sequence public.daya_cloud_snapshots_id_seq to service_role;
grant select on auth.sessions to service_role;
create or replace function public.daya_cloud_session_active(p_uid uuid,p_session uuid)
returns boolean language sql stable security invoker set search_path=public,pg_temp as $$
 select exists(select 1 from auth.sessions where id=p_session and user_id=p_uid and (not_after is null or not_after>now()));
$$;
revoke all on function public.daya_cloud_session_active(uuid,uuid) from public,anon,authenticated;
grant execute on function public.daya_cloud_session_active(uuid,uuid) to service_role;
create or replace function public.daya_cloud_commit(p_uid uuid,p_session uuid,p_revision bigint,p_request text,p_operation text,p_data jsonb,p_result jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare current_revision bigint; member_role text; prior jsonb; result jsonb;
begin
 if not public.daya_cloud_session_active(p_uid,p_session) then raise exception 'DAYA_UNAUTHORIZED'; end if;
 -- Se comprueban permisos vigentes dentro de la misma transacción.
 select rol into member_role from public.daya_cloud_members where id=p_uid and activo=true for share;
 if member_role is null then raise exception 'DAYA_UNAUTHORIZED'; end if;
 if member_role<>'d' and p_operation not in ('pay','reminder') then raise exception 'DAYA_FORBIDDEN'; end if;
 select revision into current_revision from public.daya_cloud_state where id='main' for update;
 select response into prior from public.daya_cloud_requests where uid=p_uid and request_id=p_request;
 if prior is not null then return prior; end if;
 if current_revision<>p_revision then raise exception 'DAYA_CONFLICT'; end if;
 if p_operation='sample' and (jsonb_array_length(coalesce((select data->'daya_productos' from public.daya_cloud_state where id='main'),'[]'::jsonb))>0 or jsonb_array_length(coalesce((select data->'daya_ventas' from public.daya_cloud_state where id='main'),'[]'::jsonb))>0) then raise exception 'DAYA_CONFLICT'; end if;
 if p_operation='import' then
   insert into public.daya_cloud_snapshots(data) select data from public.daya_cloud_state where id='main';
   delete from public.daya_cloud_requests;
   delete from public.daya_cloud_snapshots where id not in(select id from public.daya_cloud_snapshots order by id desc limit 20);
 end if;
 update public.daya_cloud_state set data=p_data,revision=revision+1,sample=case when p_operation='sample' then true when p_operation='import' then false else sample end,updated_at=now() where id='main';
 result=jsonb_build_object('ok',true,'revision',current_revision+1,'result',p_result);
 insert into public.daya_cloud_requests(uid,request_id,response) values(p_uid,p_request,result);
 delete from public.daya_cloud_requests where created_at<now()-interval '7 days';
 return result;
end $$;
revoke all on function public.daya_cloud_commit(uuid,uuid,bigint,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.daya_cloud_commit(uuid,uuid,bigint,text,text,jsonb,jsonb) to service_role;
create function public.daya_cloud_toggle(p_actor uuid,p_session uuid,p_target uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare target public.daya_cloud_members;
begin
 perform pg_advisory_xact_lock(hashtext('daya-team'));
 if not public.daya_cloud_session_active(p_actor,p_session) then raise exception 'DAYA_UNAUTHORIZED'; end if;
 if not exists(select 1 from public.daya_cloud_members where id=p_actor and activo and rol='d') then raise exception 'DAYA_FORBIDDEN'; end if;
 if p_target=p_actor then raise exception 'No puedes desactivar tu propia cuenta.'; end if;
 select * into target from public.daya_cloud_members where id=p_target for update;
 if target.id is null then raise exception 'Cuenta no encontrada.'; end if;
 if target.rol='d' and target.activo and (select count(*) from public.daya_cloud_members where activo and rol='d')<2 then raise exception 'Conserva al menos una dueña activa.'; end if;
 update public.daya_cloud_members set activo=not activo where id=p_target;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.daya_cloud_toggle(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.daya_cloud_toggle(uuid,uuid,uuid) to service_role;
create function public.daya_cloud_add_member(p_actor uuid,p_session uuid,p_id uuid,p_nombre text,p_email text,p_rol text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 perform pg_advisory_xact_lock(hashtext('daya-team'));
 if not public.daya_cloud_session_active(p_actor,p_session) then raise exception 'DAYA_UNAUTHORIZED'; end if;
 if not exists(select 1 from public.daya_cloud_members where id=p_actor and activo and rol='d') then raise exception 'DAYA_FORBIDDEN'; end if;
 insert into public.daya_cloud_members(id,nombre,email,rol) values(p_id,p_nombre,p_email,p_rol);
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.daya_cloud_add_member(uuid,uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.daya_cloud_add_member(uuid,uuid,uuid,text,text,text) to service_role;
