import { useEffect, useState } from "react";
import { Search, Users, ShieldAlert, Phone, Check } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PhotoPicker } from "@/components/shared/PhotoPicker";
import { useClasses } from "@/hooks/useClasses";
import { supabase } from "@/lib/supabase";
import { age, formatDate } from "@/lib/utils";
import type { Student, Profile } from "@/types";

export default function AdminStudents() {
  const { classes } = useClasses();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [active, setActive] = useState<Student | null>(null);
  const [parent, setParent] = useState<Profile | null>(null);
  const [togglingClassId, setTogglingClassId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("students")
      .select("*, student_classes(classes(id, name, color))")
      .order("first_name");
    setStudents(
      (data ?? []).map((s: any) => ({
        ...s,
        classes: (s.student_classes ?? []).map((sc: any) => sc.classes).filter(Boolean),
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function openStudent(s: Student) {
    setActive(s);
    const { data } = await supabase.from("profiles").select("*").eq("id", s.parent_id).single();
    setParent(data as Profile | null);
  }

  async function toggleClass(studentId: string, classId: string, enroll: boolean) {
    setTogglingClassId(classId);
    if (enroll) {
      await supabase.from("student_classes").insert({ student_id: studentId, class_id: classId });
    } else {
      await supabase.from("student_classes").delete().eq("student_id", studentId).eq("class_id", classId);
    }
    setTogglingClassId(null);

    // Reflect the change immediately in the open modal without waiting on a reload.
    if (active?.id === studentId) {
      setActive((a) => {
        if (!a) return a;
        const cls = classes.find((c) => c.id === classId);
        const nextClasses = enroll
          ? [...(a.classes ?? []), cls].filter(Boolean)
          : (a.classes ?? []).filter((c) => c.id !== classId);
        return { ...a, classes: nextClasses as Student["classes"] };
      });
    }
    load();
  }

  async function updatePhoto(studentId: string, path: string) {
    await supabase.from("students").update({ photo_url: path }).eq("id", studentId);
    setActive((a) => (a ? { ...a, photo_url: path } : a));
    load();
  }

  const filtered = students.filter((s) => {
    const matchesSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase());
    const enrolledIds = (s.classes ?? []).map((c) => c.id);
    const matchesClass =
      classFilter === "all" ||
      enrolledIds.includes(classFilter) ||
      (classFilter === "unassigned" && enrolledIds.length === 0);
    return matchesSearch && matchesClass;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Roster"
        title="Students"
        description="Every registered child, across all classes. A child can be enrolled in more than one class."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-twilight-200" />
          <input
            className="input-field pl-10"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sm:w-56">
          <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="all">All classes</option>
            <option value="unassigned">Unassigned</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!loading && filtered.length === 0 && (
        <EmptyState icon={Users} title="No students found" description="Try a different search or filter." />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <Card key={s.id} className="cursor-pointer transition-transform hover:-translate-y-0.5" onClick={() => openStudent(s)}>
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={`${s.first_name} ${s.last_name}`} photoPath={s.photo_url} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-twilight-50">
                    {s.first_name} {s.last_name}
                  </p>
                  <p className="text-xs text-twilight-200">Age {age(s.date_of_birth)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {s.classes && s.classes.length > 0 ? (
                  s.classes.map((c) => (
                    <Pill key={c.id} tone="aurora">
                      {c.name}
                    </Pill>
                  ))
                ) : (
                  <Pill tone="amber">Unassigned</Pill>
                )}
                {s.allergies && (
                  <Pill tone="coral">
                    <ShieldAlert className="h-3 w-3" /> Allergy
                  </Pill>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {active && (
        <Modal open onOpenChange={(o) => !o && setActive(null)} title={`${active.first_name} ${active.last_name}`} maxWidth="max-w-xl">
          <div className="space-y-5">
            <PhotoPicker studentId={active.id} currentPath={active.photo_url} onUploaded={(path) => updatePhoto(active.id, path)} />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-twilight-200">Date of birth</p>
                <p className="mt-1 text-twilight-50">{formatDate(active.date_of_birth)} (age {age(active.date_of_birth)})</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-twilight-200">Status</p>
                <Pill tone={active.status === "active" ? "grow" : "neutral"} className="mt-1">
                  {active.status}
                </Pill>
              </div>
            </div>

            <div>
              <label className="label-field">Classes</label>
              {classes.length === 0 ? (
                <p className="text-sm text-twilight-200">Create a class first, then enroll students in it here.</p>
              ) : (
                <div className="space-y-1.5">
                  {classes.map((c) => {
                    const enrolled = (active.classes ?? []).some((ac) => ac.id === c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center justify-between rounded-xl border border-black/10 bg-black/[0.02] px-3.5 py-2.5 hover:bg-black/[0.05]"
                      >
                        <span className="flex items-center gap-2 text-sm text-twilight-50">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </span>
                        <span className="flex h-5 w-5 items-center justify-center rounded-md border border-black/20">
                          {togglingClassId === c.id ? (
                            <span className="h-3 w-3 animate-pulse rounded-full bg-twilight-200" />
                          ) : (
                            enrolled && <Check className="h-3.5 w-3.5 text-aurora-600" />
                          )}
                        </span>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={enrolled}
                          onChange={(e) => toggleClass(active.id, c.id, e.target.checked)}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {active.allergies && (
              <div className="rounded-xl border border-coral-500/30 bg-coral-500/10 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-coral-700">
                  <ShieldAlert className="h-3.5 w-3.5" /> Allergies
                </p>
                <p className="mt-1 text-sm text-twilight-100">{active.allergies}</p>
              </div>
            )}

            {active.medical_notes && (
              <div>
                <p className="label-field">Medical notes</p>
                <p className="text-sm text-twilight-200">{active.medical_notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-twilight-200">Emergency contact</p>
                <p className="mt-1 text-twilight-50">{active.emergency_contact_name || "—"}</p>
                <p className="flex items-center gap-1 text-xs text-twilight-200">
                  <Phone className="h-3 w-3" /> {active.emergency_contact_phone || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-twilight-200">Parent / guardian</p>
                <p className="mt-1 text-twilight-50">{parent?.full_name ?? "—"}</p>
                <p className="text-xs text-twilight-200">{parent?.phone ?? ""}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setActive(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
