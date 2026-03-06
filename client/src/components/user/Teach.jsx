import { createElement, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  CalendarClock,
  CircleDollarSign,
  Layers3,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';
import MainNavbar from '../../navbar/mainNavbar';

const PROGRAM_BENEFITS = [
  {
    icon: CircleDollarSign,
    title: 'Revenue that compounds',
    copy: 'Bundle recordings, office hours, and premium cohorts so your best teaching work earns beyond one live session.',
  },
  {
    icon: Layers3,
    title: 'Reuse what you already built',
    copy: 'Turn workshop notes, playlists, modules, and templates into a structured learning product without rebuilding everything.',
  },
  {
    icon: ShieldCheck,
    title: 'Less operational drag',
    copy: 'CollabLearn handles discovery surfaces, learning workflows, and community touchpoints so your teaching stays the focus.',
  },
];

const CREATOR_FORMATS = [
  {
    title: 'Micro-cohort',
    detail: 'A 2-4 week guided sprint with live checkpoints and shared modules.',
  },
  {
    title: 'Recorded path',
    detail: 'Turn proven lessons into a self-paced system with community threads and follow-up prompts.',
  },
  {
    title: 'Mentor office hours',
    detail: 'Offer recurring feedback blocks for learners already inside your subject area.',
  },
];

const ROADMAP = [
  { title: 'Apply', copy: 'Show us your topic, teaching style, and strongest learning assets.' },
  { title: 'Shape', copy: 'We help position your offer, pacing, and learner outcome.' },
  { title: 'Launch', copy: 'Publish the page, open community discussion, and invite the first cohort.' },
  { title: 'Scale', copy: 'Reuse modules, iterate content, and expand into additional formats.' },
];

const FAQS = [
  {
    question: 'Do I need a full course before applying?',
    answer: 'No. Existing workshops, playlists, notes, and community sessions are enough to start if the teaching quality is already there.',
  },
  {
    question: 'Can I teach live and recorded formats together?',
    answer: 'Yes. The strongest offers usually combine a reusable content base with a lightweight live layer such as reviews or office hours.',
  },
  {
    question: 'Is this only for professional instructors?',
    answer: 'No. Practitioners who teach clearly and have a strong point of view can fit if they can guide learners to an outcome.',
  },
  {
    question: 'What should I prepare first?',
    answer: 'A topic, learner promise, 2-3 proof points, and one example asset you would want to turn into a learning experience.',
  },
];

export default function Teach() {
  const isSignedIn = Boolean(localStorage.getItem('token') || localStorage.getItem('userId'));
  const [monthlyLearners, setMonthlyLearners] = useState(40);
  const [ticketPrice, setTicketPrice] = useState(49);
  const [liveSessions, setLiveSessions] = useState(2);

  const earnings = useMemo(() => {
    const baseRevenue = monthlyLearners * ticketPrice;
    const liveUpsell = liveSessions * 180;
    const totalRevenue = baseRevenue + liveUpsell;
    const estimatedPayout = Math.round(totalRevenue * 0.82);

    return {
      baseRevenue,
      estimatedPayout,
      totalRevenue,
    };
  }, [liveSessions, monthlyLearners, ticketPrice]);

  return (
    <div className="glass-page min-h-screen text-zinc-100">
      <MainNavbar />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6">
        <section className="surface-card surface-card-shimmer relative overflow-hidden p-7 md:p-8">
          <div className="ambient-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="pointer-events-none absolute left-[-5%] top-8 h-52 w-52 rounded-full bg-red-500/16 blur-[120px]" />
          <div className="pointer-events-none absolute right-[-4%] top-0 h-64 w-64 rounded-full bg-amber-400/10 blur-[130px]" />

          <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="reveal-up">
              <div className="eyebrow">
                <Sparkles size={14} className="text-red-300" />
                Creator program
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
                Build a teaching business that feels premium without turning into admin overhead.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
                CollabLearn is being shaped for mentors, creators, and practitioners who want to
                package knowledge into cohort programs, guided modules, and community-led learning
                experiences with a sharper learner journey.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to={isSignedIn ? '/dashboard' : '/signup'} className="glass-cta">
                  Start creator setup
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/community"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-blue-400/45 hover:bg-blue-500/12"
                >
                  Explore creator discussions
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    Format mix
                  </p>
                  <p className="mt-3 text-2xl font-black text-white">Live + async</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    Best for
                  </p>
                  <p className="mt-3 text-2xl font-black text-white">Experts with proof</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    Core outcome
                  </p>
                  <p className="mt-3 text-2xl font-black text-white">Repeatable learning offers</p>
                </div>
              </div>
            </div>

            <div className="reveal-up">
              <div className="card-spotlight rounded-[30px] border border-white/10 bg-black/35 p-6 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Creator earnings preview</p>
                    <p className="text-sm text-zinc-400">Simple model for a guided offer</p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <label className="grid gap-2">
                    <div className="flex items-center justify-between text-sm text-zinc-300">
                      <span>Monthly learners</span>
                      <span>{monthlyLearners}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      value={monthlyLearners}
                      onChange={(event) => setMonthlyLearners(Number(event.target.value))}
                    />
                  </label>

                  <label className="grid gap-2">
                    <div className="flex items-center justify-between text-sm text-zinc-300">
                      <span>Average ticket price</span>
                      <span>${ticketPrice}</span>
                    </div>
                    <input
                      type="range"
                      min="19"
                      max="199"
                      step="5"
                      value={ticketPrice}
                      onChange={(event) => setTicketPrice(Number(event.target.value))}
                    />
                  </label>

                  <label className="grid gap-2">
                    <div className="flex items-center justify-between text-sm text-zinc-300">
                      <span>Live sessions per month</span>
                      <span>{liveSessions}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      step="1"
                      value={liveSessions}
                      onChange={(event) => setLiveSessions(Number(event.target.value))}
                    />
                  </label>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                      Gross offer value
                    </p>
                    <p className="mt-3 text-3xl font-black text-white">${earnings.totalRevenue}</p>
                  </div>
                  <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-100/80">
                      Estimated creator payout
                    </p>
                    <p className="mt-3 text-3xl font-black text-white">${earnings.estimatedPayout}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  This is a directional estimate for planning offer design, not a contractual payout.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {PROGRAM_BENEFITS.map(({ copy, icon, title }) => (
            <div key={title} className="glass-panel interactive-tile p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
                {createElement(icon, { size: 20 })}
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-tight text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{copy}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.58fr_0.42fr]">
          <div className="surface-card p-6 md:p-7">
            <div className="eyebrow">
              <BookOpen size={14} className="text-red-300" />
              Teaching formats
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-white">
              Pick a format that matches your energy, not just your topic.
            </h2>
            <div className="mt-6 grid gap-4">
              {CREATOR_FORMATS.map((format) => (
                <div
                  key={format.title}
                  className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
                >
                  <p className="text-lg font-semibold text-white">{format.title}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-300">{format.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 md:p-7">
            <div className="eyebrow">
              <Users size={14} className="text-red-300" />
              What creators bring
            </div>
            <div className="mt-5 space-y-4">
              {[
                'A credible point of view and clear learning outcome.',
                'A topic with evidence that people already ask you about.',
                'At least one strong teaching asset such as notes, recordings, or workshops.',
                'Willingness to refine the offer using learner feedback.',
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <BadgeCheck size={18} className="mt-0.5 text-red-200" />
                  <p className="text-sm leading-7 text-zinc-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 surface-card p-6 md:p-7">
          <div className="grid gap-6 xl:grid-cols-[0.38fr_0.62fr]">
            <div>
              <div className="eyebrow">
                <Rocket size={14} className="text-red-300" />
                Launch roadmap
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-white">
                A simple path from expertise to a stronger teaching product.
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-300">
                The goal is not just to publish content. The goal is to shape an offer that learners
                finish, recommend, and return to.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {ROADMAP.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Step {index + 1}
                  </p>
                  <p className="mt-3 text-xl font-black text-white">{step.title}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-300">{step.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.55fr_0.45fr]">
          <div className="glass-panel p-6 md:p-7">
            <div className="eyebrow">
              <CalendarClock size={14} className="text-red-300" />
              How the program feels
            </div>
            <div className="mt-5 grid gap-4">
              {[
                { icon: Video, title: 'Live touchpoints', copy: 'Office hours, kickoff calls, or critiques keep the offer human and high-trust.' },
                { icon: Layers3, title: 'Reusable modules', copy: 'Notes, prompts, and templates stay useful after the first cohort finishes.' },
                { icon: Users, title: 'Community loops', copy: 'Discussions surface learner friction so each new run gets better.' },
              ].map(({ copy, icon, title }) => (
                <div key={title} className="flex gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white">
                    {createElement(icon, { size: 18 })}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{title}</p>
                    <p className="mt-1 text-sm leading-7 text-zinc-300">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-6 md:p-7">
            <div className="eyebrow">
              <Sparkles size={14} className="text-red-300" />
              Common questions
            </div>
            <div className="mt-5 space-y-4">
              {FAQS.map((item) => (
                <div key={item.question} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-lg font-semibold text-white">{item.question}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-300">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 surface-card card-spotlight overflow-hidden p-6 text-center md:p-8">
          <div className="eyebrow justify-center">
            <Sparkles size={14} className="text-red-300" />
            Final call
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-4xl">
            If you already teach well, the next upgrade is packaging and delivery.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
            Move from one-off sessions to a repeatable learning product with clearer structure,
            better discovery, and a community layer that keeps learners engaged.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to={isSignedIn ? '/dashboard' : '/signup'} className="glass-cta">
              Begin creator setup
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/modules"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-blue-400/45 hover:bg-blue-500/12"
            >
              Explore module workspace
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
