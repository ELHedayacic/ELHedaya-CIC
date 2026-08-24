import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Unhandled error in app tree:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center px-6 py-12">
          <div className="glass-card w-full max-w-md p-8 text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-coral-500/10">
              <AlertTriangle className="h-5 w-5 text-coral-700" />
            </div>
            <h1 className="font-display text-lg font-semibold text-twilight-50">Something went wrong</h1>
            <p className="mt-2 text-sm text-twilight-200">
              The app hit an unexpected error instead of loading. Check the browser console for
              details, or reload to try again.
            </p>
            <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-twilight-900/80 p-3 text-left font-mono text-[11px] text-coral-400">
              {this.state.error.message}
            </pre>
            <button className="btn-primary mt-5" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
