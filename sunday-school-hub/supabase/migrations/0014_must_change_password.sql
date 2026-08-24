-- =========================================================
-- Supports admin-created staff accounts with a temporary password instead
-- of an email invite link. When true, the app forces the person to a
-- "set your password" screen the moment they log in, before they can
-- reach anything else — regardless of role. Defaults false for everyone
-- else (normal family signups, and anyone who already set their own
-- password via an email link).
-- =========================================================

alter table profiles add column must_change_password boolean not null default false;
