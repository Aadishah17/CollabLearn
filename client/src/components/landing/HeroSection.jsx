import {
  ArrowRight,
  Clock3,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { resolvePublicWebsiteEntry } from '../../navbar/navLinks.js';
import {
  heroBoardLanes,
  landingCtaCopy,
  heroPulseItems,
  heroStats,
  heroStatusTiles,
  heroThreadItems,
} from './landingData.js';

export default function HeroSection({ hasSession, userRole, isSuperAdmin }) {
  const navigate = useNavigate();
  const publicEntry = resolvePublicWebsiteEntry({ hasSession, userRole, isSuperAdmin });

  return (
    <section
      className="hero-stage hero-beam relative overflow-hidden px-6 pb-12 pt-24 md:pb-18 md:pt-28 lg:pb-20 lg:pt-32"
      aria-label="Introduction"
    >
      <div
        className="ambient-grid pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-30"
        aria-hidden="true"
      />
      <div className="aurora-orb aurora-orb-warm left-[-8%] top-20 h-72 w-72" aria-hidden="true" />
      <div className="aurora-orb aurora-orb-cool right-[-2%] top-10 h-80 w-80" aria-hidden="true" />

      <div className="mx-auto grid max-w-[1480px] items-start gap-8 md:gap-10 lg:min-h-[calc(100svh-8.5rem)] grid-cols-1 lg:grid-cols-[minmax(0,0.5fr)_minmax(520px,0.5fr)]">
        <div className="relative z-10 max-w-[680px] pt-4 reveal-up lg:pt-12">
          <div className="eyebrow">
            <Sparkles size={14} className="text-red-300" aria-hidden="true" />A guided learning
            system with live support
          </div>

          <h1 className="mt-6 max-w-[12ch] text-4xl font-black leading-[0.94] tracking-tight text-white sm:text-5xl md:mt-8 md:text-7xl">
            Make the next move
            <span className="block text-red-400">obvious every week.</span>
          </h1>

          <p className="mt-5 max-w-[34rem] text-base leading-7 text-zinc-300 sm:text-lg md:mt-6 md:leading-8 md:text-xl">
            CollabLearn turns a vague skill goal into a living roadmap, mentor support, community
            feedback, and visible progress so learning keeps moving after the first burst of
            motivation fades.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(hasSession ? publicEntry.path : '/signup')}
              className="glass-cta"
              aria-label={hasSession ? `Go to ${publicEntry.label}` : landingCtaCopy.guestPrimary}
            >
              {hasSession ? landingCtaCopy.sessionPrimary : landingCtaCopy.guestPrimary}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            {hasSession ? (
              <button
                type="button"
                onClick={() => navigate('/ai-learning')}
                className="glass-outline-btn"
                aria-label="Open learning workspace"
              >
                {landingCtaCopy.sessionSecondary}
              </button>
            ) : (
              <Link
                to="/login"
                className="glass-outline-btn"
                aria-label={landingCtaCopy.guestSecondary}
              >
                {landingCtaCopy.guestSecondary}
              </Link>
            )}
          </div>
          <p className="mt-3 text-sm text-zinc-400">
            {hasSession ? landingCtaCopy.sessionTrust : landingCtaCopy.guestTrust}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-medium text-zinc-300 reveal-up reveal-delay-1 sm:mt-8 sm:gap-4">
            <span className="inline-flex items-center gap-2">
              <span className="signal-dot bg-emerald-400" aria-hidden="true" />
              Goal-first planning, mentor support, and community feedback in one loop
            </span>
            <Link
              to="/status"
              className="inline-flex items-center gap-2 text-zinc-200 transition-colors hover:text-blue-300"
            >
              <Clock3 size={15} className="text-blue-300" aria-hidden="true" />
              Public system status
            </Link>
          </div>
        </div>

        <div className="relative z-10 reveal-up reveal-delay-2 lg:pt-3">
          <div
            className="surface-card dashboard-shell hero-stage glow-frame orbit-shell float-drift relative min-h-[540px] overflow-hidden rounded-[36px] p-5 md:p-6 lg:min-h-[620px]"
            role="region"
            aria-label="Live product preview"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/4 via-transparent to-red-500/6"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute right-8 top-10 h-28 w-28 rounded-full bg-blue-500/12 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-y-0 left-[58%] hidden w-px bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block"
              aria-hidden="true"
            />

            <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  Live product scene
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Roadmap, support, and momentum in one screen
                </h2>
              </div>
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200">
                Week 2 active
              </div>
            </div>

            <div className="relative mt-5 grid gap-4 lg:grid-cols-[1.06fr_0.94fr]">
              <div className="rounded-[30px] border border-white/10 bg-black/25 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Current roadmap
                    </p>
                    <p className="mt-2 text-xl font-bold text-white">Frontend systems sprint</p>
                  </div>
                  <span className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-red-200">
                    3 active lanes
                  </span>
                </div>

                <div className="luminous-divider mt-4" aria-hidden="true" />

                <div className="mt-5 space-y-4">
                  {heroBoardLanes.map((lane, index) => (
                    <div
                      key={lane.label}
                      className={`glow-frame rounded-[24px] border p-4 transition duration-300 hover:-translate-y-0.5 ${lane.tone}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-2 pt-1">
                          <span className={`signal-dot ${lane.iconClass}`} aria-hidden="true" />
                          {index < heroBoardLanes.length - 1 ? (
                            <span className="h-10 w-px bg-white/12" aria-hidden="true" />
                          ) : null}
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                            {lane.label}
                          </p>
                          <p className="mt-2 text-lg font-semibold text-white">{lane.title}</p>
                          <p className="mt-2 text-sm leading-6 text-zinc-200">{lane.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="glow-frame rounded-[24px] border border-red-400/18 bg-red-500/[0.07] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Next mentor touchpoint</p>
                    <Clock3 size={16} className="text-red-300" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-lg font-bold text-white">CSS review with mentor</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Tomorrow at 7:00 PM with a focus on layout systems, responsive patterns, and
                    sharper component structure.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-100">
                    <span className="signal-dot bg-red-300" aria-hidden="true" />
                    30 min review booked
                  </div>
                </div>

                <div className="glow-frame rounded-[24px] border border-blue-400/18 bg-blue-500/[0.08] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Momentum curve</p>
                    <TrendingUp size={16} className="text-blue-300" aria-hidden="true" />
                  </div>
                  <div
                    className="mt-4 h-3 overflow-hidden rounded-full bg-white/8"
                    role="progressbar"
                    aria-valuenow={68}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="68% of monthly milestones completed"
                  >
                    <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-blue-400 via-sky-400 to-red-400 transition-all duration-700" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    You completed 68% of this month's milestones and kept the loop alive for four
                    straight study weeks.
                  </p>
                </div>

                <div className="glow-frame rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Community pressure</p>
                    <MessageSquare size={16} className="text-emerald-300" aria-hidden="true" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {heroThreadItems.map((thread) => (
                      <div
                        key={thread}
                        className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-3 text-sm text-zinc-200"
                      >
                        {thread}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
                  {heroStatusTiles.map((tile) => (
                    <div key={tile.label} className="metric-rail">
                      <p className="text-zinc-500">{tile.label}</p>
                      <p className="mt-2 text-base font-bold text-white normal-case tracking-normal">
                        {tile.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="grid gap-3 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="grid gap-3 sm:grid-cols-3">
              {heroStats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="metric-rail reveal-up"
                  style={{ animationDelay: `${120 + index * 80}ms` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-black text-white">{stat.value}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{stat.detail}</p>
                </div>
              ))}
            </div>

            <div
              className="signal-marquee rounded-[24px] px-3 py-3 reveal-up reveal-delay-2"
              aria-label="Feature highlights"
            >
              <div className="signal-marquee-track gap-3">
                {[...heroPulseItems, ...heroPulseItems].map((item, index) => (
                  <span key={`${item}-${index}`} className="signal-pill whitespace-nowrap">
                    <Sparkles size={12} className="text-red-300" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
