import { useEffect, useState } from "react";
import { BookOpen, Link2, Paperclip, CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pill } from "@/components/ui/Pill";
import { useMyStudents } from "@/hooks/useMyStudents";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type { Homework, HomeworkStatus } from "@/types";

const columnLabel: Record<string, { label: string; tone: "neutral" | "aurora" | "amber" | "grow" }> = {
  assigned: { label: "Assigned", tone: "neutral" },
  in_progress: { label: "In progress", tone: "aurora" },
  submitted: { label: "Submitted", tone: "amber" },
  graded: { label: "Graded", tone: "grow" },
};

export default function ParentHomework() {
  const { students, loading: studentsLoading } = useMyStudents();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [statuses, setStatuses] = useState<HomeworkStatus[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const classIds = [...new Set(students.flatMap((s) => (s.classes ?? []).map((c) => c.id)))];
    if (classIds.length === 0) {
      setHomework([]);
      setLoading(false);
      return;
    }
    const { data: hw } = await supabase
      .from("homework")
      .select("*")
      .in("class_id", classIds)
      .order("due_date", { ascending: true });
    setHomework(hw ?? []);

    const studentIds = students.map((s) => s.id);
    if (hw && hw.length && studentIds.length) {
      const { data: st } = await supabase
        .from("homework_status")
        .select("*")
        .in("student_id", studentIds)
        .in(
          "homework_id",
          hw.map((h) => h.id)
        );
      setStatuses(st ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!studentsLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, studentsLoading]);

  async function toggleComplete(homeworkId: string, studentId: string, current: boolean) {
    const existing = statuses.find((s) => s.homework_id === homeworkId && s.student_id === studentId);
    if (existing) {
      await supabase.from("homework_status").update({ completed: !current }).eq("id", existing.id);
    } else {
      await supabase.from("homework_status").insert({ homework_id: homeworkId, student_id: studentId, completed: true });
    }
    load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Lessons"
        title="Homework"
        description="Assignments from your children's classes. Check items off as they're completed at home."
      />

      {!loading && homework.length === 0 && (
        <EmptyState icon={BookOpen} title="No homework yet" description="New assignments will show up here." />
      )}

      <div className="space-y-5">
        {homework.map((h) => (
          <Card key={h.id}>
            <CardHeader>
              <div>
                <CardTitle>{h.title}</CardTitle>
                {h.due_date && <p className="mt-1 text-xs text-twilight-200">Due {formatDate(h.due_date)}</p>}
              </div>
              <Pill tone={columnLabel[h.board_column].tone}>{columnLabel[h.board_column].label}</Pill>
            </CardHeader>
            <CardBody>
              {h.description && <p className="mb-4 text-sm text-twilight-200">{h.description}</p>}
              <div className="mb-4 flex flex-wrap gap-2">
                {h.attachment_url && (
                  <a
                    href={h.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-black/[0.06]"
                  >
                    <Paperclip className="h-3.5 w-3.5" /> {h.attachment_name ?? "Download worksheet"}
                  </a>
                )}
                {h.resource_url && (
                  <a
                    href={h.resource_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-aurora-600 hover:text-aurora-700"
                  >
                    <Link2 className="h-3.5 w-3.5" /> View resource
                  </a>
                )}
              </div>
              <div className="space-y-2 border-t border-black/5 pt-4">
                {students
                  .filter((s) => (s.classes ?? []).some((c) => c.id === h.class_id))
                  .map((s) => {
                    const status = statuses.find((st) => st.homework_id === h.id && st.student_id === s.id);
                    const completed = status?.completed ?? false;
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleComplete(h.id, s.id, completed)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-black/5"
                      >
                        {completed ? (
                          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-grow-500" />
                        ) : (
                          <Circle className="h-4.5 w-4.5 shrink-0 text-twilight-200" />
                        )}
                        <span className={completed ? "text-sm text-twilight-200 line-through" : "text-sm text-twilight-50"}>
                          {s.first_name} {s.last_name}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
