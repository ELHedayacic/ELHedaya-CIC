import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, GraduationCap, CalendarClock, CreditCard, ArrowRight, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { useClasses } from "@/hooks/useClasses";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, age } from "@/lib/utils";
import type { Student, ClassSession, Payment } from "@/types";

export default function AdminDashboard() {
  const { classes } = useClasses();
  const [studentCount, setStudentCount] = useState(0);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [weekSessions, setWeekSessions] = useState<ClassSession[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);

  useEffect(() => {
    async function load() {
      const { count } = await supabase.from("students").select("*", { count: "exact", head: true });
      setStudentCount(count ?? 0);

      const { data: recents } = await supabase
        .from("students")
        .select("*, student_classes(classes(id, name, color))")
        .order("enrolled_at", { ascending: false })
        .limit(5);
      setRecentStudents(
        (recents ?? []).map((s: any) => ({
          ...s,
          classes: (s.student_classes ?? []).map((sc: any) => sc.classes).filter(Boolean),
        }))
      );

      const in7 = new Date();
      in7.setDate(in7.getDate() + 7);
      const { data: sessions } = await supabase
        .from("class_sessions")
        .select("*")
        .gte("session_date", new Date().toISOString().slice(0, 10))
        .lte("session_date", in7.toISOString().slice(0, 10))
        .order("session_date");
      setWeekSessions(sessions ?? []);

      const { data: pending } = await supabase.from("payments").select("*").eq("status", "pending");
      setPendingPayments(pending ?? []);
    }
    load();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Staff console"
        title="Program overview"
        description="A snapshot of enrollment, classes, and this week's schedule."
        action={
          <Link to="/admin/classes" className="btn-primary">
            <GraduationCap className="h-4 w-4" /> Manage classes
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total students" value={studentCount} icon={Users} accent="aurora" />
        <StatCard label="Active classes" value={classes.length} icon={GraduationCap} accent="grow" />
        <StatCard label="Sessions this week" value={weekSessions.length} icon={CalendarClock} accent="amber" />
        <StatCard
          label="Payments pending"
          value={pendingPayments.length}
          icon={CreditCard}
          accent="coral"
          hint={pendingPayments.length ? formatCurrency(pendingPayments.reduce((s, p) => s + Number(p.amount), 0)) : undefined}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recently registered</CardTitle>
            <Link to="/admin/students" className="btn-ghost !text-xs">
              View roster <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardBody>
            {recentStudents.length === 0 ? (
              <EmptyState icon={UserPlus} title="No registrations yet" description="New families will show up here." />
            ) : (
              <div className="space-y-3">
                {recentStudents.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-black/5 bg-black/[0.02] p-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${s.first_name} ${s.last_name}`} photoPath={s.photo_url} />
                      <div>
                        <p className="text-sm font-medium text-twilight-50">
                          {s.first_name} {s.last_name}
                        </p>
                        <p className="text-xs text-twilight-200">
                          Age {age(s.date_of_birth)} · {formatDate(s.enrolled_at)}
                        </p>
                      </div>
                    </div>
                    {s.classes && s.classes.length > 0 ? (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {s.classes.map((c) => (
                          <Pill key={c.id} tone="aurora">
                            {c.name}
                          </Pill>
                        ))}
                      </div>
                    ) : (
                      <Pill tone="amber">Needs class</Pill>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This week</CardTitle>
            <Link to="/admin/schedule" className="btn-ghost !text-xs">
              Calendar <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardBody>
            {weekSessions.length === 0 ? (
              <EmptyState icon={CalendarClock} title="Nothing scheduled" description="Add sessions from the schedule page." />
            ) : (
              <div className="space-y-3">
                {weekSessions.map((s) => (
                  <div key={s.id} className="border-b border-black/5 pb-3 last:border-0 last:pb-0">
                    <p className="font-mono text-xs text-aurora-600">{formatDate(s.session_date)}</p>
                    <p className="mt-0.5 text-sm font-medium text-twilight-50">{s.topic ?? "Class session"}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
