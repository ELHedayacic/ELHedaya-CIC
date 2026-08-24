import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, AlertCircle, CheckCircle2, CalendarDays, BookOpen, LineChart, CreditCard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/shared/AuthShell";

function FeatureChip({ icon: Icon, label }: { icon: typeof CalendarDays; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-aurora-400" />
      <span className="text-xs text-[#97A99C]">{label}</span>
    </div>
  );
}

export default function SignupPage() {
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      setLoading(false);
      setError(error);
      return;
    }
    // Auto sign-in if email confirmation is disabled on the Supabase project.
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (!signInError) {
      navigate("/portal", { replace: true });
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-grow-500" />
          <h1 className="mt-4 font-display text-xl font-semibold text-[#F5F9F6]">Check your email</h1>
          <p className="mt-2 text-sm text-[#97A99C]">
            We sent a confirmation link to <span className="text-[#F5F9F6]">{email}</span>. Confirm your
            address, then sign in to finish setting up your family.
          </p>
          <Link to="/login" className="btn-primary mt-6">
            Go to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-semibold text-[#F5F9F6]">Create your family account</h1>
      <p className="mt-1 text-sm text-[#97A99C]">
        Your one place to stay connected with your child's Sunday School experience — register once,
        then everything below is a click away.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <FeatureChip icon={CalendarDays} label="Weekly schedule" />
        <FeatureChip icon={BookOpen} label="Homework updates" />
        <FeatureChip icon={LineChart} label="Progress & badges" />
        <FeatureChip icon={CreditCard} label="Pay fees online" />
      </div>

      <div className="my-6 h-px bg-white/10" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div>
          <label className="label-field" htmlFor="fullName">
            Parent / guardian name
          </label>
          <input
            id="fullName"
            required
            className="input-field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jamie Rivera"
          />
        </div>
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
        <div>
          <label className="label-field" htmlFor="password">
            Password
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
        <Button type="submit" loading={loading} className="w-full">
          Create account <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#97A99C]">
        Already registered?{" "}
        <Link to="/login" className="font-medium text-aurora-400 hover:text-aurora-300">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
