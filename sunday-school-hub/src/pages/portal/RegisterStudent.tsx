import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, Camera, User, CheckCircle2, PartyPopper } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SquarePaymentForm } from "@/components/shared/SquarePaymentForm";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { uploadToPrivateBucket, formatCurrency } from "@/lib/utils";
import type { FeeStructure } from "@/types";

export default function RegisterStudent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // After the child is registered, if the school has a default registration
  // fee configured, we show a payment step for it before wrapping up.
  const [registeredChild, setRegisteredChild] = useState<{ id: string; first_name: string } | null>(null);
  const [defaultFee, setDefaultFee] = useState<FeeStructure | null>(null);
  const [paid, setPaid] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    allergies: "",
    medical_notes: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    photo_release: false,
    notes: "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handlePhotoSelect(file: File | null) {
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Photo must be an image file (JPG, PNG, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB.");
      return;
    }
    setError(null);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);

    const { data: inserted, error } = await supabase
      .from("students")
      .insert({
        parent_id: user.id,
        first_name: form.first_name,
        last_name: form.last_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender || null,
        allergies: form.allergies || null,
        medical_notes: form.medical_notes || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        photo_release: form.photo_release,
        notes: form.notes || null,
      })
      .select()
      .single();

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // The photo needs the new student's id for its storage path, so it can
    // only upload after the row exists. Registration itself already
    // succeeded at this point, so a photo upload hiccup here shouldn't
    // block or alarm the parent — it can always be added afterward from
    // the child's card.
    if (photoFile && inserted) {
      try {
        const { path } = await uploadToPrivateBucket("student-photos", photoFile, inserted.id, {
          maxSizeMB: 5,
          allowedTypePrefixes: ["image/"],
        });
        await supabase.from("students").update({ photo_url: path }).eq("id", inserted.id);
      } catch {
        // best-effort — registration succeeded regardless
      }
    }

    // Check whether the school has a default registration fee configured.
    // If so, show a payment step next instead of leaving immediately —
    // if not, registration is simply done.
    const { data: fee } = await supabase
      .from("fee_structures")
      .select("*")
      .eq("is_default_registration", true)
      .eq("active", true)
      .maybeSingle();

    setLoading(false);

    if (fee && inserted) {
      setRegisteredChild({ id: inserted.id, first_name: inserted.first_name });
      setDefaultFee(fee);
    } else {
      navigate("/portal/students");
    }
  }

  if (registeredChild && defaultFee) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardBody>
            {paid ? (
              <div className="flex flex-col items-center py-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-grow-500" />
                <h1 className="mt-4 font-display text-xl font-semibold text-twilight-50">All set!</h1>
                <p className="mt-2 text-sm text-twilight-200">
                  {registeredChild.first_name} is registered and the registration fee is paid. A teacher will
                  place them in a class before the next term.
                </p>
                <Button className="mt-6" onClick={() => navigate("/portal/students")}>
                  Go to my children
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-5 flex flex-col items-center text-center">
                  <PartyPopper className="h-9 w-9 text-amber-500" />
                  <h1 className="mt-3 font-display text-xl font-semibold text-twilight-50">
                    {registeredChild.first_name} is registered!
                  </h1>
                  <p className="mt-1.5 text-sm text-twilight-200">
                    Complete registration by paying the {defaultFee.name} —{" "}
                    <span className="text-twilight-50">{formatCurrency(Number(defaultFee.amount))}</span>.
                  </p>
                </div>
                <SquarePaymentForm
                  amount={Number(defaultFee.amount)}
                  studentId={registeredChild.id}
                  feeStructureId={defaultFee.id}
                  note={defaultFee.name}
                  onSuccess={() => setPaid(true)}
                />
                <button
                  onClick={() => navigate("/portal/students")}
                  className="btn-ghost mt-4 w-full !text-xs text-twilight-200"
                >
                  Pay later instead
                </button>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost mb-4 !px-0 !text-xs text-twilight-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>
      <PageHeader
        eyebrow="Registration"
        title="Register a child"
        description="Add your child's details. A teacher will place them in a class before the next term."
      />

      <Card className="max-w-2xl">
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="h-20 w-20 shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-black/15 bg-black/[0.02]">
                    <User className="h-7 w-7 text-twilight-200" />
                  </div>
                )}
              </div>
              <div>
                <label className="btn-secondary cursor-pointer !py-2 !text-xs">
                  <Camera className="h-3.5 w-3.5" /> {photoPreview ? "Change photo" : "Add a photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoSelect(e.target.files?.[0] ?? null)}
                  />
                </label>
                <p className="mt-1.5 text-[11px] text-twilight-200">Optional — JPG or PNG, up to 5MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">First name</label>
                <input
                  required
                  className="input-field"
                  value={form.first_name}
                  onChange={(e) => update("first_name", e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">Last name</label>
                <input
                  required
                  className="input-field"
                  value={form.last_name}
                  onChange={(e) => update("last_name", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">Date of birth</label>
                <input
                  required
                  type="date"
                  className="input-field"
                  value={form.date_of_birth}
                  onChange={(e) => update("date_of_birth", e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">Gender (optional)</label>
                <input
                  className="input-field"
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label-field">Allergies</label>
              <input
                className="input-field"
                placeholder="e.g. peanuts, bee stings — leave blank if none"
                value={form.allergies}
                onChange={(e) => update("allergies", e.target.value)}
              />
            </div>

            <div>
              <label className="label-field">Medical notes</label>
              <textarea
                className="input-field min-h-20"
                placeholder="Anything a teacher should know"
                value={form.medical_notes}
                onChange={(e) => update("medical_notes", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">Emergency contact name</label>
                <input
                  className="input-field"
                  value={form.emergency_contact_name}
                  onChange={(e) => update("emergency_contact_name", e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">Emergency contact phone</label>
                <input
                  className="input-field"
                  value={form.emergency_contact_phone}
                  onChange={(e) => update("emergency_contact_phone", e.target.value)}
                />
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-black/10 bg-black/[0.02] p-4 text-sm text-twilight-200">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-black/20 bg-transparent accent-aurora-500"
                checked={form.photo_release}
                onChange={(e) => update("photo_release", e.target.checked)}
              />
              I give permission for my child to appear in class photos shared in the portal or on the
              school's social media.
            </label>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate("/portal/students")}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Register child
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
