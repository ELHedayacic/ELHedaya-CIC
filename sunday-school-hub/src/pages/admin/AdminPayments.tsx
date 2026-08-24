import { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, Clock, XCircle, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import { StatCard } from "@/components/ui/StatCard";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Payment } from "@/types";

const statusMeta: Record<string, { icon: any; tone: "grow" | "amber" | "coral" | "neutral"; label: string }> = {
  completed: { icon: CheckCircle2, tone: "grow", label: "Completed" },
  pending: { icon: Clock, tone: "amber", label: "Pending" },
  failed: { icon: XCircle, tone: "coral", label: "Failed" },
  refunded: { icon: RotateCcw, tone: "neutral", label: "Refunded" },
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<(Payment & { parent_name?: string; student_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  async function load() {
    setLoading(true);
    const { data: payData } = await supabase
      .from("payments")
      .select("*, profiles(full_name), students(first_name, last_name)")
      .order("created_at", { ascending: false });
    setPayments(
      (payData ?? []).map((p: any) => ({
        ...p,
        parent_name: p.profiles?.full_name,
        student_name: p.students ? `${p.students.first_name} ${p.students.last_name}` : undefined,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markCompleted(id: string) {
    await supabase.from("payments").update({ status: "completed" }).eq("id", id);
    load();
  }

  const totalCollected = payments.filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const filteredPayments = statusFilter === "all" ? payments : payments.filter((p) => p.status === statusFilter);

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="Payments"
        description="Every transaction families have made. Set up what they can pay for on the Fees page."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Collected" value={formatCurrency(totalCollected)} icon={CheckCircle2} accent="grow" />
        <StatCard label="Pending" value={formatCurrency(totalPending)} icon={Clock} accent="amber" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <div className="w-40">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="!py-1.5 !text-xs">
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </Select>
          </div>
        </CardHeader>
        <CardBody>
          {!loading && filteredPayments.length === 0 ? (
            <EmptyState icon={CreditCard} title="No transactions" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-twilight-200">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Family</th>
                    <th className="pb-3 font-medium">Student</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => {
                    const meta = statusMeta[p.status];
                    return (
                      <tr key={p.id} className="border-b border-black/5 last:border-0">
                        <td className="py-3 text-twilight-200">{formatDate(p.created_at)}</td>
                        <td className="py-3 text-twilight-50">{p.parent_name ?? "—"}</td>
                        <td className="py-3 text-twilight-200">{p.student_name ?? "—"}</td>
                        <td className="py-3 font-medium text-twilight-50">{formatCurrency(Number(p.amount))}</td>
                        <td className="py-3">
                          <Pill tone={meta.tone}>
                            <meta.icon className="h-3 w-3" /> {meta.label}
                          </Pill>
                        </td>
                        <td className="py-3 text-right">
                          {p.status === "pending" && (
                            <button onClick={() => markCompleted(p.id)} className="text-xs font-medium text-aurora-600 hover:text-aurora-700">
                              Mark paid
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
