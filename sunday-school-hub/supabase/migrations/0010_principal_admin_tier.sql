-- =========================================================
-- Treats 'principal' as the same permission tier as 'admin' everywhere
-- access is checked — same rights, just a more accurate title for whoever
-- actually runs the school. Run this AFTER 0009 (separately — see that
-- file for why).
-- =========================================================

-- is_admin() now means "has admin-tier access" (admin or principal). Kept
-- the same function name rather than renaming it everywhere it's
-- referenced across RLS policies and triggers — only the body changed.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('admin', 'principal')
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('teacher', 'admin', 'principal')
  );
$$;

-- Demotion guard, updated for admin-tier: only blocks when the change
-- would leave nobody with admin OR principal access.
create or replace function public.prevent_last_admin_demotion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_admins int;
begin
  if old.role in ('admin', 'principal') and new.role not in ('admin', 'principal') then
    select count(*) into remaining_admins
    from profiles
    where role in ('admin', 'principal') and id <> old.id;

    if remaining_admins = 0 then
      raise exception 'Cannot demote the last remaining admin/principal. Promote another account first.';
    end if;
  end if;
  return new;
end;
$$;

-- New: the delete-staff Edge Function already refuses to delete the last
-- admin-tier account, but that's an application-level check. This adds
-- the same protection at the database level — deleting a profiles row
-- fires a DELETE trigger even when it cascades in from an auth.users
-- deletion, so this closes the gap for any path that isn't the Edge
-- Function, the same way 0007 did for role changes.
create or replace function public.prevent_last_admin_deletion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_admins int;
begin
  if old.role in ('admin', 'principal') then
    select count(*) into remaining_admins
    from profiles
    where role in ('admin', 'principal') and id <> old.id;

    if remaining_admins = 0 then
      raise exception 'Cannot delete the last remaining admin/principal. Promote another account first.';
    end if;
  end if;
  return old;
end;
$$;

drop trigger if exists guard_last_admin_deletion on profiles;
create trigger guard_last_admin_deletion
  before delete on profiles
  for each row execute function public.prevent_last_admin_deletion();
