-- =========================================================
-- A student was previously limited to exactly one class via a single
-- `class_id` column. This moves to a proper many-to-many relationship via
-- a junction table, so a student can be enrolled in as many classes as
-- needed. Fee structures were never tied to class enrollment in the first
-- place (see fee_structures/payments — no class_id column exists on
-- either), so enrolling a student in additional classes has never changed
-- and will never change what they owe.
-- =========================================================

create table student_classes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (student_id, class_id)
);

alter table student_classes enable row level security;

create policy "student_classes_select_own_or_staff" on student_classes for select
  using (is_staff() or exists (select 1 from students s where s.id = student_id and s.parent_id = auth.uid()));

create policy "student_classes_write_staff" on student_classes for all
  using (is_staff()) with check (is_staff());

-- Carry forward everyone's existing single-class assignment into the new
-- table before the old column goes away.
insert into student_classes (student_id, class_id)
select id, class_id from students where class_id is not null
on conflict do nothing;

-- This view depended on the column being dropped below and was never
-- actually queried by the app — safe to drop.
drop view if exists parent_students;

-- The announcements RLS policy also referenced students.class_id directly
-- to decide whether a parent can see a class-targeted announcement. Rewrite
-- it against the new junction table before the column goes away, or the
-- drop below fails with a dependency error.
drop policy if exists "announcements_select_relevant" on announcements;

create policy "announcements_select_relevant" on announcements for select
  using (
    is_staff()
    or audience = 'all'
    or (
      audience = 'class'
      and exists (
        select 1 from student_classes sc
        join students s on s.id = sc.student_id
        where s.parent_id = auth.uid() and sc.class_id = announcements.class_id
      )
    )
    or (audience = 'student' and exists (select 1 from students s where s.parent_id = auth.uid() and s.id = announcements.student_id))
  );

alter table students drop column class_id;
