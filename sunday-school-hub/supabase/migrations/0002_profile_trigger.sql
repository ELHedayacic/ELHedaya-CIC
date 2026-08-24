-- =========================================================
-- Fix: create profiles via a trigger on auth.users instead of
-- from the client. The client-side insert could run before a
-- session existed yet (e.g. when "Confirm email" is enabled),
-- which RLS correctly rejected. A trigger runs server-side with
-- elevated rights and isn't subject to that timing issue.
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'parent'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill anyone who signed up before this trigger existed and got
-- stuck without a profile row (this is what caused the RLS error).
insert into public.profiles (id, full_name, role)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)), 'parent'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
