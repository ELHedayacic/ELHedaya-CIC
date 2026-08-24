-- =========================================================
-- Fix: the guard trigger from 0003 checked `not is_admin()`
-- without checking whether there was even an authenticated API
-- caller in the first place. That meant it also silently reverted
-- role changes made directly in the SQL Editor (or migrations,
-- or anything else running outside a user's PostgREST session),
-- since auth.uid() is null in those contexts and is_admin() is
-- therefore always false there.
--
-- Direct SQL access already implies full trust — anyone who can
-- run raw SQL against the database could disable this trigger
-- entirely anyway — so this only needs to intervene when a
-- specific *logged-in, non-admin* user is the one making the
-- change through the app/API.
-- =========================================================

create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;
