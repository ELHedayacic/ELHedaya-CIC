import { useEffect, useRef, useState } from "react";
import {
  Plus,
  MessageSquareText,
  Pin,
  Pencil,
  Trash2,
  Mail,
  Paperclip,
  X,
  FileText,
  AlertCircle,
  Send,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useClasses } from "@/hooks/useClasses";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatDate, extractFunctionErrorMessage, uploadToBucket, sendFamilyEmailRequest } from "@/lib/utils";
import type { Announcement, AnnouncementAudience, Student } from "@/types";

const audienceLabel: Record<AnnouncementAudience, string> = {
  all: "Everyone",
  class: "One class",
  student: "One student",
};

const emptyForm = { title: "", body: "", audience: "all" as AnnouncementAudience, class_id: "", student_id: "", pinned: false };

const ATTACHMENT_TYPES = ["image/", "application/pdf"];
const ATTACHMENT_MAX_MB = 8;

export default function AdminMessages() {
  const { profile } = useAuth();
  const { classes } = useClasses();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [existingAttachment, setExistingAttachment] = useState<{ url: string; name: string } | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [alsoEmail, setAlsoEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error" | "sending"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const attachInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setAnnouncements(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    async function loadStudents() {
      if (form.audience !== "student") return;
      if (form.class_id) {
        const { data } = await supabase
          .from("student_classes")
          .select("students(*)")
          .eq("class_id", form.class_id);
        const roster = (data ?? [])
          .map((sc: any) => sc.students)
          .filter(Boolean)
          .sort((a: any, b: any) => a.first_name.localeCompare(b.first_name));
        setStudents(roster);
      } else {
        const { data } = await supabase.from("students").select("*").order("first_name");
        setStudents(data ?? []);
      }
    }
    loadStudents();
  }, [form.audience, form.class_id]);

  async function save() {
    setAttachError(null);
    setSaving(true);

    let attachmentUrl: string | null = existingAttachment?.url ?? null;
    let attachmentName: string | null = existingAttachment?.name ?? null;

    if (attachmentFile) {
      try {
        const uploaded = await uploadToBucket("homework-attachments", attachmentFile, {
          maxSizeMB: ATTACHMENT_MAX_MB,
          allowedTypePrefixes: ATTACHMENT_TYPES,
          pathPrefix: "announcements",
        });
        attachmentUrl = uploaded.url;
        attachmentName = attachmentFile.name;
      } catch (err) {
        setSaving(false);
        setAttachError(err instanceof Error ? err.message : "Couldn't upload the attachment.");
        return;
      }
    }

    const payload = {
      title: form.title,
      body: form.body,
      audience: form.audience,
      class_id: form.audience === "class" ? form.class_id : form.audience === "student" ? form.class_id || null : null,
      student_id: form.audience === "student" ? form.student_id : null,
      pinned: form.pinned,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    };

    if (editingId) {
      await supabase.from("announcements").update(payload).eq("id", editingId);
    } else {
      await supabase.from("announcements").insert({ teacher_id: profile?.id, ...payload });
    }

    // New posts only — re-emailing everyone every time someone fixes a typo
    // on an edit would be unwelcome. Snapshot what's needed before
    // closeModal() resets the form, then send in the background so the
    // modal doesn't sit waiting on the email (which can take a few seconds
    // with an attachment and many recipients).
    const shouldEmail = !editingId && alsoEmail;
    const emailSnapshot = shouldEmail
      ? {
          subject: form.title,
          message: form.body,
          audience: form.audience,
          classId: form.audience === "class" ? form.class_id : undefined,
          studentId: form.audience === "student" ? form.student_id : undefined,
          attachmentFile,
        }
      : null;

    setSaving(false);
    closeModal();
    load();

    if (emailSnapshot) {
      setEmailStatus({ type: "sending", message: "Sending the email to families…" });
      const result = await sendFamilyEmailRequest(emailSnapshot);
      if (result.success) {
        setEmailStatus({
          type: "success",
          message: `Posted, and emailed ${result.recipientCount} ${result.recipientCount === 1 ? "family" : "families"}.`,
        });
      } else {
        setEmailStatus({ type: "error", message: `Posted to the board, but the email failed to send: ${result.error}` });
      }
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setAttachmentFile(null);
    setExistingAttachment(null);
    setAttachError(null);
    setAlsoEmail(false);
    setModalOpen(true);
  }

  function openEdit(a: Announcement) {
    setEditingId(a.id);
    setForm({
      title: a.title,
      body: a.body,
      audience: a.audience,
      class_id: a.class_id ?? "",
      student_id: a.student_id ?? "",
      pinned: a.pinned,
    });
    setAttachmentFile(null);
    setExistingAttachment(a.attachment_url ? { url: a.attachment_url, name: a.attachment_name ?? "Attachment" } : null);
    setAttachError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setAttachmentFile(null);
    setExistingAttachment(null);
    setAttachError(null);
    setAlsoEmail(false);
    if (attachInputRef.current) attachInputRef.current.value = "";
  }

  function pickAttachment(file: File | null) {
    setAttachError(null);
    if (!file) {
      setAttachmentFile(null);
      return;
    }
    if (!ATTACHMENT_TYPES.some((t) => file.type.startsWith(t))) {
      setAttachError("Attachments must be an image (JPG, PNG, etc.) or a PDF.");
      return;
    }
    if (file.size > ATTACHMENT_MAX_MB * 1024 * 1024) {
      setAttachError(`"${file.name}" is too large — the limit is ${ATTACHMENT_MAX_MB}MB.`);
      return;
    }
    setAttachmentFile(file);
    setExistingAttachment(null); // a newly picked file replaces whatever was there
  }

  async function remove(id: string) {
    await supabase.from("announcements").delete().eq("id", id);
    load();
  }

  function classNameFor(id: string | null) {
    return classes.find((c) => c.id === id)?.name;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Family updates"
        title="Messages"
        description="Post an in-app update, or send a real email — both go straight to the right families."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEmailModalOpen(true)}>
              <Mail className="h-4 w-4" /> Send email
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> New message
            </Button>
          </div>
        }
      />

      {emailStatus && (
        <div
          className={`mb-6 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            emailStatus.type === "error"
              ? "border-coral-500/30 bg-coral-500/10 text-coral-700"
              : emailStatus.type === "sending"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
              : "border-grow-500/30 bg-grow-500/10 text-grow-600"
          }`}
        >
          <span className="flex items-center gap-2">
            {emailStatus.type === "sending" && <Send className="h-4 w-4 shrink-0 animate-pulse" />}
            {emailStatus.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {emailStatus.type === "error" && <AlertCircle className="h-4 w-4 shrink-0" />}
            {emailStatus.message}
          </span>
          {emailStatus.type !== "sending" && (
            <button onClick={() => setEmailStatus(null)} className="shrink-0 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {!loading && announcements.length === 0 && (
        <EmptyState icon={MessageSquareText} title="No messages posted yet" description="Send your first update to families." />
      )}

      <div className="space-y-3">
        {announcements
          .sort((a, b) => Number(b.pinned) - Number(a.pinned))
          .map((a) => (
            <Card key={a.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {a.pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                    <h3 className="font-display text-base font-semibold text-twilight-50">{a.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-twilight-200">{formatDate(a.created_at)}</span>
                    <button onClick={() => openEdit(a)} className="text-twilight-200 hover:text-aurora-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(a.id)} className="text-twilight-200 hover:text-coral-700">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-twilight-200">{a.body}</p>
                {a.attachment_url && (
                  <a
                    href={a.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-black/[0.06]"
                  >
                    <Paperclip className="h-3.5 w-3.5" /> {a.attachment_name ?? "Attachment"}
                  </a>
                )}
                <div className="mt-3">
                  <Pill tone="neutral">
                    {a.audience === "class" && a.class_id
                      ? classNameFor(a.class_id)
                      : a.audience === "student"
                      ? "Individual family"
                      : audienceLabel[a.audience]}
                  </Pill>
                </div>
              </CardBody>
            </Card>
          ))}
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={(o) => (o ? setModalOpen(true) : closeModal())}
        title={editingId ? "Edit message" : "New message"}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div>
            <label className="label-field">Send to</label>
            <Tabs value={form.audience} onValueChange={(v) => setForm((f) => ({ ...f, audience: v as AnnouncementAudience, class_id: "", student_id: "" }))}>
              <TabsList>
                <TabsTrigger value="all">Everyone</TabsTrigger>
                <TabsTrigger value="class">One class</TabsTrigger>
                <TabsTrigger value="student">One student</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {(form.audience === "class" || form.audience === "student") && (
            <div>
              <label className="label-field">Class</label>
              <Select value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value, student_id: "" }))}>
                <option value="">{form.audience === "student" ? "All classes" : "Select a class"}</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {form.audience === "student" && (
            <div>
              <label className="label-field">Student</label>
              <Select value={form.student_id} onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}>
                <option value="">Select a student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <label className="label-field">Title</label>
            <input className="input-field" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. No class this Sunday" />
          </div>
          <div>
            <label className="label-field">Message</label>
            <textarea className="input-field min-h-28" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          </div>

          {attachError && (
            <div className="flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {attachError}
            </div>
          )}
          <div>
            <label className="label-field">Attachment — flyer, PDF, etc. (optional)</label>
            {attachmentFile || existingAttachment ? (
              <div className="flex items-center justify-between rounded-xl border border-black/10 bg-black/[0.05] px-4 py-2.5">
                <span className="flex min-w-0 items-center gap-2 text-sm text-twilight-50">
                  <FileText className="h-4 w-4 shrink-0 text-amber-700" />
                  <span className="truncate">{attachmentFile?.name ?? existingAttachment?.name}</span>
                  {attachmentFile && (
                    <span className="shrink-0 text-xs text-twilight-200">({(attachmentFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentFile(null);
                    setExistingAttachment(null);
                    if (attachInputRef.current) attachInputRef.current.value = "";
                  }}
                  className="shrink-0 rounded-full p-1 text-twilight-200 hover:bg-black/10 hover:text-coral-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-4 text-sm text-twilight-200 transition-colors hover:border-amber-500/40 hover:bg-black/[0.04]">
                <Paperclip className="h-4 w-4" />
                Attach a file
                <input
                  ref={attachInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => pickAttachment(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-twilight-200">
            <input type="checkbox" className="h-4 w-4 rounded border-black/20 bg-transparent accent-aurora-500" checked={form.pinned} onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))} />
            Pin to the top of the inbox
          </label>

          {!editingId && (
            <label className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-sm text-twilight-200">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-black/20 bg-transparent accent-amber-500"
                checked={alsoEmail}
                onChange={(e) => setAlsoEmail(e.target.checked)}
              />
              <span>
                <span className="text-twilight-50">Also email families</span> — sends this same message (and
                attachment, if any) as a real email, not just an in-app post.
              </span>
            </label>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={save}
              disabled={!form.title || !form.body || (form.audience === "class" && !form.class_id) || (form.audience === "student" && !form.student_id)}
            >
              {editingId ? "Save changes" : "Post message"}
            </Button>
          </div>
        </div>
      </Modal>

      <EmailComposeModal open={emailModalOpen} onOpenChange={setEmailModalOpen} />
    </div>
  );
}

const emptyEmailForm = { subject: "", message: "", audience: "all" as AnnouncementAudience, class_id: "", student_id: "" };

function EmailComposeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { profile, user } = useAuth();
  const { classes } = useClasses();
  const [form, setForm] = useState(emptyEmailForm);
  const [students, setStudents] = useState<Student[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadStudents() {
      if (form.audience !== "student") return;
      if (form.class_id) {
        const { data } = await supabase
          .from("student_classes")
          .select("students(*)")
          .eq("class_id", form.class_id);
        const roster = (data ?? [])
          .map((sc: any) => sc.students)
          .filter(Boolean)
          .sort((a: any, b: any) => a.first_name.localeCompare(b.first_name));
        setStudents(roster);
      } else {
        const { data } = await supabase.from("students").select("*").order("first_name");
        setStudents(data ?? []);
      }
    }
    loadStudents();
  }, [form.audience, form.class_id]);

  function reset() {
    setForm(emptyEmailForm);
    setAttachment(null);
    setError(null);
    setSentCount(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function close() {
    onOpenChange(false);
    reset();
  }

  function pickFile(file: File | null) {
    setError(null);
    if (!file) {
      setAttachment(null);
      return;
    }
    if (!ATTACHMENT_TYPES.some((t) => file.type.startsWith(t))) {
      setError("Attachments must be an image (JPG, PNG, etc.) or a PDF.");
      return;
    }
    if (file.size > ATTACHMENT_MAX_MB * 1024 * 1024) {
      setError(`"${file.name}" is too large — the limit is ${ATTACHMENT_MAX_MB}MB.`);
      return;
    }
    setAttachment(file);
  }

  async function send() {
    setError(null);
    setSending(true);

    const result = await sendFamilyEmailRequest({
      subject: form.subject,
      message: form.message,
      audience: form.audience,
      classId: form.audience === "class" ? form.class_id : undefined,
      studentId: form.audience === "student" ? form.student_id : undefined,
      attachmentFile: attachment,
    });

    setSending(false);
    if (!result.success) {
      setError(result.error ?? "Couldn't send the email.");
      return;
    }
    setSentCount(result.recipientCount ?? 0);
  }

  const canSend =
    form.subject.trim() &&
    form.message.trim() &&
    (form.audience !== "class" || form.class_id) &&
    (form.audience !== "student" || form.student_id);

  if (sentCount !== null) {
    return (
      <Modal open={open} onOpenChange={(o) => !o && close()} title="Email sent">
        <div className="flex flex-col items-center py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-grow-500" />
          <p className="mt-3 text-sm text-twilight-200">
            Delivered to <span className="text-twilight-50">{sentCount}</span>{" "}
            {sentCount === 1 ? "family" : "families"}. Replies will go straight to your inbox.
          </p>
          <Button className="mt-6" onClick={close}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onOpenChange={(o) => !o && close()} title="Send email" maxWidth="max-w-xl">
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-xs text-twilight-200">
          <span className="text-twilight-50">From:</span> {profile?.full_name} via El Hedaya Islamic School
          <br />
          Replies go straight to <span className="text-twilight-50">{user?.email}</span> — families never see
          your address in the "From" line, since real email requires sending through our verified domain, but
          they can reply directly to you.
        </div>

        <div>
          <label className="label-field">Send to</label>
          <Tabs
            value={form.audience}
            onValueChange={(v) => setForm((f) => ({ ...f, audience: v as AnnouncementAudience, class_id: "", student_id: "" }))}
          >
            <TabsList>
              <TabsTrigger value="all">All families</TabsTrigger>
              <TabsTrigger value="class">One class</TabsTrigger>
              <TabsTrigger value="student">One student</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {(form.audience === "class" || form.audience === "student") && (
          <div>
            <label className="label-field">Class</label>
            <Select value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value, student_id: "" }))}>
              <option value="">{form.audience === "student" ? "All classes" : "Select a class"}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {form.audience === "student" && (
          <div>
            <label className="label-field">Student</label>
            <Select value={form.student_id} onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}>
              <option value="">Select a student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <label className="label-field">Subject</label>
          <input
            className="input-field"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="e.g. Permission slip for the Eid picnic"
          />
        </div>

        <div>
          <label className="label-field">Message</label>
          <textarea
            className="input-field min-h-32"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            placeholder="Write your message..."
          />
        </div>

        <div>
          <label className="label-field">Attachment (image or PDF, optional)</label>
          {attachment ? (
            <div className="flex items-center justify-between rounded-xl border border-black/10 bg-black/[0.05] px-4 py-2.5">
              <span className="flex min-w-0 items-center gap-2 text-sm text-twilight-50">
                <FileText className="h-4 w-4 shrink-0 text-amber-700" />
                <span className="truncate">{attachment.name}</span>
                <span className="shrink-0 text-xs text-twilight-200">({(attachment.size / (1024 * 1024)).toFixed(1)} MB)</span>
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
              Attach a file
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
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button loading={sending} onClick={send} disabled={!canSend}>
            <Send className="h-4 w-4" /> Send email
          </Button>
        </div>
      </div>
    </Modal>
  );
}
