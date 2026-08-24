import { useEffect, useState } from "react";
import { Plus, GraduationCap, Users, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import { useClasses } from "@/hooks/useClasses";
import { useTeachers } from "@/hooks/useTeachers";
import { supabase } from "@/lib/supabase";
import type { SchoolClass } from "@/types";

const colorOptions = [
  { value: "#14966B", label: "Emerald" },
  { value: "#D2A44A", label: "Antique gold" },
  { value: "#2AABA0", label: "Teal" },
  { value: "#E2694E", label: "Terracotta" },
];

const emptyForm = {
  name: "",
  description: "",
  teacher_id: "",
  capacity: 20,
  age_range: "",
  color: colorOptions[0].value,
};

export default function AdminClasses() {
  const { classes, loading, refresh } = useClasses();
  const { teachers } = useTeachers();
  const [rosterCounts, setRosterCounts] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadCounts() {
      const { data } = await supabase.from("student_classes").select("class_id");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((sc) => {
        counts[sc.class_id] = (counts[sc.class_id] ?? 0) + 1;
      });
      setRosterCounts(counts);
    }
    loadCounts();
  }, [classes]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(c: SchoolClass) {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description ?? "",
      teacher_id: c.teacher_id ?? "",
      capacity: c.capacity,
      age_range: c.age_range ?? "",
      color: c.color,
    });
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description || null,
      teacher_id: form.teacher_id || null,
      capacity: Number(form.capacity),
      age_range: form.age_range || null,
      color: form.color,
    };
    if (editing) {
      await supabase.from("classes").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("classes").insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    refresh();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Program"
        title="Classes"
        description="Define your own classes — group by age, grade, or however fits your program."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New class
          </Button>
        }
      />

      {!loading && classes.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="No classes yet"
          description="Create your first class to start placing students and building the schedule."
          action={<Button onClick={openCreate}>Create a class</Button>}
        />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => {
          const teacher = teachers.find((t) => t.id === c.teacher_id);
          const roster = rosterCounts[c.id] ?? 0;
          return (
            <Card key={c.id} className="relative overflow-hidden">
              <div className="absolute left-0 top-0 h-1 w-full" style={{ backgroundColor: c.color }} />
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-base font-semibold text-twilight-50">{c.name}</h3>
                    {c.age_range && <p className="text-xs text-twilight-200">{c.age_range}</p>}
                  </div>
                  <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-twilight-200 hover:bg-black/5 hover:text-twilight-50">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                {c.description && <p className="mt-2 text-sm text-twilight-200">{c.description}</p>}
                <div className="mt-4 flex items-center justify-between">
                  <Pill tone="neutral">
                    <Users className="h-3 w-3" /> {roster}/{c.capacity}
                  </Pill>
                  <span className="text-xs text-twilight-200">{teacher ? teacher.full_name : "No teacher assigned"}</span>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Edit class" : "New class"}>
        <div className="space-y-4">
          <div>
            <label className="label-field">Class name</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Cedar Room, Grade 3-4, Ages 6-8" />
          </div>
          <div>
            <label className="label-field">Description</label>
            <textarea className="input-field min-h-16" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Age range / grade</label>
              <input className="input-field" value={form.age_range} onChange={(e) => setForm((f) => ({ ...f, age_range: e.target.value }))} placeholder="e.g. Ages 6-8" />
            </div>
            <div>
              <label className="label-field">Capacity</label>
              <input type="number" min={1} className="input-field" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className="label-field">Teacher</label>
            <Select value={form.teacher_id} onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value }))}>
              <option value="">Unassigned</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="label-field">Color</label>
            <div className="flex gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: c.value, borderColor: form.color === c.value ? "#fff" : "transparent" }}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={save} disabled={!form.name}>
              {editing ? "Save changes" : "Create class"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
