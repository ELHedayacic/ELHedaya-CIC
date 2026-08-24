-- =========================================================
-- Security fix: previously, any teacher could update ANY
-- profile row (including their own role -> 'admin') because
-- the update policy used the broad is_staff() check. This
-- tightens things so:
--   - anyone can update their own name/phone/avatar
--   - only admins can change a `role` value, on any row
-- =========================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Silently keeps `role` unchanged on any update made by a non-admin,
-- even on their own row, instead of trusting RLS alone to catch it.
create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role on profiles;
create trigger guard_profile_role
  before update on profiles
  for each row execute function public.prevent_self_role_escalation();

drop policy if exists "profiles_update_own_or_staff" on profiles;

create policy "profiles_update_own_or_admin" on profiles for update
  using (id = auth.uid() or is_admin());
