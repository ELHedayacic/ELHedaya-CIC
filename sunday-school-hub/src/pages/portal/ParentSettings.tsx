import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function ParentSettings() {
  const { profile, user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <PageHeader eyebrow="Account" title="Settings" description="Update your contact details." />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="label-field">Full name</label>
            <input className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="label-field">Email</label>
            <input className="input-field opacity-60" value={user?.email ?? ""} disabled />
          </div>
          <div>
            <label className="label-field">Phone</label>
            <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(336) 555-0100" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button loading={saving} onClick={save}>
              Save changes
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-grow-500">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
