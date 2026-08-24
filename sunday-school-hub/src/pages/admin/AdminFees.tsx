import { useEffect, useState } from "react";
import {
  Plus,
  Receipt,
  DollarSign,
  CheckCircle2,
  Star,
  Users,
  Search,
  AlertCircle,
  Send,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import { StatCard } from "@/components/ui/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, sendFamilyEmailRequest } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { FeeStructure, FeeCategory } from "@/types";

const categoryLabel: Record<FeeCategory, string> = {
  general: "General Fee",
  books: "Books",
  supplies: "Supplies",
  other: "Other",
};

const emptyFeeForm = { name: "", description: "", amount: "", category: "general" as FeeCategory, due_date: "" };

export default function AdminFees() {
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyFeeForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("fee_structures").select("*").order("created_at", { ascending: false });
    setFees(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyFeeForm);
    setModalOpen(true);
  }

  function openEdit(f: FeeStructure) {
    setEditingId(f.id);
    setForm({
      name: f.name,
      description: f.description ?? "",
      amount: String(f.amount),
      category: f.category,
      due_date: f.due_date ?? "",
    });
    setModalOpen(true);
  }

  async function saveFee() {
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description || null,
      amount: Number(form.amount),
      category: form.category,
      due_date: form.due_date || null,
    };
    if (editingId) {
      await supabase.from("fee_structures").update(payload).eq("id", editingId);
    } else {
      await supabase.from("fee_structures").insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    setForm(emptyFeeForm);
    setEditingId(null);
    load();
  }

  async function toggleFeeActive(fee: FeeStructure) {
    await supabase.from("fee_structures").update({ active: !fee.active }).eq("id", fee.id);
    load();
  }

  async function setAsDefaultRegistration(fee: FeeStructure) {
    // The partial unique index only allows one row to be true at a time,
    // so any previous default has to be unset first, in its own request,
    // or this insert would collide with it.
    await supabase.from("fee_structures").update({ is_default_registration: false }).eq("is_default_registration", true);
    await supabase.from("fee_structures").update({ is_default_registration: true }).eq("id", fee.id);
    load();
  }

  async function clearDefaultRegistration(fee: FeeStructure) {
    await supabase.from("fee_structures").update({ is_default_registration: false }).eq("id", fee.id);
    load();
  }

  const activeFees = fees.filter((f) => f.active);
  const totalActiveValue = activeFees.reduce((sum, f) => sum + Number(f.amount), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="Fees"
        description="Set up fees families pay online through Square. Every fee applies to all families — it isn't tied to a class, so enrolling a child in more classes never changes what they owe. Mark one fee as the default registration fee and parents are prompted to pay it right after registering a child."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New fee
          </Button>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Active fees" value={activeFees.length} icon={DollarSign} accent="aurora" />
        <StatCard label="Combined active total" value={formatCurrency(totalActiveValue)} icon={CheckCircle2} accent="grow" />
      </div>

      {!loading && fees.length > 0 && !fees.some((f) => f.is_default_registration) && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
          <Star className="mt-0.5 h-4 w-4 shrink-0" />
          No fee is set as the default registration fee yet — parents won't be prompted to pay anything after
          registering a child until you mark one below.
        </div>
      )}

      {!loading && fees.length === 0 && (
        <EmptyState
          icon={Receipt}
          title="No fees set up yet"
          description="Create your first fee — General Fee, Books, Supplies, or Other."
          action={<Button onClick={openCreate}>Create a fee</Button>}
        />
      )}

      <div className="space-y-2">
        {fees.map((f) => (
          <Card key={f.id}>
            <CardBody className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-twilight-50">{f.name}</p>
                  <Pill tone="neutral">{categoryLabel[f.category]}</Pill>
                  {!f.active && <Pill tone="coral">Inactive</Pill>}
                  {f.is_default_registration && (
                    <Pill tone="amber">
                      <Star className="h-3 w-3" /> Default registration fee
                    </Pill>
                  )}
                </div>
                {f.description && <p className="mt-1 text-xs text-twilight-200">{f.description}</p>}
                {f.due_date && <p className="mt-0.5 text-xs text-twilight-200">Due {formatDate(f.due_date)}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-lg font-semibold text-twilight-50">{formatCurrency(Number(f.amount))}</span>
                {f.is_default_registration ? (
                  <Button size="sm" variant="secondary" onClick={() => clearDefaultRegistration(f)}>
                    Remove as default
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setAsDefaultRegistration(f)}>
                    Set as default
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => openEdit(f)}>
                  Edit
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toggleFeeActive(f)}>
                  {f.active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editingId ? "Edit fee" : "New fee"}>
        <div className="space-y-4">
          <div>
            <label className="label-field">Name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Fall Term General Fee"
            />
          </div>
          <div>
            <label className="label-field">Description</label>
            <textarea className="input-field min-h-16" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Amount (USD)</label>
              <input type="number" min={0} step="0.01" className="input-field" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="label-field">Category</label>
              <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as FeeCategory }))}>
                <option value="general">General Fee</option>
                <option value="books">Books</option>
                <option value="supplies">Supplies</option>
                <option value="other">Other</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="label-field">Due date (optional)</label>
            <input type="date" className="input-field" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={saveFee} disabled={!form.name || !form.amount}>
              {editingId ? "Save changes" : "Create fee"}
            </Button>
          </div>
        </div>
      </Modal>

      <FamilyFeeStatusSection activeFees={activeFees} />
    </div>
  );
}

