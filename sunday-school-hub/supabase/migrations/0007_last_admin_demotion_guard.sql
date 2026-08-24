-- =========================================================
-- The delete-staff Edge Function already refuses to remove the last
-- remaining admin. This closes the equivalent gap for demotion: nothing
-- was stopping the last admin's role from being changed away from 'admin'
-- (the UI disables editing your own row, but that's only a client-side
-- convenience — the database itself would have allowed it via a direct
-- API call). This enforces it at the database level instead, so it can't
-- be bypassed regardless of how the change is attempted.
-- =========================================================

create or replace function public.prevent_last_admin_demotion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_admins int;
begin
  if old.role = 'admin' and new.role is distinct from 'admin' then
    select count(*) into remaining_admins
    from profiles
    where role = 'admin' and id <> old.id;

    if remaining_admins = 0 then
      raise exception 'Cannot demote the last remaining admin. Promote another account to admin first.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_last_admin on profiles;
create trigger guard_last_admin
  before update on profiles
  for each row execute function public.prevent_last_admin_demotion();
