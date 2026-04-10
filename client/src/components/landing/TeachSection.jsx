import { ArrowRight, CheckCircle2, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ctaFeatures, landingCtaCopy, learnerBenefits, teacherBenefits } from './landingData.js';

export default function TeachSection({ hasSession, publicEntry, navigate }) {
  return (
    <>
      <section id="teach" className="px-6 py-24" aria-label="Learning and teaching">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="eyebrow">
              <Users size={14} className="text-blue-300" aria-hidden="true" />
              Built for both sides
            </div>
            <h2 className="section-title mt-6">Learn new skills or turn your expertise into a teaching lane.</h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="surface-card glow-frame p-7 md:p-8">
              <div className="inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-200">
                For learners
              </div>
              <h3 className="mt-5 text-3xl font-black text-white">Stay accountable when self-study starts slipping.</h3>
              <ul className="mt-6 space-y-4 text-sm leading-7 text-zinc-300">
                {learnerBenefits.map((benefit, index) => (
                  <li key={index} className="flex gap-3">
                    <benefit.icon size={18} className="mt-1 shrink-0 text-emerald-300" aria-hidden="true" />
                    {benefit.text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface-card glow-frame orbit-shell p-7 md:p-8">
              <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-200">
                For teachers
              </div>
              <h3 className="mt-5 text-3xl font-black text-white">Teach what you know and build real trust with students.</h3>
              <ul className="mt-6 space-y-4 text-sm leading-7 text-zinc-300">
                {teacherBenefits.map((benefit, index) => (
                  <li key={index} className="flex gap-3">
                    <benefit.icon size={18} className="mt-1 shrink-0 text-emerald-300" aria-hidden="true" />
                    {benefit.text}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  to="/teach"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-red-400/45 hover:bg-red-500/12"
                >
                  Explore teaching
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 pt-8" aria-label="Call to action">
        <div className="mx-auto max-w-5xl">
          <div className="surface-card hero-stage hero-beam glow-frame relative overflow-hidden p-8 md:p-12">
            <div className="aurora-orb aurora-orb-warm left-[-6%] top-10 h-36 w-36" aria-hidden="true" />
            <div className="aurora-orb aurora-orb-cool right-[8%] top-8 h-40 w-40" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-red-500/6 via-transparent to-blue-500/8" aria-hidden="true" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-3xl">
                <div className="eyebrow">
                  <Sparkles size={14} className="text-red-300" aria-hidden="true" />
                  Ready to get moving
                </div>
                <h2 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
                  Build a learning system
                  <span className="block text-red-400">that survives past week one.</span>
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
                  Start with a guided roadmap, add mentor sessions when needed, and keep the feedback loop active through community and messaging.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {ctaFeatures.map((item) => (
                    <span key={item} className="glass-chip">
                      <CheckCircle2 size={14} className="text-emerald-300" aria-hidden="true" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  onClick={() => navigate(hasSession ? publicEntry.path : '/signup')}
                  className="glass-cta"
                  aria-label={hasSession ? publicEntry.label : landingCtaCopy.guestPrimary}
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
            </div>
            <p className="relative mt-4 text-sm text-zinc-400">
              {hasSession ? landingCtaCopy.sessionTrust : landingCtaCopy.guestTrust}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
