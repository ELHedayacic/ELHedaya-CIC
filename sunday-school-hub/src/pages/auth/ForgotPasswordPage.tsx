import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, AlertCircle, MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/shared/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/set-password`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center py-4 text-center">
          <MailCheck className="h-10 w-10 text-grow-500" />
          <h1 className="mt-4 font-display text-xl font-semibold text-[#F5F9F6]">Check your email</h1>
          <p className="mt-2 text-sm text-[#97A99C]">
            If an account exists for <span className="text-[#F5F9F6]">{email}</span>, a reset link is on its
            way. Click it to choose a new password.
          </p>
          <Link to="/login" className="btn-secondary mt-6">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-semibold text-[#F5F9F6]">Reset your password</h1>
      <p className="mt-1 text-sm text-[#97A99C]">Enter your email and we'll send you a reset link.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div>
          <label className="label-field" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Send reset link <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#97A99C]">
        Remembered it?{" "}
        <Link to="/login" className="font-medium text-aurora-400 hover:text-aurora-300">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
