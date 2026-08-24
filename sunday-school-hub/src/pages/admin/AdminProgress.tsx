import { useEffect, useState } from "react";
import { ClipboardCheck, Award, MessageCirclePlus, Check } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Pill } from "@/components/ui/Pill";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useClasses } from "@/hooks/useClasses";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn, formatDate } from "@/lib/utils";
import type { Student, ClassSession, AttendanceStatus, Badge, StudentBadge, ProgressNote } from "@/types";

const statusOptions: { value: AttendanceStatus; label: string; tone: "grow" | "coral" | "amber" | "neutral" }[] = [
  { value: "present", label: "Present", tone: "grow" },
  { value: "late", label: "Late", tone: "amber" },
  { value: "excused", label: "Excused", tone: "neutral" },
  { value: "absent", label: "Absent", tone: "coral" },
];

export default function AdminProgress() {
  const { classes } = useClasses();
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (classes.length && !classId) setClassId(classes[0].id);
  }, [classes, classId]);

  useEffect(() => {
    async function load() {
      if (!classId) return;
      const { data } = await supabase
        .from("student_classes")
        .select("students(*)")
        .eq("class_id", classId);
      const roster = (data ?? [])
        .map((sc: any) => sc.students)
        .filter(Boolean)
        .sort((a: any, b: any) => a.first_name.localeCompare(b.first_name));
      setStudents(roster);
    }
    load();
  }, [classId]);

  return (
    <div>
      <PageHeader eyebrow="Growth" title="Progress" description="Take attendance, log notes, and award badges." />

      <div className="mb-6 w-full sm:w-64">
        <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Select a class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {!classId && <EmptyState icon={ClipboardCheck} title="Select a class" description="Choose a class to take attendance or add notes." />}

      {classId && (
        <Tabs defaultValue="attendance">
          <TabsList>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="notes">Notes & badges</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="mt-6">
            <AttendanceTab classId={classId} students={students} />
          </TabsContent>
          <TabsContent value="notes" className="mt-6">
            <NotesTab students={students} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function AttendanceTab({ classId, students }: { classId: string; students: Student[] }) {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("class_sessions").select("*").eq("class_id", classId).order("session_date", { ascending: false });
      setSessions(data ?? []);
      if (data && data.length) setSessionId(data[0].id);
    }
    if (classId) load();
  }, [classId]);

  useEffect(() => {
    async function loadAttendance() {
      if (!sessionId) return;
      const { data } = await supabase.from("attendance").select("*").eq("session_id", sessionId);
      const map: Record<string, AttendanceStatus> = {};
      (data ?? []).forEach((a) => (map[a.student_id] = a.status));
      setMarks(map);
    }
    loadAttendance();
  }, [sessionId]);

  async function saveAttendance() {
    setSaving(true);
    const rows = students.map((s) => ({
      session_id: sessionId,
      student_id: s.id,
      status: marks[s.id] ?? "present",
    }));
    await supabase.from("attendance").upsert(rows, { onConflict: "session_id,student_id" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (sessions.length === 0) {
    return <EmptyState icon={ClipboardCheck} title="No sessions scheduled" description="Add a session for this class from the Schedule page first." />;
  }

  return (
    <Card>
      <CardBody>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="sm:w-72">
            <Select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDate(s.session_date)} {s.topic ? `· ${s.topic}` : ""}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-grow-500">
                <Check className="h-4 w-4" /> Saved
              </span>
            )}
            <Button onClick={saveAttendance} loading={saving} disabled={students.length === 0}>
              Save attendance
            </Button>
          </div>
        </div>

        {students.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No students in this class" />
        ) : (
          <div className="space-y-2">
            {students.map((s) => (
              <div key={s.id} className="flex flex-col gap-3 rounded-xl border border-black/5 bg-black/[0.02] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={`${s.first_name} ${s.last_name}`} photoPath={s.photo_url} size="sm" />
                  <p className="text-sm font-medium text-twilight-50">
                    {s.first_name} {s.last_name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setMarks((m) => ({ ...m, [s.id]: opt.value }))}
                      className={cn(
                        "pill border transition-all",
                        marks[s.id] === opt.value
                          ? {
                              grow: "border-grow-500 bg-grow-500/20 text-grow-600",
                              coral: "border-coral-500 bg-coral-500/20 text-coral-700",
                              amber: "border-amber-500 bg-amber-500/20 text-amber-700",
                              neutral: "border-black/40 bg-black/10 text-twilight-50",
                            }[opt.tone]
                          : "border-black/10 bg-transparent text-twilight-200 hover:bg-black/5"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function NotesTab({ students }: { students: Student[] }) {
  const { profile } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [studentBadges, setStudentBadges] = useState<StudentBadge[]>([]);
  const [notes, setNotes] = useState<ProgressNote[]>([]);
  const [noteTarget, setNoteTarget] = useState<Student | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteCategory, setNoteCategory] = useState("general");
  const [saving, setSaving] = useState(false);

  async function loadExtras() {
    const studentIds = students.map((s) => s.id);
    const { data: badgeData } = await supabase.from("badges").select("*");
    setBadges(badgeData ?? []);
    if (studentIds.length) {
      const { data: sb } = await supabase.from("student_badges").select("*, badge:badges(*)").in("student_id", studentIds);
      setStudentBadges((sb as StudentBadge[]) ?? []);
      const { data: n } = await supabase.from("progress_notes").select("*").in("student_id", studentIds).order("created_at", { ascending: false });
      setNotes(n ?? []);
    } else {
      setStudentBadges([]);
      setNotes([]);
    }
  }

  useEffect(() => {
    loadExtras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  async function awardBadge(studentId: string, badgeId: string) {
    if (!badgeId) return;
    await supabase.from("student_badges").insert({ student_id: studentId, badge_id: badgeId, awarded_by: profile?.id });
    loadExtras();
  }

  async function saveNote() {
    if (!noteTarget || !noteText.trim()) return;
    setSaving(true);
    await supabase.from("progress_notes").insert({
      student_id: noteTarget.id,
      teacher_id: profile?.id,
      category: noteCategory,
      note: noteText.trim(),
    });
    setSaving(false);
    setNoteTarget(null);
    setNoteText("");
    loadExtras();
  }

  if (students.length === 0) {
    return <EmptyState icon={Award} title="No students in this class" />;
  }

  return (
    <div className="space-y-4">
      {students.map((s) => {
        const earned = studentBadges.filter((b) => b.student_id === s.id);
        const studentNotes = notes.filter((n) => n.student_id === s.id);
        return (
          <Card key={s.id}>
            <CardBody>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={`${s.first_name} ${s.last_name}`} photoPath={s.photo_url} />
                  <p className="text-sm font-semibold text-twilight-50">
                    {s.first_name} {s.last_name}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select className="!py-1.5 !text-xs w-40" onChange={(e) => awardBadge(s.id, e.target.value)} value="">
                    <option value="">Award a badge…</option>
                    {badges.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                  <Button size="sm" variant="secondary" onClick={() => setNoteTarget(s)}>
                    <MessageCirclePlus className="h-3.5 w-3.5" /> Add note
                  </Button>
                </div>
              </div>

              {earned.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {earned.map((b) => (
                    <Pill key={b.id} tone="amber">
                      <Award className="h-3 w-3" /> {b.badge?.name}
                    </Pill>
                  ))}
                </div>
              )}

              {studentNotes.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-black/5 pt-3">
                  {studentNotes.slice(0, 3).map((n) => (
                    <div key={n.id} className="text-xs text-twilight-200">
                      <Pill tone="neutral" className="!py-0 mr-2">
                        {n.category}
                      </Pill>
                      {n.note}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}

      {noteTarget && (
        <Modal open onOpenChange={(o) => !o && setNoteTarget(null)} title={`Add note — ${noteTarget.first_name} ${noteTarget.last_name}`}>
          <div className="space-y-4">
            <div>
              <label className="label-field">Category</label>
              <Select value={noteCategory} onChange={(e) => setNoteCategory(e.target.value)}>
                <option value="general">General</option>
                <option value="academic">Academic</option>
                <option value="behavior">Behavior</option>
                <option value="spiritual">Spiritual growth</option>
                <option value="memorization">Memorization</option>
              </Select>
            </div>
            <div>
              <label className="label-field">Note</label>
              <textarea className="input-field min-h-24" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setNoteTarget(null)}>
                Cancel
              </Button>
              <Button loading={saving} onClick={saveNote} disabled={!noteText.trim()}>
                Save note
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
