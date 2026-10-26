-- Tester feedback: anyone can submit, nobody can read through the API.
-- Read results in the Supabase dashboard (Table Editor → feedback → Export CSV).
create table public.feedback (
  id text primary key check (char_length(id) between 8 and 64),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  rating text not null check (rating in ('spot-on', 'close', 'off')),
  would_try text not null default '' check (char_length(would_try) <= 80),
  note text not null default '' check (char_length(note) <= 1000),
  lang text not null default 'en' check (char_length(lang) <= 8),
  profile jsonb not null default '{}'::jsonb check (pg_column_size(profile) <= 4096),
  top jsonb not null default '[]'::jsonb check (pg_column_size(top) <= 2048),
  app_version text not null default '' check (char_length(app_version) <= 32)
);

alter table public.feedback enable row level security;

create policy "Anyone can submit feedback"
  on public.feedback
  for insert
  to anon
  with check (true);

-- Insert only. No select/update/delete for public roles.
grant insert on public.feedback to anon;

-- Per-device and global daily counters for the optional AI photo check.
-- Only the foot-check Edge Function (service role) touches this table.
create table public.ai_usage (
  day date not null default current_date,
  device_id text not null check (char_length(device_id) between 8 and 64),
  count integer not null default 0,
  primary key (day, device_id)
);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Atomically bump a device's counter and return (device_count, global_count) for today.
create function public.bump_ai_usage(p_device_id text)
returns table (device_count integer, global_count integer)
language sql
security invoker
set search_path = ''
as $$
  with bumped as (
    insert into public.ai_usage (day, device_id, count)
    values (current_date, p_device_id, 1)
    on conflict (day, device_id) do update set count = public.ai_usage.count + 1
    returning count
  )
  select
    (select count from bumped),
    (select coalesce(sum(u.count), 0)::integer + 1 from public.ai_usage u where u.day = current_date);
$$;

revoke execute on function public.bump_ai_usage(text) from public, anon, authenticated;
grant execute on function public.bump_ai_usage(text) to service_role;
