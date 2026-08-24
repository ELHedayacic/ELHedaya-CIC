-- =========================================================
-- Little Lights Sunday School Hub — Initial Schema
-- =========================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type user_role as enum ('parent', 'teacher', 'admin');
create type student_status as enum ('active', 'waitlisted', 'inactive');
create type attendance_status as enum ('present', 'absent', 'late', 'excused');
create type homework_column as enum ('assigned', 'in_progress', 'submitted', 'graded');
create type announcement_audience as enum ('all', 'class', 'student');
create type fee_category as enum ('registration', 'term', 'event', 'materials');
create type payment_status as enum ('pending', 'completed', 'failed', 'refunded');

-- ---------- profiles (extends auth.users) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'parent',
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------- classes ----------
create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  teacher_id uuid references profiles(id) on delete set null,
  capacity int not null default 20,
  color text not null default '#7C6CF2',
  age_range text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- students ----------
create table students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  gender text,
  allergies text,
  medical_notes text,
  emergency_contact_name text,
  emergency_contact_phone text,
  photo_release boolean not null default false,
  photo_url text,
  status student_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  notes text
);

-- ---------- class_sessions (calendar occurrences) ----------
create table class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  location text,
  topic text,
  created_at timestamptz not null default now()
);

-- ---------- attendance ----------
create table attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references class_sessions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status attendance_status not null default 'present',
  notes text,
  marked_by uuid references profiles(id),
  marked_at timestamptz not null default now(),
  unique (session_id, student_id)
);

-- ---------- homework ----------
create table homework (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  resource_url text,
  board_column homework_column not null default 'assigned',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- homework_status (per-student completion) ----------
create table homework_status (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references homework(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  completed boolean not null default false,
  feedback text,
  updated_at timestamptz not null default now(),
  unique (homework_id, student_id)
);

-- ---------- badges ----------
create table badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default 'star',
  description text,
  color text not null default '#F5B942'
);

create table student_badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  awarded_by uuid references profiles(id),
  awarded_at timestamptz not null default now(),
  unique (student_id, badge_id)
);

-- ---------- progress_notes ----------
create table progress_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  teacher_id uuid references profiles(id),
  category text not null default 'general',
  note text not null,
  created_at timestamptz not null default now()
);

