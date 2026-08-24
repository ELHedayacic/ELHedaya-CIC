import { useEffect, useRef, useState } from "react";
import { Plus, KanbanSquare, Link2, Trash2, Calendar, Paperclip, X, AlertCircle, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import { useClasses } from "@/hooks/useClasses";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatDate, cn, uploadToBucket } from "@/lib/utils";
import type { Homework, HomeworkColumn } from "@/types";

const columns: { key: HomeworkColumn; label: string; tone: "neutral" | "aurora" | "amber" | "grow" }[] = [
  { key: "assigned", label: "Assigned", tone: "neutral" },
  { key: "in_progress", label: "In progress", tone: "aurora" },
  { key: "submitted", label: "Submitted", tone: "amber" },
  { key: "graded", label: "Graded", tone: "grow" },
];

const emptyForm = { class_id: "", title: "", description: "", due_date: "", resource_url: "" };
const ATTACHMENT_TYPES = ["image/", "application/pdf"];
const ATTACHMENT_MAX_MB = 10;

export default function AdminHomework() {
  const { classes } = useClasses();
  const { profile } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("homework").select("*").order("due_date", { ascending: true });
    setHomework(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function pickFile(file: File | null) {
    setFormError(null);
    if (!file) {
      setAttachmentFile(null);
      return;
    }
    const isAllowed = ATTACHMENT_TYPES.some((t) => file.type.startsWith(t));
    if (!isAllowed) {
      setFormError("Attachments must be an image (JPG, PNG, etc.) or a PDF.");
      return;
    }
    if (file.size > ATTACHMENT_MAX_MB * 1024 * 1024) {
      setFormError(`"${file.name}" is too large — the limit is ${ATTACHMENT_MAX_MB}MB.`);
      return;
    }
    setAttachmentFile(file);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(emptyForm);
    setAttachmentFile(null);
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function save() {
    setFormError(null);
    setSaving(true);

    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;

    if (attachmentFile) {
      try {
        const uploaded = await uploadToBucket("homework-attachments", attachmentFile, {
          maxSizeMB: ATTACHMENT_MAX_MB,
          allowedTypePrefixes: ATTACHMENT_TYPES,
        });
        attachmentUrl = uploaded.url;
        attachmentName = attachmentFile.name;
      } catch (err) {
        setSaving(false);
        setFormError(err instanceof Error ? err.message : "Couldn't upload the attachment.");
        return;
      }
    }

    const { error } = await supabase.from("homework").insert({
      class_id: form.class_id,
      title: form.title,
      description: form.description || null,
      due_date: form.due_date || null,
      resource_url: form.resource_url || null,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      created_by: profile?.id,
      board_column: "assigned",
    });

    setSaving(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    closeModal();
    load();
  }

  async function moveCard(id: string, column: HomeworkColumn) {
    setHomework((prev) => prev.map((h) => (h.id === id ? { ...h, board_column: column } : h)));
    await supabase.from("homework").update({ board_column: column }).eq("id", id);
  }

  async function remove(id: string) {
    await supabase.from("homework").delete().eq("id", id);
    load();
  }

  const filtered = classFilter === "all" ? homework : homework.filter((h) => h.class_id === classFilter);

  function classNameFor(id: string) {
    return classes.find((c) => c.id === id)?.name ?? "";
  }

  return (
    <div>
      <PageHeader
        eyebrow="Lessons"
        title="Homework board"
        description="Drag the status forward as a lesson moves from assigned to graded."
        action={
          <Button onClick={() => setModalOpen(true)} disabled={classes.length === 0}>
            <Plus className="h-4 w-4" /> New assignment
          </Button>
        }
      />

      <div className="mb-6 w-full sm:w-64">
        <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="all">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {!loading && filtered.length === 0 && (
        <EmptyState icon={KanbanSquare} title="No assignments yet" description="Create an assignment to start the board." />
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.key} className="min-w-0">
              <div className="mb-3 flex items-center justify-between px-1">
                <Pill tone={col.tone}>{col.label}</Pill>
                <span className="font-mono text-xs text-twilight-200">
                  {filtered.filter((h) => h.board_column === col.key).length}
                </span>
              </div>
              <div className="space-y-3">
                {filtered
                  .filter((h) => h.board_column === col.key)
                  .map((h) => (
                    <div key={h.id} className="glass-card p-4">
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-twilight-50">{h.title}</p>
                          <button onClick={() => remove(h.id)} className="shrink-0 text-twilight-200 hover:text-coral-700">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-twilight-200">{classNameFor(h.class_id)}</p>
                        {h.description && <p className="mt-2 line-clamp-2 text-xs text-twilight-200">{h.description}</p>}

                        {h.attachment_url && (
                          <a
                            href={h.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 flex items-center gap-1.5 truncate rounded-lg border border-black/10 bg-black/[0.03] px-2.5 py-1.5 text-xs text-amber-700 hover:bg-black/[0.06]"
                          >
                            <Paperclip className="h-3 w-3 shrink-0" />
                            <span className="truncate">{h.attachment_name ?? "Attachment"}</span>
                          </a>
                        )}

                        <div className="mt-3 flex items-center justify-between">
                          {h.due_date ? (
                            <span className="flex items-center gap-1 font-mono text-[11px] text-twilight-200">
                              <Calendar className="h-3 w-3" /> {formatDate(h.due_date)}
                            </span>
                          ) : (
                            <span />
                          )}
                          {h.resource_url && (
                            <a href={h.resource_url} target="_blank" rel="noreferrer" className="text-aurora-600 hover:text-aurora-700">
                              <Link2 className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="mt-3 flex gap-1">
                          {columns.map((c) => (
                            <button
                              key={c.key}
                              onClick={() => moveCard(h.id, c.key)}
                              className={cn(
                                "h-1.5 flex-1 rounded-full transition-colors",
                                c.key === h.board_column ? "bg-aurora-500" : "bg-black/10 hover:bg-black/20"
                              )}
                              title={`Move to ${c.label}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onOpenChange={(o) => (o ? setModalOpen(true) : closeModal())} title="New assignment">
        <div className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}
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
            <label className="label-field">Title</label>
            <input
              className="input-field"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Memorize Surah Ikhlas"
            />
          </div>
          <div>
            <label className="label-field">Description</label>
            <textarea className="input-field min-h-20" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Due date</label>
              <input type="date" className="input-field" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div>
              <label className="label-field">Resource link</label>
              <input className="input-field" value={form.resource_url} onChange={(e) => setForm((f) => ({ ...f, resource_url: e.target.value }))} placeholder="https://" />
            </div>
          </div>

          <div>
            <label className="label-field">Attachment (image or PDF, optional)</label>
            {attachmentFile ? (
              <div className="flex items-center justify-between rounded-xl border border-black/10 bg-black/[0.05] px-4 py-2.5">
                <span className="flex min-w-0 items-center gap-2 text-sm text-twilight-50">
                  <FileText className="h-4 w-4 shrink-0 text-amber-700" />
                  <span className="truncate">{attachmentFile.name}</span>
                  <span className="shrink-0 text-xs text-twilight-200">
                    ({(attachmentFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => pickFile(null)}
                  className="shrink-0 rounded-full p-1 text-twilight-200 hover:bg-black/10 hover:text-coral-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-4 text-sm text-twilight-200 transition-colors hover:border-amber-500/40 hover:bg-black/[0.04]">
                <Paperclip className="h-4 w-4" />
                Upload a worksheet or handout
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button loading={saving} onClick={save} disabled={!form.class_id || !form.title}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
