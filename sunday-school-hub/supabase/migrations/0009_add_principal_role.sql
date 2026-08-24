-- =========================================================
-- Adds 'principal' as a role, with the same permission tier as 'admin'
-- (see 0010 for where that equivalence is actually implemented).
--
-- This has to be its own migration, run on its own: Postgres doesn't allow
-- a newly-added enum value to be *used* (in a function body, a query, etc.)
-- within the same transaction it was added in. Run this file by itself
-- first, then run 0010 separately afterward.
-- =========================================================

alter type user_role add value 'principal';
