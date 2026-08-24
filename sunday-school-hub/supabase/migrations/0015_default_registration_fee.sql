-- =========================================================
-- Lets an admin mark exactly one fee structure as "the default
-- registration fee" — the one shown to a parent immediately after they
-- register a child. The partial unique index enforces at most one at the
-- database level, not just as an application-level convention.
-- =========================================================

alter table fee_structures add column is_default_registration boolean not null default false;

create unique index fee_structures_one_default_registration
  on fee_structures (is_default_registration)
  where is_default_registration;
