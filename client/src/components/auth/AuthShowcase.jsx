export default function AuthShowcase({
  badge,
  title,
  description,
  highlights,
  workspacePreview,
  quote,
  quoteAttribution,
  stats,
}) {
  return (
    <>
      <div className="w-full px-6 pb-12 pt-2 sm:px-10 lg:hidden">
        <div className="surface-card overflow-hidden p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="eyebrow border-white/15 bg-white/6 text-zinc-200">
              {badge.icon}
              {badge.label}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
              Fast start
            </p>
          </div>

          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            {description}
          </p>

          <div className="mt-5 grid gap-3">
            {highlights.slice(0, 2).map((highlight) => (
              <div
                key={highlight.title}
                className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-black/20 text-red-200">
                    {highlight.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{highlight.title}</p>
                    <p className="mt-1 text-xs leading-6 text-zinc-300">
                      {highlight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[20px] border border-white/10 bg-black/20 px-3 py-4"
              >
                <p className="text-xl font-black text-white">{stat.value}</p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm leading-7 text-zinc-200">"{quote}"</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
              {quoteAttribution}
            </p>
          </div>
        </div>
      </div>

      <div className="relative hidden w-[54%] overflow-hidden lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.24),transparent_34%),linear-gradient(160deg,rgba(2,6,23,0.98),rgba(9,9,11,0.96))]" />
        <div className="ambient-grid pointer-events-none absolute inset-0 opacity-25" />
        <div className="pointer-events-none absolute left-[-8%] top-[18%] h-64 w-64 rounded-full bg-red-500/18 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[-10%] right-[-6%] h-72 w-72 rounded-full bg-blue-500/18 blur-[140px]" />

        <div className="relative z-10 grid w-full grid-rows-[auto_auto_1fr] gap-8 px-10 py-12 xl:px-14 xl:py-14">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div className="eyebrow border-white/15 bg-white/6 text-zinc-200">
                {badge.icon}
                {badge.label}
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
                Workspace preview
              </p>
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

          {workspacePreview ? (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
                    {workspacePreview.eyebrow}
                  </p>
                  <h3 className="mt-3 text-2xl font-bold text-white">{workspacePreview.title}</h3>
                </div>
                <div className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Ready now
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {workspacePreview.items.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-xs font-black text-red-200">
                      0{index + 1}
                    </div>
                    <p className="text-sm leading-6 text-zinc-200">{item}</p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm leading-7 text-zinc-300">{workspacePreview.footer}</p>
            </div>
          ) : null}

          <div className="space-y-6 self-end">
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

            <div className="surface-card grid gap-4 p-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="text-lg leading-8 text-zinc-200">"{quote}"</p>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  {quoteAttribution}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  What this screen sets up
                </p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-200">
                  <p>One place to enter the workspace and see the next action immediately.</p>
                  <p>One shared surface for roadmap progress, mentor support, and learning momentum.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