interface RosterRow {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  parent_id: string;
  parent_name: string;
}

function FamilyFeeStatusSection({ activeFees }: { activeFees: FeeStructure[] }) {
  const { profile } = useAuth();
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [paidSet, setPaidSet] = useState<Set<string>>(new Set()); // "studentId::feeId"
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "paid">("unpaid");

  const [messageTarget, setMessageTarget] = useState<{ student: RosterRow; unpaidFees: FeeStructure[] } | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [alsoEmail, setAlsoEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: students }, { data: payments }] = await Promise.all([
      supabase.from("students").select("id, first_name, last_name, photo_url, parent_id, profiles(full_name)").order("first_name"),
      supabase.from("payments").select("student_id, fee_structure_id").eq("status", "completed"),
    ]);

    setRows(
      (students ?? []).map((s: any) => ({
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        photo_url: s.photo_url,
        parent_id: s.parent_id,
        parent_name: s.profiles?.full_name ?? "—",
      }))
    );
    setPaidSet(new Set((payments ?? []).map((p: any) => `${p.student_id}::${p.fee_structure_id}`)));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function unpaidFeesFor(studentId: string): FeeStructure[] {
    return activeFees.filter((fee) => !paidSet.has(`${studentId}::${fee.id}`));
  }

  function openMessage(student: RosterRow, unpaidFees: FeeStructure[]) {
    setMessageTarget({ student, unpaidFees });
    setSubject("Payment reminder");
    const feeList = unpaidFees.map((f) => `${f.name} (${formatCurrency(Number(f.amount))})`).join(", ");
    setMessage(
      `Hi! This is a friendly reminder that the following payment(s) are still due for ${student.first_name}: ${feeList}. You can pay anytime from the Payments page in your family portal. Thank you!`
    );
    setAlsoEmail(true);
    setSendError(null);
    setSent(false);
  }

  async function sendReminder() {
    if (!messageTarget) return;
    setSendError(null);
    setSending(true);

    await supabase.from("announcements").insert({
      teacher_id: profile?.id,
      title: subject,
      body: message,
      audience: "student",
      student_id: messageTarget.student.id,
      pinned: false,
    });

    if (alsoEmail) {
      const result = await sendFamilyEmailRequest({
        subject,
        message,
        audience: "student",
        studentId: messageTarget.student.id,
      });
      if (!result.success) {
        setSending(false);
        setSendError(result.error ?? "Posted in-app, but the email failed to send.");
        return;
      }
    }

    setSending(false);
    setSent(true);
  }

  if (loading && rows.length === 0) return null;

  const withStatus = rows.map((r) => ({ ...r, unpaidFees: unpaidFeesFor(r.id) }));
  const unpaidCount = withStatus.filter((r) => r.unpaidFees.length > 0).length;
  const paidCount = withStatus.length - unpaidCount;

  const filtered = withStatus
    .filter((r) => {
      if (statusFilter === "unpaid") return r.unpaidFees.length > 0;
      if (statusFilter === "paid") return r.unpaidFees.length === 0;
      return true;
    })
    .filter((r) => `${r.first_name} ${r.last_name}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mt-10">
      <PageHeader eyebrow="Roster" title="Family fee status" description="Every enrolled student, with whether their family has paid every active fee." />

      {activeFees.length === 0 ? (
        <EmptyState icon={Receipt} title="No active fees to check against" description="Create and activate a fee above to see payment status here." />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard label="Fully paid" value={paidCount} icon={CheckCircle2} accent="grow" />
            <StatCard label="Have unpaid fees" value={unpaidCount} icon={AlertCircle} accent="coral" />
          </div>

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
            <div className="sm:w-48">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | "unpaid" | "paid")}>
                <option value="unpaid">Unpaid only</option>
                <option value="paid">Paid only</option>
                <option value="all">Everyone</option>
              </Select>
            </div>
          </div>

          {filtered.length === 0 && <EmptyState icon={Users} title="No students match" description="Try a different search or filter." />}

          <div className="space-y-2">
            {filtered.map((r) => (
              <Card key={r.id}>
                <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={`${r.first_name} ${r.last_name}`} photoPath={r.photo_url} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-twilight-50">
                        {r.first_name} {r.last_name}
                      </p>
                      <p className="truncate text-xs text-twilight-200">{r.parent_name}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {r.unpaidFees.length === 0 ? (
                      <Pill tone="grow">
                        <CheckCircle2 className="h-3 w-3" /> Paid
                      </Pill>
                    ) : (
                      <>
                        <Pill tone="coral">
                          <AlertCircle className="h-3 w-3" /> Unpaid: {r.unpaidFees.map((f) => f.name).join(", ")}
                        </Pill>
                        <Button size="sm" variant="secondary" onClick={() => openMessage(r, r.unpaidFees)}>
                          <Mail className="h-3.5 w-3.5" /> Message family
                        </Button>
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        open={Boolean(messageTarget)}
        onOpenChange={(o) => !o && setMessageTarget(null)}
        title={sent ? "Reminder sent" : `Message ${messageTarget?.student.parent_name ?? "family"}`}
      >
        {messageTarget &&
          (sent ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-grow-500" />
              <p className="mt-3 text-sm text-twilight-200">
                Posted to their portal{alsoEmail ? " and emailed" : ""}.
              </p>
              <Button className="mt-6" onClick={() => setMessageTarget(null)}>
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sendError && (
                <div className="flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {sendError}
                </div>
              )}
              <div>
                <label className="label-field">Subject</label>
                <input className="input-field" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div>
                <label className="label-field">Message</label>
                <textarea className="input-field min-h-32" value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-sm text-twilight-200">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-black/20 bg-transparent accent-amber-500"
                  checked={alsoEmail}
                  onChange={(e) => setAlsoEmail(e.target.checked)}
                />
                <span>
                  <span className="text-twilight-50">Also email this family</span> — posts to their in-app inbox
                  either way; check this to also send it as a real email.
                </span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setMessageTarget(null)}>
                  Cancel
                </Button>
                <Button loading={sending} onClick={sendReminder} disabled={!subject.trim() || !message.trim()}>
                  <Send className="h-4 w-4" /> Send reminder
                </Button>
              </div>
            </div>
          ))}
      </Modal>
    </div>
  );
}
