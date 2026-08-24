-- =========================================================
-- Replaces the fee category set (registration/term/event/materials) with
-- the school's actual categories: General Fee, Books, Supplies, Other.
-- Fees have never been scoped to a class (fee_structures has no class_id
-- column, never has) — they apply globally to every family regardless of
-- which class(es) their children are enrolled in.
-- =========================================================

alter type fee_category rename to fee_category_old;
create type fee_category as enum ('general', 'books', 'supplies', 'other');

alter table fee_structures add column category_new fee_category;

update fee_structures set category_new = case category::text
  when 'registration' then 'general'
  when 'term' then 'general'
  when 'event' then 'other'
  when 'materials' then 'books'
  else 'general'
end::fee_category;

alter table fee_structures drop column category;
alter table fee_structures rename column category_new to category;
alter table fee_structures alter column category set not null;
alter table fee_structures alter column category set default 'general';

drop type fee_category_old;
