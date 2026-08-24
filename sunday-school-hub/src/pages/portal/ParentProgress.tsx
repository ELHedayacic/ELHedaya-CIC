import { useEffect, useState } from "react";
import { LineChart, Award, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { useMyStudents } from "@/hooks/useMyStudents";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type { StudentBadge, ProgressNote, Attendance } from "@/types";

export default function ParentProgress() {
  const { students, loading: studentsLoading } = useMyStudents();
  const [badges, setBadges] = useState<StudentBadge[]>([]);
  const [notes, setNotes] = useState<ProgressNote[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const studentIds = students.map((s) => s.id);
      if (studentIds.length === 0) {
        setLoading(false);
        return;
      }

      const [{ data: badgeData }, { data: noteData }, { data: attData }] = await Promise.all([
        supabase.from("student_badges").select("*, badge:badges(*)").in("student_id", studentIds),
        supabase
          .from("progress_notes")
          .select("*")
          .in("student_id", studentIds)
          .order("created_at", { ascending: false }),
        supabase.from("attendance").select("*").in("student_id", studentIds),
      ]);

      setBadges((badgeData as StudentBadge[]) ?? []);
      setNotes(noteData ?? []);
      setAttendance(attData ?? []);
      setLoading(false);
    }
    if (!studentsLoading) load();
  }, [students, studentsLoading]);

  if (!loading && students.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Growth" title="Progress" />
        <EmptyState icon={LineChart} title="No progress to show yet" description="Register a child to get started." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Growth" title="Progress" description="Attendance, badges, and notes from your child's teacher." />

      <div className="space-y-6">
        {students.map((s) => {
          const studentAttendance = attendance.filter((a) => a.student_id === s.id);
          const presentCount = studentAttendance.filter((a) => a.status === "present" || a.status === "late").length;
          const attendanceRate = studentAttendance.length
            ? Math.round((presentCount / studentAttendance.length) * 100)
            : null;
          const studentBadges = badges.filter((b) => b.student_id === s.id);
          const studentNotes = notes.filter((n) => n.student_id === s.id);

          return (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar name={`${s.first_name} ${s.last_name}`} photoPath={s.photo_url} />
                  <div>
                    <CardTitle>
                      {s.first_name} {s.last_name}
                    </CardTitle>
                    {s.classes && s.classes.length > 0 && (
                      <p className="text-xs text-twilight-200">{s.classes.map((c) => c.name).join(", ")}</p>
                    )}
                  </div>
                </div>
                {attendanceRate !== null && (
                  <div className="text-right">
                    <p className="font-display text-2xl font-semibold text-grow-500">{attendanceRate}%</p>
                    <p className="text-[11px] uppercase tracking-wide text-twilight-200">Attendance</p>
                  </div>
                )}
              </CardHeader>
              <CardBody>
                <div className="mb-5">
                  <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-twilight-200">
                    <Award className="h-3.5 w-3.5" /> Badges earned
                  </p>
                  {studentBadges.length === 0 ? (
                    <p className="text-sm text-twilight-200">No badges yet — every session is a chance to earn one!</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {studentBadges.map((b) => (
                        <Pill key={b.id} tone="amber">
                          {b.badge?.name}
                        </Pill>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-twilight-200">
                    <MessageCircle className="h-3.5 w-3.5" /> Teacher notes
                  </p>
                  {studentNotes.length === 0 ? (
                    <p className="text-sm text-twilight-200">No notes yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {studentNotes.slice(0, 4).map((n) => (
                        <div key={n.id} className="rounded-xl border border-black/5 bg-black/[0.02] p-3.5">
                          <div className="flex items-center justify-between">
                            <Pill tone="neutral" className="!py-0.5">
                              {n.category}
                            </Pill>
                            <span className="font-mono text-[11px] text-twilight-200">{formatDate(n.created_at)}</span>
                          </div>
                          <p className="mt-2 text-sm text-twilight-100">{n.note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
