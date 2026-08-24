import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, AlertCircle, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/shared/AuthShell";
import LoadingScreen from "@/components/shared/LoadingScreen";

export default function SetPasswordPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // The email link (forgot-password or staff invite) redirects here with
    // tokens in the URL; detectSessionInUrl picks those up automatically,
    // but that happens asynchronously, so give it a moment before checking.
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setHasSession(Boolean(session));
      setCheckingSession(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    // Already have a valid session at this point — route straight in,
    // same as a normal login, rather than sending them back to sign in.
    let destination = "/portal";
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Always clear this — harmless no-op for anyone who arrived via the
      // old email-link flow (where it was never true), but essential for
      // an admin-created temp-password account, or ProtectedRoute would
      // immediately bounce them right back here after navigating away.
      await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);
      await refreshProfile();

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role === "teacher" || profile?.role === "admin" || profile?.role === "principal") {
        destination = "/admin";
      }
    }
    setLoading(false);
    navigate(destination, { replace: true });
  }

  if (checkingSession) return <LoadingScreen />;

  if (!hasSession) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center py-4 text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-coral-500/10">
            <AlertCircle className="h-5 w-5 text-coral-500" />
          </div>
          <h1 className="font-display text-xl font-semibold text-[#F5F9F6]">This link isn't valid</h1>
          <p className="mt-2 text-sm text-[#97A99C]">
            It may have expired, or already been used. Request a new link from the sign-in page.
          </p>
          <Button className="mt-6" onClick={() => navigate("/login")}>
            Back to sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-semibold text-[#F5F9F6]">Set your password</h1>
      <p className="mt-1 text-sm text-[#97A99C]">Choose a password for your account.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div>
          <label className="label-field" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        <div>
          <label className="label-field" htmlFor="confirmPassword">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            className="input-field"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Type it again"
          />
        </div>
        <Button type="submit" loading={loading} className="w-full">
          <KeyRound className="h-4 w-4" /> Set password <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthShell>
  );
}
