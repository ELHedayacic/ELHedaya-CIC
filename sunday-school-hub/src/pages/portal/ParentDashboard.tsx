import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, CalendarDays, BookOpen, CreditCard, ArrowRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { useMyStudents } from "@/hooks/useMyStudents";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatDate, formatTime, formatCurrency, age } from "@/lib/utils";
import type { ClassSession, Announcement, Payment } from "@/types";

export default function ParentDashboard() {
  const { profile } = useAuth();
  const { students, loading } = useMyStudents();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);

  useEffect(() => {
    async function loadExtras() {
      const classIds = [...new Set(students.flatMap((s) => (s.classes ?? []).map((c) => c.id)))];

      if (classIds.length) {
        const { data: sessionData } = await supabase
          .from("class_sessions")
          .select("*")
          .in("class_id", classIds)
          .gte("session_date", new Date().toISOString().slice(0, 10))
          .order("session_date", { ascending: true })
          .limit(3);
        setSessions(sessionData ?? []);
      }

      const { data: ann } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      setAnnouncements(ann ?? []);

      const { data: pay } = await supabase
        .from("payments")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      setPendingPayments(pay ?? []);
    }
    if (!loading) loadExtras();
  }, [students, loading]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div>
      <PageHeader
        eyebrow="Family overview"
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening with your family this week."
        action={
          <Link to="/portal/students/new" className="btn-primary">
            <Sparkles className="h-4 w-4" /> Register a child
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Children enrolled" value={students.length} icon={Users} accent="aurora" />
        <StatCard
          label="Upcoming sessions"
          value={sessions.length}
          icon={CalendarDays}
          accent="grow"
          hint={sessions[0] ? formatDate(sessions[0].session_date) : undefined}
        />
        <StatCard label="Unread updates" value={announcements.length} icon={BookOpen} accent="amber" />
        <StatCard
          label="Payments due"
          value={pendingPayments.length}
          icon={CreditCard}
          accent="coral"
          hint={
            pendingPayments.length
              ? formatCurrency(pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0))
              : undefined
          }
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your children</CardTitle>
            <Link to="/portal/students" className="btn-ghost !text-xs">
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardBody>
            {students.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No children registered yet"
                description="Add your first child to get them into a class and on the schedule."
                action={
                  <Link to="/portal/students/new" className="btn-primary">
                    Register a child
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {students.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-black/5 bg-black/[0.02] p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={`${s.first_name} ${s.last_name}`} photoPath={s.photo_url} />
                      <div>
                        <p className="text-sm font-medium text-twilight-50">
                          {s.first_name} {s.last_name}
                        </p>
                        <p className="text-xs text-twilight-200">Age {age(s.date_of_birth)}</p>
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
                      <Pill tone="neutral">Awaiting class</Pill>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest updates</CardTitle>
          </CardHeader>
          <CardBody>
            {announcements.length === 0 ? (
              <EmptyState icon={BookOpen} title="No updates yet" description="Teacher posts will show up here." />
            ) : (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <div key={a.id} className="border-b border-black/5 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-twilight-50">{a.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-twilight-200">{a.body}</p>
                    <p className="mt-1 font-mono text-[11px] text-twilight-200/70">{formatDate(a.created_at)}</p>
                  </div>
                ))}
                <Link to="/portal/messages" className="btn-ghost !px-0 !text-xs">
                  View all updates <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {sessions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Next up on the schedule</CardTitle>
            <Link to="/portal/schedule" className="btn-ghost !text-xs">
              Full schedule <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {sessions.map((s) => (
                <div key={s.id} className="rounded-xl border border-black/5 bg-black/[0.02] p-4">
                  <p className="font-mono text-xs text-aurora-600">{formatDate(s.session_date)}</p>
                  <p className="mt-1 text-sm font-medium text-twilight-50">{s.topic ?? "Class session"}</p>
                  <p className="mt-1 text-xs text-twilight-200">
                    {formatTime(s.start_time)} – {formatTime(s.end_time)}
                    {s.location ? ` · ${s.location}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
