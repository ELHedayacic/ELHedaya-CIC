import { Terminal } from "lucide-react";

export function ConfigNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <img src="/logo.png" alt="El Hedaya Islamic School" className="h-9 w-9 rounded-lg object-contain" />
          <span className="font-display text-lg font-semibold text-twilight-50">El Hedaya Islamic School</span>
        </div>

        <div className="glass-card p-8">
          <h1 className="font-display text-xl font-semibold text-twilight-50">Almost there — connect Supabase</h1>
          <p className="mt-2 text-sm text-twilight-200">
            This app can't reach a database yet, so there's nothing to render. Add your project's
            keys and it'll come right up.
          </p>

          <div className="mt-6 space-y-4 text-sm">
            <Step n={1} title="Copy the env template">
              <code className="mt-1 block rounded-lg bg-twilight-900/80 px-3 py-2 font-mono text-xs text-twilight-100">
                cp .env.example .env
              </code>
            </Step>
            <Step n={2} title="Fill in your Supabase project URL and anon key">
              <p className="mt-1 text-twilight-200">
                Find both in your Supabase dashboard under <span className="text-twilight-50">Settings → API</span>.
              </p>
            </Step>
            <Step n={3} title="Restart the dev server">
              <code className="mt-1 block rounded-lg bg-twilight-900/80 px-3 py-2 font-mono text-xs text-twilight-100">
                npm run dev
              </code>
              <p className="mt-1 text-twilight-200">
                Vite only reads <span className="font-mono text-twilight-100">.env</span> on startup, so stop
                and re-run the server after editing it — a browser refresh alone won't pick it up.
              </p>
            </Step>
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-xl border border-black/10 bg-black/[0.02] p-3.5 text-xs text-twilight-200">
            <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Full setup steps — including running the database migration — are in README.md.
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aurora-500/15 font-mono text-xs font-semibold text-aurora-600">
        {n}
      </div>
      <div>
        <p className="font-medium text-twilight-50">{title}</p>
        {children}
      </div>
    </div>
  );
}
