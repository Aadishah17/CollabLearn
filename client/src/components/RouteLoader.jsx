export default function RouteLoader() {
  return (
    <div className="glass-page flex min-h-screen items-center justify-center px-6">
      <div className="surface-card w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-2 border-white/15 border-t-red-500" />
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-300/80">
          CollabLearn
        </p>
        <h1 className="mt-3 text-2xl font-bold text-white">Loading your workspace</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-300">
          Pulling in your roadmap, sessions, and community activity.
        </p>
      </div>
    </div>
  );
}
