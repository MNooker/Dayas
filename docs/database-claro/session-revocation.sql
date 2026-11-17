alter table public.daya_cloud_members add column sessions_valid_after timestamptz not null default '-infinity';
create or replace function public.daya_cloud_session_active(p_uid uuid,p_session uuid)
returns boolean language sql stable security invoker set search_path=public,pg_temp as $$
 select exists(
  select 1 from auth.sessions s left join public.daya_cloud_members m on m.id=s.user_id
  where s.id=p_session and s.user_id=p_uid and (s.not_after is null or s.not_after>now())
    and (m.id is null or (m.activo and s.created_at>=m.sessions_valid_after))
 );
$$;
create or replace function public.daya_cloud_toggle(p_actor uuid,p_session uuid,p_target uuid)
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
 update public.daya_cloud_members set activo=not activo,sessions_valid_after=case when activo then now() else sessions_valid_after end where id=p_target;
 return jsonb_build_object('ok',true);
end $$;
