export default function AuthShowcase({
  badge,
  title,
  description,
  highlights,
  quote,
  quoteAttribution,
  stats,
}) {
  return (
    <div className="relative hidden w-[54%] overflow-hidden lg:flex">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.24),transparent_34%),linear-gradient(160deg,rgba(2,6,23,0.98),rgba(9,9,11,0.96))]" />
      <div className="ambient-grid pointer-events-none absolute inset-0 opacity-25" />
      <div className="pointer-events-none absolute left-[-8%] top-[18%] h-64 w-64 rounded-full bg-red-500/18 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-6%] h-72 w-72 rounded-full bg-blue-500/18 blur-[140px]" />

      <div className="relative z-10 flex w-full flex-col justify-between px-10 py-12 xl:px-14 xl:py-14">
        <div>
          <div className="eyebrow border-white/15 bg-white/6 text-zinc-200">
            {badge.icon}
            {badge.label}
          </div>

          <h2 className="mt-8 max-w-xl text-5xl font-black leading-[0.96] tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-300">
            {description}
          </p>

          <div className="mt-10 grid gap-4">
            {highlights.map((highlight) => (
              <div
                key={highlight.title}
                className="rounded-[26px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-black/20 text-red-200">
                    {highlight.icon}
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">{highlight.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">
                      {highlight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-5"
              >
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="surface-card p-6">
            <p className="text-lg leading-8 text-zinc-200">"{quote}"</p>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
              {quoteAttribution}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
