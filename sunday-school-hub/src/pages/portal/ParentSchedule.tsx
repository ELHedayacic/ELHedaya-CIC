import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pill } from "@/components/ui/Pill";
import { useMyStudents } from "@/hooks/useMyStudents";
import { supabase } from "@/lib/supabase";
import { formatDate, formatTime } from "@/lib/utils";
import type { ClassSession } from "@/types";

interface SessionWithClass extends ClassSession {
  class_name?: string;
  class_color?: string;
}

export default function ParentSchedule() {
  const { students, loading: studentsLoading } = useMyStudents();
  const [sessions, setSessions] = useState<SessionWithClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const classIds = [...new Set(students.flatMap((s) => (s.classes ?? []).map((c) => c.id)))];
      if (classIds.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("class_sessions")
        .select("*, classes(name, color)")
        .in("class_id", classIds)
        .gte("session_date", new Date().toISOString().slice(0, 10))
        .order("session_date", { ascending: true });

      setSessions(
        (data ?? []).map((s: any) => ({ ...s, class_name: s.classes?.name, class_color: s.classes?.color }))
      );
      setLoading(false);
    }
    if (!studentsLoading) load();
  }, [students, studentsLoading]);

  return (
    <div>
      <PageHeader eyebrow="Calendar" title="Schedule" description="Upcoming sessions for your children's classes." />

      {!loading && sessions.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="No upcoming sessions"
          description="Once your child is placed in a class, sessions will appear here."
        />
      )}

      <div className="space-y-3">
        {sessions.map((s) => (
          <Card key={s.id}>
            <CardBody className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <div className="flex w-16 flex-col items-center justify-center rounded-xl border border-black/10 bg-black/[0.02] py-2 font-mono">
                  <span className="text-[11px] uppercase text-twilight-200">
                    {new Date(`${s.session_date}T00:00:00`).toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className="text-lg font-semibold text-twilight-50">
                    {new Date(`${s.session_date}T00:00:00`).getDate()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-twilight-50">{s.topic ?? "Class session"}</p>
                    {s.class_name && <Pill tone="aurora">{s.class_name}</Pill>}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-twilight-200">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(s.start_time)} – {formatTime(s.end_time)}
                    </span>
                    {s.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {s.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="font-mono text-xs text-twilight-200">{formatDate(s.session_date, { weekday: "long" })}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
