export type UserRole = "parent" | "teacher" | "admin" | "principal";
export type StudentStatus = "active" | "waitlisted" | "inactive";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type HomeworkColumn = "assigned" | "in_progress" | "submitted" | "graded";
export type AnnouncementAudience = "all" | "class" | "student";
export type FeeCategory = "general" | "books" | "supplies" | "other";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  must_change_password: boolean;
  created_at: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  description: string | null;
  teacher_id: string | null;
  capacity: number;
  color: string;
  age_range: string | null;
  active: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  allergies: string | null;
  medical_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  photo_release: boolean;
  photo_url: string | null;
  status: StudentStatus;
  enrolled_at: string;
  notes: string | null;
  /** Every class this student is currently enrolled in — a student can belong to more than one. */
  classes?: { id: string; name: string; color: string }[];
}

export interface StudentClass {
  id: string;
  student_id: string;
  class_id: string;
  enrolled_at: string;
}

export interface ClassSession {
  id: string;
  class_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  topic: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  notes: string | null;
  marked_by: string | null;
  marked_at: string;
}

export interface Homework {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  resource_url: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  board_column: HomeworkColumn;
  created_by: string | null;
  created_at: string;
}

export interface HomeworkStatus {
  id: string;
  homework_id: string;
  student_id: string;
  completed: boolean;
  feedback: string | null;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  color: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  awarded_by: string | null;
  awarded_at: string;
  badge?: Badge;
}

export interface ProgressNote {
  id: string;
  student_id: string;
  teacher_id: string | null;
  category: string;
  note: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  teacher_id: string | null;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  class_id: string | null;
  student_id: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  pinned: boolean;
  created_at: string;
}

export interface FeeStructure {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  category: FeeCategory;
  due_date: string | null;
  active: boolean;
  is_default_registration: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string | null;
  parent_id: string;
  fee_structure_id: string | null;
  amount: number;
  square_payment_id: string | null;
  square_receipt_url: string | null;
  status: PaymentStatus;
  created_at: string;
}