-- ---------- announcements (in-portal messaging, replaces email) ----------
create table announcements (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references profiles(id),
  title text not null,
  body text not null,
  audience announcement_audience not null default 'all',
  class_id uuid references classes(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table announcement_reads (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references announcements(id) on delete cascade,
  parent_id uuid not null references profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (announcement_id, parent_id)
);

-- ---------- fee_structures ----------
create table fee_structures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  amount numeric(10,2) not null,
  category fee_category not null default 'term',
  due_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- payments ----------
create table payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete set null,
  parent_id uuid not null references profiles(id) on delete cascade,
  fee_structure_id uuid references fee_structures(id) on delete set null,
  amount numeric(10,2) not null,
  square_payment_id text,
  square_receipt_url text,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table profiles enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table class_sessions enable row level security;
alter table attendance enable row level security;
alter table homework enable row level security;
alter table homework_status enable row level security;
alter table badges enable row level security;
alter table student_badges enable row level security;
alter table progress_notes enable row level security;
alter table announcements enable row level security;
alter table announcement_reads enable row level security;
alter table fee_structures enable row level security;
alter table payments enable row level security;

-- Helper: is the current user staff (teacher/admin)?
create or replace function is_staff()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('teacher', 'admin')
  );
$$;

-- profiles
create policy "profiles_select_own_or_staff" on profiles for select
  using (id = auth.uid() or is_staff());
create policy "profiles_insert_own" on profiles for insert
  with check (id = auth.uid());
create policy "profiles_update_own_or_staff" on profiles for update
  using (id = auth.uid() or is_staff());

-- classes
create policy "classes_select_all_auth" on classes for select
  using (auth.uid() is not null);
create policy "classes_write_staff" on classes for all
  using (is_staff()) with check (is_staff());

-- students
create policy "students_select_own_or_staff" on students for select
  using (parent_id = auth.uid() or is_staff());
create policy "students_insert_own_or_staff" on students for insert
  with check (parent_id = auth.uid() or is_staff());
create policy "students_update_own_or_staff" on students for update
  using (parent_id = auth.uid() or is_staff());
create policy "students_delete_staff" on students for delete
  using (is_staff());

-- class_sessions
create policy "sessions_select_all_auth" on class_sessions for select
  using (auth.uid() is not null);
create policy "sessions_write_staff" on class_sessions for all
  using (is_staff()) with check (is_staff());

-- attendance
create policy "attendance_select_own_or_staff" on attendance for select
  using (is_staff() or exists (select 1 from students s where s.id = student_id and s.parent_id = auth.uid()));
create policy "attendance_write_staff" on attendance for all
  using (is_staff()) with check (is_staff());

-- homework
create policy "homework_select_all_auth" on homework for select
  using (auth.uid() is not null);
create policy "homework_write_staff" on homework for all
  using (is_staff()) with check (is_staff());

-- homework_status
create policy "hwstatus_select_own_or_staff" on homework_status for select
  using (is_staff() or exists (select 1 from students s where s.id = student_id and s.parent_id = auth.uid()));
create policy "hwstatus_write_staff" on homework_status for all
  using (is_staff()) with check (is_staff());

-- badges
create policy "badges_select_all_auth" on badges for select
  using (auth.uid() is not null);
create policy "badges_write_staff" on badges for all
  using (is_staff()) with check (is_staff());

-- student_badges
create policy "sbadges_select_own_or_staff" on student_badges for select
  using (is_staff() or exists (select 1 from students s where s.id = student_id and s.parent_id = auth.uid()));
create policy "sbadges_write_staff" on student_badges for all
  using (is_staff()) with check (is_staff());

-- progress_notes
create policy "notes_select_own_or_staff" on progress_notes for select
  using (is_staff() or exists (select 1 from students s where s.id = student_id and s.parent_id = auth.uid()));
create policy "notes_write_staff" on progress_notes for all
  using (is_staff()) with check (is_staff());

-- announcements
create policy "announcements_select_relevant" on announcements for select
  using (
    is_staff()
    or audience = 'all'
    or (audience = 'class' and exists (select 1 from students s where s.parent_id = auth.uid() and s.class_id = announcements.class_id))
    or (audience = 'student' and exists (select 1 from students s where s.parent_id = auth.uid() and s.id = announcements.student_id))
  );
create policy "announcements_write_staff" on announcements for all
  using (is_staff()) with check (is_staff());

-- announcement_reads
create policy "reads_own" on announcement_reads for select using (parent_id = auth.uid() or is_staff());
create policy "reads_insert_own" on announcement_reads for insert with check (parent_id = auth.uid());

-- fee_structures
create policy "fees_select_all_auth" on fee_structures for select
  using (auth.uid() is not null);
create policy "fees_write_staff" on fee_structures for all
  using (is_staff()) with check (is_staff());

-- payments
create policy "payments_select_own_or_staff" on payments for select
  using (parent_id = auth.uid() or is_staff());
create policy "payments_insert_own" on payments for insert
  with check (parent_id = auth.uid());
create policy "payments_update_staff" on payments for update
  using (is_staff());

-- =========================================================
-- Convenience view: parent dashboard summary
-- =========================================================
create view parent_students as
  select s.*, c.name as class_name, c.color as class_color, c.teacher_id
  from students s
  left join classes c on c.id = s.class_id;

-- Seed a few starter badges
insert into badges (name, icon, description, color) values
  ('Perfect Attendance', 'calendar-check', 'Attended every session this term', '#34D399'),
  ('Memory Verse Master', 'book-open', 'Memorized the term''s key verses', '#F5B942'),
  ('Kind Heart', 'heart', 'Showed exceptional kindness to classmates', '#F2765C'),
  ('Star Student', 'star', 'Outstanding participation and effort', '#7C6CF2');
