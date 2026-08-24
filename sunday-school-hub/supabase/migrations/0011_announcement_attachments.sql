-- =========================================================
-- Lets staff pin a flyer/PDF/image to an announcement on the message
-- board. Reuses the existing `homework-attachments` bucket and its RLS
-- policies (staff can upload/delete, anyone signed in can view) — the
-- access pattern is identical, so no new bucket or policies are needed,
-- just these two columns.
-- =========================================================

alter table announcements add column if not exists attachment_url text;
alter table announcements add column if not exists attachment_name text;
