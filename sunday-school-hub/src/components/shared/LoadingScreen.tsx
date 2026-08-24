export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-twilight-900">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-aurora-500/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-aurora-500" />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-twilight-200">
          Loading
        </p>
      </div>
    </div>
  );
}
