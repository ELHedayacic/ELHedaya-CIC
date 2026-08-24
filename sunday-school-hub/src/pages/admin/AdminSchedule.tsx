import { useEffect, useState } from "react";
import { Plus, CalendarClock, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import { useClasses } from "@/hooks/useClasses";
import { supabase } from "@/lib/supabase";
import { formatDate, formatTime } from "@/lib/utils";
import type { ClassSession } from "@/types";

const emptyForm = {
  class_id: "",
  session_date: "",
  start_time: "10:00",
  end_time: "11:00",
  location: "",
  topic: "",
};

export default function AdminSchedule() {
  const { classes } = useClasses();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("class_sessions").select("*").order("session_date").order("start_time");
    setSessions(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    await supabase.from("class_sessions").insert({
      class_id: form.class_id,
      session_date: form.session_date,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location || null,
      topic: form.topic || null,
    });
    setSaving(false);
    setModalOpen(false);
    setForm(emptyForm);
    load();
  }

  async function remove(id: string) {
    await supabase.from("class_sessions").delete().eq("id", id);
    load();
  }

  const upcoming = sessions.filter((s) => s.session_date >= new Date().toISOString().slice(0, 10));
  const past = sessions.filter((s) => s.session_date < new Date().toISOString().slice(0, 10));

  function classFor(id: string) {
    return classes.find((c) => c.id === id);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Calendar"
        title="Schedule"
        description="Publish sessions for each class so families always know when to show up."
        action={
          <Button onClick={() => setModalOpen(true)} disabled={classes.length === 0}>
            <Plus className="h-4 w-4" /> Add session
          </Button>
        }
      />

      {classes.length === 0 && (
        <p className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          Create a class first, then you can schedule sessions for it.
        </p>
      )}

      {!loading && upcoming.length === 0 && (
        <EmptyState icon={CalendarClock} title="No upcoming sessions" description="Add your first session to publish the schedule." />
      )}

      <div className="space-y-3">
        {upcoming.map((s) => {
          const cls = classFor(s.class_id);
          return (
            <Card key={s.id}>
              <CardBody className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
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
                      {cls && <Pill tone="aurora">{cls.name}</Pill>}
                      <p className="text-sm font-medium text-twilight-50">{s.topic ?? "Class session"}</p>
                    </div>
                    <p className="mt-1 text-xs text-twilight-200">
                      {formatTime(s.start_time)} – {formatTime(s.end_time)} {s.location ? `· ${s.location}` : ""}
                    </p>
                  </div>
                </div>
                <button onClick={() => remove(s.id)} className="rounded-lg p-2 text-twilight-200 hover:bg-coral-500/10 hover:text-coral-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {past.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-medium text-twilight-200">Past sessions ({past.length})</summary>
          <div className="mt-3 space-y-2">
            {past.map((s) => {
              const cls = classFor(s.class_id);
              return (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-black/5 bg-black/[0.02] px-4 py-2.5 text-sm text-twilight-200">
                  <span>
                    {formatDate(s.session_date)} {cls ? `· ${cls.name}` : ""} {s.topic ? `· ${s.topic}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </details>
      )}

      <Modal open={modalOpen} onOpenChange={setModalOpen} title="Add session">
        <div className="space-y-4">
          <div>
            <label className="label-field">Class</label>
            <Select value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}>
              <option value="">Select a class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="label-field">Date</label>
            <input type="date" className="input-field" value={form.session_date} onChange={(e) => setForm((f) => ({ ...f, session_date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Start time</label>
              <input type="time" className="input-field" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div>
              <label className="label-field">End time</label>
              <input type="time" className="input-field" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label-field">Topic</label>
            <input className="input-field" value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} placeholder="e.g. The Good Samaritan" />
          </div>
          <div>
            <label className="label-field">Location / room</label>
            <input className="input-field" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={save} disabled={!form.class_id || !form.session_date}>
              Add session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
