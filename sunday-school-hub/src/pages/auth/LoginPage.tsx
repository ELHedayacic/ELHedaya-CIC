import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, AlertCircle, Mail, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/shared/AuthShell";
import { OrnateFlourish } from "@/components/shared/OrnateFlourish";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setLoading(false);
      setError(error);
      return;
    }

    // Fetch the role directly instead of reading it off auth context —
    // right after signIn() resolves, the context's profile may not have
    // finished updating yet, so relying on it here could send a staff
    // member to the family portal by mistake.
    let destination = "/portal";
    let mustChangePassword = false;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("role, must_change_password")
        .eq("id", user.id)
        .single();
      mustChangePassword = Boolean(freshProfile?.must_change_password);
      if (freshProfile?.role === "teacher" || freshProfile?.role === "admin" || freshProfile?.role === "principal") {
        destination = "/admin";
      }
    }

    setLoading(false);

    // Takes priority over "return to where you came from" — an admin-set
    // temp password always has to be changed before anything else,
    // regardless of what page originally sent them to /login.
    if (mustChangePassword) {
      navigate("/set-password", { replace: true });
      return;
    }

    const from = (location.state as { from?: Location })?.from?.pathname;
    navigate(from ?? destination, { replace: true });
  }

  return (
    <AuthShell>
      <OrnateFlourish className="mb-5" variant="dark" />
      <h1 className="text-center font-serif-display text-3xl font-bold text-[#F5F9F6]">Welcome back</h1>
      <p className="mt-1.5 text-center font-serif-body text-sm italic text-amber-400/90">
        Sign in to your family or staff account.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-amber-400" htmlFor="email">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500/70" />
            <input
              id="email"
              type="email"
              required
              className="input-field-ornate"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-amber-400" htmlFor="password">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs font-medium text-grow-400 hover:text-grow-300">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500/70" />
            <input
              id="password"
              type="password"
              required
              className="input-field-ornate"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-ornate-primary mt-2">
          {loading ? (
            "Signing in…"
          ) : (
            <>
              Sign in <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="font-serif-display text-xs tracking-widest text-[#97A99C]">OR</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <p className="text-center text-sm text-[#97A99C]">
        New here?{" "}
        <Link to="/signup" className="font-medium text-grow-400 hover:text-grow-300">
          Register your family
        </Link>
      </p>
    </AuthShell>
  );
}
