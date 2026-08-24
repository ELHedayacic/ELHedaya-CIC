import { useEffect, useState, type FormEvent } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Check,
  UserPlus,
  KeyRound,
  Copy,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatDate, extractFunctionErrorMessage } from "@/lib/utils";
import type { UserRole } from "@/types";

interface StaffRow {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  created_at: string;
  email: string;
}

const roleTone: Record<UserRole, "aurora" | "amber" | "sky" | "neutral"> = {
  admin: "amber",
  principal: "sky",
  teacher: "aurora",
  parent: "neutral",
};

const removeWarning: Record<UserRole, string> = {
  admin:
    "This permanently deletes their account and admin access. Any classes they teach will show as unassigned, and their past attendance, homework, and notes stay in place but are no longer attributed to them.",
  principal:
    "This permanently deletes their account and principal access. Any classes they teach will show as unassigned, and their past attendance, homework, and notes stay in place but are no longer attributed to them.",
  teacher:
    "This permanently deletes their account. Any classes they teach will show as unassigned, and their past attendance, homework, and notes stay in place but are no longer attributed to them.",
  parent:
    "This permanently deletes their family account, including their registered children and payment history.",
};

function generatePassword(): string {
  // Avoids visually ambiguous characters (0/O, 1/l/I) since this is meant
  // to be read aloud or copied into a text message, not typed from memory.
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

const emptyCreateForm = { fullName: "", email: "", role: "teacher" as "teacher" | "admin" | "principal", password: "" };

export default function AdminStaff() {
  const { profile, user } = useAuth();
  const isAdminTier = profile?.role === "admin" || profile?.role === "principal";
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [justSavedId, setJustSavedId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string; role: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<StaffRow | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke("list-profiles");
    if (fnError || data?.error) {
      setError(data?.error ?? (await extractFunctionErrorMessage(fnError)));
      setLoading(false);
      return;
    }
    setRows(data.profiles ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (isAdminTier) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function changeRole(id: string, role: UserRole) {
    setSavingId(id);
    const { error: updateError } = await supabase.from("profiles").update({ role }).eq("id", id);
    setSavingId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, role } : r)));
    setJustSavedId(id);
    setTimeout(() => setJustSavedId(null), 1800);
  }

  function openCreate() {
    setCreateForm({ ...emptyCreateForm, password: generatePassword() });
    setCreateError(null);
    setCreated(null);
    setCopied(false);
    setCreateOpen(true);
  }

  async function createAccount(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    const { data, error: fnError } = await supabase.functions.invoke("create-staff-account", {
      body: {
        email: createForm.email.trim(),
        fullName: createForm.fullName.trim(),
        role: createForm.role,
        password: createForm.password,
      },
    });

    setCreating(false);
    if (fnError || data?.error) {
      setCreateError(data?.error ?? (await extractFunctionErrorMessage(fnError)));
      return;
    }

    setCreated({ email: createForm.email.trim(), password: createForm.password, role: createForm.role });
    load();
  }

  async function copyPassword() {
    if (!created) return;
    await navigator.clipboard.writeText(created.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openRemove(row: StaffRow) {
    setRemoveError(null);
    setRemoveTarget(row);
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoveError(null);
    setRemoving(true);

    const { data, error: fnError } = await supabase.functions.invoke("delete-staff", {
      body: { targetId: removeTarget.id },
    });

    setRemoving(false);
    if (fnError || data?.error) {
      setRemoveError(data?.error ?? (await extractFunctionErrorMessage(fnError)));
      return;
    }

    setRows((prev) => prev.filter((r) => r.id !== removeTarget.id));
    setRemoveTarget(null);
  }

  if (profile && !isAdminTier) {
    return (
      <div>
        <PageHeader eyebrow="Access" title="Staff" />
        <EmptyState
          icon={ShieldAlert}
          title="Administrators only"
          description="Ask a program administrator or principal to grant teacher or admin access."
        />
      </div>
    );
  }

  const filtered = rows
    .filter((r) => r.role !== "parent")
    .filter(
      (r) =>
        r.full_name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div>
      <PageHeader
        eyebrow="Access"
        title="Staff"
        description="Create a teacher, admin, or principal account with a temporary password, adjust an existing account's access, or remove one entirely."
        action={
          <Button onClick={openCreate}>
            <UserPlus className="h-4 w-4" /> Create staff account
          </Button>
        }
      />

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-700">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {error}
          {error.toLowerCase().includes("not found") && (
            <span className="ml-1">
              The <code className="font-mono">list-profiles</code> Edge Function may not be deployed yet — see the
              README.
            </span>
          )}
        </div>
      )}

      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-twilight-200" />
        <input
          className="input-field pl-10"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!loading && !error && filtered.length === 0 && (
        <EmptyState icon={ShieldCheck} title="No accounts found" description="Try a different search." />
      )}

      <div className="space-y-2">
        {filtered.map((r) => (
          <Card key={r.id}>
            <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={r.full_name} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-twilight-50">{r.full_name}</p>
                    {r.id === user?.id && <Pill tone="neutral">You</Pill>}
                  </div>
                  <p className="truncate text-xs text-twilight-200">{r.email || "No email on file"}</p>
                  <p className="text-[11px] text-twilight-200/70">Joined {formatDate(r.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {justSavedId === r.id && (
                  <span className="flex items-center gap-1 text-xs text-grow-500">
                    <Check className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
                <Pill tone={roleTone[r.role]}>{r.role}</Pill>
                <Select
                  className="!w-36 !py-1.5 !text-xs"
                  value={r.role}
                  disabled={savingId === r.id || r.id === user?.id}
                  onChange={(e) => changeRole(r.id, e.target.value as UserRole)}
                >
                  <option value="parent">Parent</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                  <option value="principal">Principal</option>
                </Select>
                <button
                  onClick={() => openRemove(r)}
                  disabled={r.id === user?.id}
                  title={r.id === user?.id ? "You can't remove your own account" : "Remove account"}
                  className="rounded-lg p-2 text-twilight-200 transition-colors hover:bg-coral-500/10 hover:text-coral-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-twilight-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {rows.length > 0 && (
        <p className="mt-4 text-xs text-twilight-200">
          You can't change your own role or remove your own account here — have another admin do it, so the program
          is never left without one.
        </p>
      )}

      <Modal
        open={createOpen}
        onOpenChange={(o) => !o && setCreateOpen(false)}
        title={created ? "Account created" : "Create staff account"}
        description={created ? undefined : "No email required — hand them this password directly."}
      >
        {created ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center py-2 text-center">
              <KeyRound className="h-10 w-10 text-grow-500" />
              <p className="mt-3 text-sm text-twilight-200">
                <span className="text-twilight-50">{created.email}</span> can now sign in as a{" "}
                <span className="text-twilight-50">{created.role}</span> with the temporary password below. They'll
                be asked to set their own password the moment they log in — this one stops working after that.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <span className="font-mono text-base tracking-wide text-twilight-50">{created.password}</span>
              <button
                onClick={copyPassword}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-black/15 bg-black/5 px-3 py-1.5 text-xs font-medium text-twilight-50 hover:bg-black/10"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-grow-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <p className="text-xs text-twilight-200">
              Copy this now — it won't be shown again. Share it however works best (in person, text message,
              WhatsApp); it doesn't need to go through email.
            </p>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setCreateOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={createAccount} className="space-y-4">
            {createError && (
              <div className="flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-700">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                {createError}
              </div>
            )}
            <div>
              <label className="label-field">Full name</label>
              <input
                required
                className="input-field"
                value={createForm.fullName}
                onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Sister Amina Khalid"
              />
            </div>
            <div>
              <label className="label-field">Email</label>
              <input
                required
                type="email"
                className="input-field"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="amina@example.com"
              />
            </div>
            <div>
              <label className="label-field">Access level</label>
              <Select value={createForm.role} onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as "teacher" | "admin" | "principal" }))}>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="principal">Principal</option>
              </Select>
            </div>
            <div>
              <label className="label-field">Temporary password</label>
              <div className="flex gap-2">
                <input
                  required
                  minLength={6}
                  className="input-field font-mono"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setCreateForm((f) => ({ ...f, password: generatePassword() }))}
                  title="Generate a new password"
                  className="flex shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/[0.03] px-3 hover:bg-black/[0.06]"
                >
                  <RefreshCw className="h-4 w-4 text-twilight-200" />
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-twilight-200">
                Edit it if you'd like, or use the generated one. At least 6 characters. They'll be required to
                change it on first login.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creating} disabled={!createForm.fullName || !createForm.email || createForm.password.length < 6}>
                Create account
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(removeTarget)}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title={`Remove ${removeTarget?.full_name ?? "this account"}?`}
      >
        {removeTarget && (
          <div className="space-y-4">
            {removeError && (
              <div className="flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-700">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                {removeError}
              </div>
            )}
            <div className="flex items-start gap-3 rounded-xl border border-coral-500/30 bg-coral-500/10 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral-700" />
              <p className="text-sm text-coral-700">{removeWarning[removeTarget.role]} This can't be undone.</p>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="secondary" onClick={() => setRemoveTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" loading={removing} onClick={confirmRemove}>
                Remove account
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
