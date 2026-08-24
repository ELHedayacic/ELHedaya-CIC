import { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, Clock, XCircle, RotateCcw, Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pill } from "@/components/ui/Pill";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SquarePaymentForm } from "@/components/shared/SquarePaymentForm";
import { useMyStudents } from "@/hooks/useMyStudents";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { FeeStructure, Payment, FeeCategory } from "@/types";

const categoryLabel: Record<FeeCategory, string> = {
  general: "General Fee",
  books: "Books",
  supplies: "Supplies",
  other: "Other",
};

const statusMeta: Record<string, { icon: any; tone: "grow" | "amber" | "coral" | "neutral"; label: string }> = {
  completed: { icon: CheckCircle2, tone: "grow", label: "Paid" },
  pending: { icon: Clock, tone: "amber", label: "Pending" },
  failed: { icon: XCircle, tone: "coral", label: "Failed" },
  refunded: { icon: RotateCcw, tone: "neutral", label: "Refunded" },
};

export default function ParentPayments() {
  const { user } = useAuth();
  const { students } = useMyStudents();
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payingFee, setPayingFee] = useState<FeeStructure | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  async function load() {
    const { data: feeData } = await supabase.from("fee_structures").select("*").eq("active", true).order("due_date");
    setFees(feeData ?? []);

    if (user) {
      const { data: payData } = await supabase
        .from("payments")
        .select("*")
        .eq("parent_id", user.id)
        .order("created_at", { ascending: false });
      setPayments(payData ?? []);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function openPay(fee: FeeStructure) {
    setSelectedStudent(students[0]?.id ?? "");
    setPayingFee(fee);
  }

  const paidFeeIds = new Set(payments.filter((p) => p.status === "completed").map((p) => p.fee_structure_id));

  return (
    <div>
      <PageHeader eyebrow="Billing" title="Payments" description="Pay registration, term, and event fees securely with Square." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Fees due</CardTitle>
        </CardHeader>
        <CardBody>
          {fees.length === 0 ? (
            <EmptyState icon={CreditCard} title="No fees posted" description="Fee requests from the school will appear here." />
          ) : (
            <div className="space-y-3">
              {fees.map((f) => {
                const paid = paidFeeIds.has(f.id);
                return (
                  <div
                    key={f.id}
                    className="flex flex-col items-start justify-between gap-3 rounded-xl border border-black/5 bg-black/[0.02] p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-twilight-50">{f.name}</p>
                        <Pill tone="neutral">{categoryLabel[f.category]}</Pill>
                      </div>
                      {f.description && <p className="mt-1 text-xs text-twilight-200">{f.description}</p>}
                      {f.due_date && <p className="mt-1 font-mono text-[11px] text-twilight-200">Due {formatDate(f.due_date)}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg font-semibold text-twilight-50">{formatCurrency(f.amount)}</span>
                      {paid ? (
                        <Pill tone="grow">Paid</Pill>
                      ) : (
                        <button className="btn-primary !py-2" onClick={() => openPay(f)} disabled={students.length === 0}>
                          Pay now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {students.length === 0 && fees.length > 0 && (
            <p className="mt-3 text-xs text-twilight-200">Register a child before paying so we can match the payment.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardBody>
          {payments.length === 0 ? (
            <EmptyState icon={Receipt} title="No payments yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-twilight-200">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const meta = statusMeta[p.status];
                    return (
                      <tr key={p.id} className="border-b border-black/5 last:border-0">
                        <td className="py-3 text-twilight-200">{formatDate(p.created_at)}</td>
                        <td className="py-3 font-medium text-twilight-50">{formatCurrency(Number(p.amount))}</td>
                        <td className="py-3">
                          <Pill tone={meta.tone}>
                            <meta.icon className="h-3 w-3" /> {meta.label}
                          </Pill>
                        </td>
                        <td className="py-3">
                          {p.square_receipt_url ? (
                            <a href={p.square_receipt_url} target="_blank" rel="noreferrer" className="text-aurora-600 hover:text-aurora-700">
                              View
                            </a>
                          ) : (
                            <span className="text-twilight-200">—</span>
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

      {payingFee && (
        <Modal open onOpenChange={(o) => !o && setPayingFee(null)} title={`Pay: ${payingFee.name}`} description={payingFee.description ?? undefined}>
          <div className="space-y-4">
            {students.length > 1 && (
              <div>
                <label className="label-field">Which child is this for?</label>
                <Select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <SquarePaymentForm
              amount={Number(payingFee.amount)}
              studentId={selectedStudent}
              feeStructureId={payingFee.id}
              note={payingFee.name}
              onSuccess={() => {
                setPayingFee(null);
                load();
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
