-- =========================================================
-- Student photos — unlike homework attachments, this bucket is PRIVATE.
-- Photos of children get scoped access: a student's own parent, or staff,
-- can view/manage it — nobody else, and never via a bare public URL.
--
-- Files are stored at `{student_id}/{filename}`; policies below extract
-- the student_id from the object path with storage.foldername() and check
-- it against the students table, the same pattern used elsewhere in this
-- schema for row-level access.
--
-- `students.photo_url` (already existed) stores the storage *path* for
-- this bucket, not a public URL — the app resolves it to a viewable image
-- on demand via a short-lived signed URL, since the bucket has no public
-- endpoint at all.
-- =========================================================

insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', false)
on conflict (id) do nothing;

create policy "student_photos_select" on storage.objects for select
  using (
    bucket_id = 'student-photos'
    and (
      is_staff()
      or exists (
        select 1 from students s
        where s.id::text = (storage.foldername(name))[1]
        and s.parent_id = auth.uid()
      )
    )
  );

create policy "student_photos_insert" on storage.objects for insert
  with check (
    bucket_id = 'student-photos'
    and (
      is_staff()
      or exists (
        select 1 from students s
        where s.id::text = (storage.foldername(name))[1]
        and s.parent_id = auth.uid()
      )
    )
  );

create policy "student_photos_delete" on storage.objects for delete
  using (
    bucket_id = 'student-photos'
    and (
      is_staff()
      or exists (
        select 1 from students s
        where s.id::text = (storage.foldername(name))[1]
        and s.parent_id = auth.uid()
      )
    )
  );
