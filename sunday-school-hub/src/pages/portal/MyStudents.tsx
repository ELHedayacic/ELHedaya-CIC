import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Cake, ShieldAlert, Phone } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PhotoPicker } from "@/components/shared/PhotoPicker";
import { useMyStudents } from "@/hooks/useMyStudents";
import { supabase } from "@/lib/supabase";
import { formatDate, age } from "@/lib/utils";
import type { Student } from "@/types";

export default function MyStudents() {
  const { students, loading, refresh } = useMyStudents();
  const [active, setActive] = useState<Student | null>(null);

  return (
    <div>
      <PageHeader
        eyebrow="Family"
        title="My children"
        description="Keep each child's details current so teachers always have what they need."
        action={
          <Link to="/portal/students/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Register a child
          </Link>
        }
      />

      {!loading && students.length === 0 && (
        <EmptyState
          icon={Users}
          title="No children registered yet"
          description="Register your first child to enroll them in a class."
          action={
            <Link to="/portal/students/new" className="btn-primary">
              Register a child
            </Link>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {students.map((s) => (
          <Card key={s.id} className="cursor-pointer transition-transform hover:-translate-y-0.5" onClick={() => setActive(s)}>
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={`${s.first_name} ${s.last_name}`} photoPath={s.photo_url} size="lg" />
                <div>
                  <p className="font-display text-base font-semibold text-twilight-50">
                    {s.first_name} {s.last_name}
                  </p>
                  <p className="text-xs text-twilight-200">Age {age(s.date_of_birth)}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {s.classes && s.classes.length > 0 ? (
                  s.classes.map((c) => (
                    <Pill key={c.id} tone="aurora">
                      {c.name}
                    </Pill>
                  ))
                ) : (
                  <Pill tone="neutral">Awaiting class</Pill>
                )}
                {s.allergies && <Pill tone="coral">Allergy noted</Pill>}
                <Pill tone={s.status === "active" ? "grow" : "neutral"}>{s.status}</Pill>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {active && (
        <StudentDetailModal
          student={active}
          onClose={() => setActive(null)}
          onSaved={() => {
            refresh();
            setActive(null);
          }}
          onPhotoChanged={refresh}
        />
      )}
    </div>
  );
}

function StudentDetailModal({
  student,
  onClose,
  onSaved,
  onPhotoChanged,
}: {
  student: Student;
  onClose: () => void;
  onSaved: () => void;
  onPhotoChanged: () => void;
}) {
  const [photoPath, setPhotoPath] = useState(student.photo_url);
  const [form, setForm] = useState({
    allergies: student.allergies ?? "",
    medical_notes: student.medical_notes ?? "",
    emergency_contact_name: student.emergency_contact_name ?? "",
    emergency_contact_phone: student.emergency_contact_phone ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handlePhotoUploaded(path: string) {
    setPhotoPath(path);
    await supabase.from("students").update({ photo_url: path }).eq("id", student.id);
    onPhotoChanged();
  }

  async function save() {
    setSaving(true);
    await supabase.from("students").update(form).eq("id", student.id);
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={`${student.first_name} ${student.last_name}`}>
      <div className="space-y-5">
        <PhotoPicker studentId={student.id} currentPath={photoPath} onUploaded={handlePhotoUploaded} />

        <div className="flex flex-wrap gap-3 text-sm text-twilight-200">
          <span className="flex items-center gap-1.5">
            <Cake className="h-4 w-4" /> {formatDate(student.date_of_birth)}
          </span>
          {student.classes && student.classes.length > 0 && (
            <span className="flex flex-wrap items-center gap-1.5">
              <Users className="h-4 w-4" /> {student.classes.map((c) => c.name).join(", ")}
            </span>
          )}
        </div>

        <div>
          <label className="label-field flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" /> Allergies
          </label>
          <input
            className="input-field"
            value={form.allergies}
            onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
          />
        </div>

        <div>
          <label className="label-field">Medical notes</label>
          <textarea
            className="input-field min-h-20"
            value={form.medical_notes}
            onChange={(e) => setForm((f) => ({ ...f, medical_notes: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Emergency contact
            </label>
            <input
              className="input-field"
              value={form.emergency_contact_name}
              onChange={(e) => setForm((f) => ({ ...f, emergency_contact_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-field">Phone</label>
            <input
              className="input-field"
              value={form.emergency_contact_phone}
              onChange={(e) => setForm((f) => ({ ...f, emergency_contact_phone: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={save}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
