import { useEffect, useState } from "react";
import { Home, ShieldAlert, Search, Check, Trash2, AlertTriangle, Users } from "lucide-react";
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

interface FamilyRow {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  created_at: string;
  email: string;
}

export default function AdminFamilies() {
  const { profile, user } = useAuth();
  const isAdminTier = profile?.role === "admin" || profile?.role === "principal";
  const [rows, setRows] = useState<FamilyRow[]>([]);
  const [childCounts, setChildCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [justSavedId, setJustSavedId] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<FamilyRow | null>(null);
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

    const { data: students } = await supabase.from("students").select("parent_id");
    const counts: Record<string, number> = {};
    (students ?? []).forEach((s) => {
      counts[s.parent_id] = (counts[s.parent_id] ?? 0) + 1;
    });
    setChildCounts(counts);

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
    // Promoting someone off "parent" moves them to the Staff page instead,
    // so they drop out of this filtered list once it reloads.
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, role } : r)));
    setJustSavedId(id);
    setTimeout(() => setJustSavedId(null), 1800);
  }

  function openRemove(row: FamilyRow) {
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
        <PageHeader eyebrow="Access" title="Families" />
        <EmptyState
          icon={ShieldAlert}
          title="Administrators only"
          description="Ask a program administrator or principal for access."
        />
      </div>
    );
  }

  const filtered = rows
    .filter((r) => r.role === "parent")
    .filter(
      (r) =>
        r.full_name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Families"
        description="Every registered family, with their children and account details. Families register themselves — this is for managing existing accounts."
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
        <EmptyState icon={Home} title="No families found" description="Try a different search." />
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
                <Pill tone="neutral">
                  <Users className="h-3 w-3" /> {childCounts[r.id] ?? 0} {childCounts[r.id] === 1 ? "child" : "children"}
                </Pill>
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
              <p className="text-sm text-coral-700">
                This permanently deletes their family account, including their registered children and payment
                history. This can't be undone.
              </p>
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
