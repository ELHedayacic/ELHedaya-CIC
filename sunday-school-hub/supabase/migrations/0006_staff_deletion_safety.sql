-- =========================================================
-- Prerequisite for staff account deletion: several tables reference
-- profiles(id) to record "who did this" (who marked attendance, created
-- homework, awarded a badge, wrote a note, posted an announcement) with no
-- ON DELETE behavior set, which defaults to Postgres's NO ACTION — meaning
-- deleting a staff account would fail outright the moment they'd ever done
-- any of these things, which in practice is almost immediately for an
-- active teacher.
--
-- This switches those columns to ON DELETE SET NULL: the historical
-- records themselves stay intact (attendance taken, homework assigned,
-- notes written), only the link to the now-deleted account is cleared.
-- =========================================================

alter table attendance drop constraint if exists attendance_marked_by_fkey;
alter table attendance add constraint attendance_marked_by_fkey
  foreign key (marked_by) references profiles(id) on delete set null;

alter table homework drop constraint if exists homework_created_by_fkey;
alter table homework add constraint homework_created_by_fkey
  foreign key (created_by) references profiles(id) on delete set null;

alter table student_badges drop constraint if exists student_badges_awarded_by_fkey;
alter table student_badges add constraint student_badges_awarded_by_fkey
  foreign key (awarded_by) references profiles(id) on delete set null;

alter table progress_notes drop constraint if exists progress_notes_teacher_id_fkey;
alter table progress_notes add constraint progress_notes_teacher_id_fkey
  foreign key (teacher_id) references profiles(id) on delete set null;

alter table announcements drop constraint if exists announcements_teacher_id_fkey;
alter table announcements add constraint announcements_teacher_id_fkey
  foreign key (teacher_id) references profiles(id) on delete set null;
