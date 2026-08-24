-- =========================================================
-- Homework file attachments (images/PDFs) — teachers can attach a
-- worksheet/handout file to an assignment, separate from the existing
-- `resource_url` text field (which stays for pasting external links).
-- =========================================================

-- Public bucket: reads don't need auth (worksheets aren't sensitive),
-- but writes are locked to staff via the policies below.
insert into storage.buckets (id, name, public)
values ('homework-attachments', 'homework-attachments', true)
on conflict (id) do nothing;

alter table homework add column if not exists attachment_url text;
alter table homework add column if not exists attachment_name text;

create policy "homework_attachments_insert_staff" on storage.objects for insert
  with check (bucket_id = 'homework-attachments' and is_staff());

create policy "homework_attachments_delete_staff" on storage.objects for delete
  using (bucket_id = 'homework-attachments' and is_staff());

create policy "homework_attachments_select_all_auth" on storage.objects for select
  using (bucket_id = 'homework-attachments' and auth.uid() is not null);
