import { useEffect, useState } from "react";
import { MessageSquareText, Pin, Paperclip } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pill } from "@/components/ui/Pill";
import { useMyStudents } from "@/hooks/useMyStudents";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type { Announcement } from "@/types";
import { cn } from "@/lib/utils";

const audienceLabel: Record<string, string> = {
  all: "Everyone",
  class: "Your child's class",
  student: "Just for you",
};

export default function ParentMessages() {
  const { user } = useAuth();
  const { students } = useMyStudents();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      setAnnouncements(data ?? []);

      if (user) {
        const { data: reads } = await supabase.from("announcement_reads").select("announcement_id").eq("parent_id", user.id);
        setReadIds(new Set((reads ?? []).map((r) => r.announcement_id)));
      }
      setLoading(false);
    }
    load();
  }, [user]);

  async function markRead(id: string) {
    if (!user || readIds.has(id)) return;
    await supabase.from("announcement_reads").insert({ announcement_id: id, parent_id: user.id });
    setReadIds((prev) => new Set(prev).add(id));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="Messages"
        description="Updates your teacher posts appear here — no email required."
      />

      {!loading && announcements.length === 0 && (
        <EmptyState icon={MessageSquareText} title="No messages yet" description="Teacher updates will appear here." />
      )}

      <div className="space-y-3">
        {announcements
          .sort((a, b) => Number(b.pinned) - Number(a.pinned))
          .map((a) => {
            const isRead = readIds.has(a.id);
            const relevantChild = students.find((s) => s.id === a.student_id);
            return (
              <Card
                key={a.id}
                onClick={() => markRead(a.id)}
                className={cn("cursor-pointer transition-colors", !isRead && "border-aurora-500/40")}
              >
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {a.pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                      <h3 className="font-display text-base font-semibold text-twilight-50">{a.title}</h3>
                      {!isRead && <span className="h-2 w-2 rounded-full bg-aurora-500" />}
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-twilight-200">{formatDate(a.created_at)}</span>
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
                      {a.audience === "student" && relevantChild
                        ? `For ${relevantChild.first_name}`
                        : audienceLabel[a.audience]}
                    </Pill>
                  </div>
                </CardBody>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
