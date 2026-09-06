import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';
import LandingNavbar from '../../navbar/landingNavbar';

export function PublicShell({ eyebrow, title, copy, chips = [], cta, children }) {
  return (
    <div className="dashboard-shell glass-page min-h-screen overflow-x-hidden text-zinc-100">
      <a
        href="#public-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-red-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>
      <LandingNavbar />
      <main id="public-main-content" className="px-4 pb-16 pt-32 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <section className="surface-card surface-card-shimmer hero-stage hero-beam relative overflow-hidden p-7 md:p-8">
            <div
              className="aurora-orb aurora-orb-warm left-[-8%] top-0 h-44 w-44"
              aria-hidden="true"
            />
            <div
              className="aurora-orb aurora-orb-cool right-[3%] top-10 h-52 w-52"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
              aria-hidden="true"
            />
            <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div>
                <div className="eyebrow">
                  <Sparkles size={14} className="text-red-300" aria-hidden="true" />
                  {eyebrow}
                </div>
                <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
                  {title}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
                  {copy}
                </p>
                {chips.length ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <span
                        key={chip}
                        className="glass-chip border-white/15 bg-white/[0.04] text-zinc-200"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="grid gap-3">
                {cta ? (
                  <Link to={cta.to} className="glass-cta justify-between">
                    <span>{cta.label}</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                ) : null}
                <Link to="/status" className="glass-outline-btn justify-between">
                  <span>Check status</span>
                  <Clock3 size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
          {children}
        </div>
      </main>
    </div>
  );
}

export function PublicNotice({ title, copy }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-zinc-300">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2">{copy}</p>
    </div>
  );
}

export function PublicLoading({ label }) {
  return (
    <div className="surface-card p-6 md:p-7" role="status" aria-live="polite">
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-40 rounded-full bg-white/12" />
        <div className="h-10 w-full rounded-2xl bg-white/8" />
        <div className="h-10 w-[92%] rounded-2xl bg-white/8" />
        <div className="h-10 w-[84%] rounded-2xl bg-white/8" />
        <p className="pt-1 text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500">
          {label}
        </p>
      </div>
    </div>
  );
}
