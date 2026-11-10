-- CLI Speed Typing Phase 3 — server-stamped runs and daily bests
-- For dedicated Supabase project zhfkjwduelavepjfacpo ONLY.
-- No browser writes or direct run-session reads. Execute through trusted Vercel APIs.
begin;
create table if not exists private.ranked_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active'
    check(status in ('active','finished','abandoned')),
  step_index integer not null default 0 check(step_index between 0 and 10),
  started_at timestamptz not null default clock_timestamp(),
  last_step_at timestamptz,
  expires_at timestamptz not null default (clock_timestamp()+interval '30 minutes'),
  finished_at timestamptz
);
create index if not exists ranked_sessions_user_started_idx
  on private.ranked_sessions(user_id,started_at desc);
alter table private.ranked_sessions enable row level security;
revoke all on private.ranked_sessions from public, anon, authenticated;
-- Keep the official ranking table read-only to all browser roles.
revoke insert,update,delete on public.ranked_runs from public, anon, authenticated;
grant select,insert,update,delete on public.ranked_runs to service_role;

-- Called only by a trusted server after independently checking the Auth JWT and invite membership.
create or replace function public.start_ranked_run(p_user uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare
  v_id uuid;
begin
  if p_user is null or not exists(
    select 1 from public.invite_members m
      where m.user_id=p_user and m.is_active
  ) then
    raise exception 'not_invited' using errcode='42501';
  end if;
  if (select count(*) from private.ranked_sessions s
      where s.user_id=p_user and s.started_at > clock_timestamp()-interval '1 minute') >= 12 then
    raise exception 'start_rate_limited' using errcode='P0001';
  end if;
  -- New game invalidates old active run IDs; prevents concurrent same-user runs.
  update private.ranked_sessions
    set status='abandoned'
    where user_id=p_user and status='active';
  insert into private.ranked_sessions(user_id) values (p_user)
    returning id into v_id;
  return v_id;
end
$$;
revoke all on function public.start_ranked_run(uuid) from public, anon, authenticated;
grant execute on function public.start_ranked_run(uuid) to service_role;

-- Each accepted command must match the next canonical command exactly.
-- Server, not browser, controls timestamps and the official score.
create or replace function public.submit_ranked_step(
  p_user uuid,p_run uuid,p_step integer,p_command text
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_run private.ranked_sessions%rowtype;
  v_now timestamptz := clock_timestamp();
  v_commands text[] := array[
    'node alpha',
    'route preview --node alpha',
    'link ready',
    'packet trace --path blue',
    'network preview --from alpha --to delta',
    'signal check --zone violet',
    'core ready',
    'topology inspect --layer demo --mode quiet',
    'path select --node beta',
    'network preview --from beta --to gamma'
  ];
  v_day date;
  v_time_ms integer;
  v_best_ms integer;
  v_name text;
  v_written integer;
  v_cumulative_chars integer;
begin
  if p_user is null or p_run is null or p_step is null
     or p_step not between 1 and 10 or p_command is null or length(p_command)>120 then
    raise exception 'invalid_step' using errcode='22023';
  end if;
  if not exists(
    select 1 from public.invite_members m
      where m.user_id=p_user and m.is_active
  ) then
    raise exception 'not_invited' using errcode='42501';
  end if;
  select * into v_run from private.ranked_sessions s
    where s.id=p_run and s.user_id=p_user
    for update;
  if not found or v_run.status <> 'active' or v_now > v_run.expires_at then
    raise exception 'run_inactive_or_missing' using errcode='22023';
  end if;
  if v_run.step_index + 1 <> p_step then
    raise exception 'invalid_sequence' using errcode='22023';
  end if;
  if p_command is distinct from v_commands[p_step] then
    raise exception 'invalid_command' using errcode='22023';
  end if;
  select sum(length(x)) into v_cumulative_chars from unnest(v_commands[1:p_step]) x;
  -- Reject nonsensical machine-speed submissions; does not prevent sophisticated bots.
  if extract(epoch from (v_now-v_run.started_at))*1000
       < greatest(150*p_step,15*v_cumulative_chars) then
    raise exception 'implausibly_fast_step' using errcode='22023';
  end if;
  if p_step < 10 then
    update private.ranked_sessions
      set step_index=p_step,last_step_at=v_now where id=v_run.id;
    return jsonb_build_object('complete',false,'verified_step',p_step);
  end if;
  v_time_ms:=floor(extract(epoch from (v_now-v_run.started_at))*1000)::integer;
  if v_time_ms < 4000 or v_time_ms > 36000000 then
    raise exception 'invalid_elapsed_time' using errcode='22023';
  end if;
  v_day := (v_run.started_at at time zone 'Asia/Seoul')::date;
  select m.display_name into v_name from public.invite_members m
    where m.user_id=p_user and m.is_active;
  -- Transaction covers completion and best update: no partial official rankings.
  update private.ranked_sessions set
    step_index=10,last_step_at=v_now,finished_at=v_now,status='finished'
    where id=v_run.id;
  insert into public.ranked_runs as current_best(
    user_id,display_name,seoul_day,elapsed_ms,command_count,verification_version
  ) values (p_user,v_name,v_day,v_time_ms,10,'server-events-v1')
  on conflict(user_id,seoul_day) do update set
    elapsed_ms=excluded.elapsed_ms,
    display_name=excluded.display_name,
    verification_version=excluded.verification_version,
    created_at=clock_timestamp()
  where excluded.elapsed_ms < current_best.elapsed_ms;
  get diagnostics v_written = row_count;
  select r.elapsed_ms into v_best_ms from public.ranked_runs r
    where r.user_id=p_user and r.seoul_day=v_day;
  return jsonb_build_object(
    'complete',true,'verified_step',10,
    'elapsed_ms',v_time_ms,'best_ms',v_best_ms,
    'seoul_day',v_day,'new_daily_best',v_written=1
  );
end
$$;
revoke all on function public.submit_ranked_step(uuid,uuid,integer,text)
  from public, anon, authenticated;
grant execute on function public.submit_ranked_step(uuid,uuid,integer,text) to service_role;
commit;
