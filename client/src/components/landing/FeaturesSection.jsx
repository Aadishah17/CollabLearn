import { ArrowRight, BookOpen, CheckCircle2, Sparkles, Target, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { featureCards, quickSignals, rhythmPoints, workflowLanes } from './landingData.js';

export default function FeaturesSection() {
  return (
    <>
      <section className="px-6 py-6" aria-label="Quick signals">
        <div className="mx-auto grid max-w-7xl gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {quickSignals.map((signal, index) => (
            <div
              key={signal.title}
              className="glow-frame interactive-tile reveal-up relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-5"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${signal.haloClass}`} aria-hidden="true" />
              <div className="relative">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${signal.iconClass}`}>
                  <signal.icon size={20} aria-hidden="true" />
                </div>
                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  {signal.title}
                </p>
                <p className="mt-3 text-2xl font-black leading-tight text-white">{signal.value}</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{signal.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-10 pt-8" aria-label="Learning rhythm">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="surface-card glow-frame overflow-hidden p-6 md:p-8">
              <div className="eyebrow">
                <Target size={14} className="text-red-300" aria-hidden="true" />
                The learning rhythm
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-4xl">
                A study system that feels like an interface, not a pile of tools.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-300 md:text-base">
                CollabLearn works best when planning, practice, feedback, and teaching stay connected.
                The website should make that loop feel obvious at a glance.
              </p>

              <div className="mt-8 space-y-3">
                {rhythmPoints.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
                  >
                    <span className="signal-dot mt-1 bg-red-400" aria-hidden="true" />
                    <p className="text-sm leading-6 text-zinc-200">{item}</p>
                  </div>
                ))}
              </div>

              <div className="luminous-divider mt-8" aria-hidden="true" />

              <div className="mt-8 rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  Product promise
                </p>
                <p className="mt-3 text-base leading-7 text-zinc-200">
                  Keep the next action obvious, keep support close, and make progress visible enough
                  that momentum does not disappear after the first week.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {workflowLanes.map((lane, index) => (
                <div
                  key={lane.title}
                  className="glow-frame interactive-tile reveal-up relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-6"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${lane.accent}`} aria-hidden="true" />
                  <div className="relative">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${lane.iconClass}`}>
                      <lane.icon size={20} aria-hidden="true" />
                    </div>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
                      {lane.eyebrow}
                    </p>
                    <h3 className="mt-3 text-2xl font-bold leading-tight text-white">{lane.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-zinc-300">{lane.copy}</p>
                    <div className="mt-5 space-y-3">
                      {lane.bullets.map((bullet) => (
                        <div key={bullet} className="flex items-start gap-3">
                          <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-300" aria-hidden="true" />
                          <p className="text-sm leading-6 text-zinc-200">{bullet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-24" aria-label="Platform features">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="eyebrow">
              <BookOpen size={14} className="text-blue-300" aria-hidden="true" />
              Platform features
            </div>
            <h2 className="section-title mt-6">
              One workspace for learning, teaching, and staying consistent.
            </h2>
            <p className="section-copy mt-5 max-w-2xl">
              The product already has the pieces learners usually stitch together across five different tools. CollabLearn keeps them in one flow.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature, index) => (
              <div
                key={feature.title}
                className={`feature-tile glow-frame interactive-tile reveal-up relative overflow-hidden ${feature.featured ? 'xl:col-span-2 xl:grid xl:grid-cols-[0.82fr_1.18fr] xl:items-center xl:gap-8' : ''}`}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent}`} aria-hidden="true" />
                <div className="relative">
                  {feature.badge ? (
                    <div className="inline-flex rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">
                      {feature.badge}
                    </div>
                  ) : null}
                  <div className={`${feature.badge ? 'mt-4 ' : ''}flex h-12 w-12 items-center justify-center rounded-2xl border ${feature.iconClass}`}>
                    <feature.icon size={22} aria-hidden="true" />
                  </div>
                </div>
                <div className="relative">
                  <h3 className="mt-5 text-2xl font-bold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">{feature.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
