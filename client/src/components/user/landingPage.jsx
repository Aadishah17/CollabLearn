import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import LandingNavbar from '../../navbar/landingNavbar';

const quickSignals = [
  {
    title: 'AI roadmaps',
    value: 'Personalized',
    detail: 'Build a weekly learning plan from your goal, timeline, and level.',
  },
  {
    title: 'Mentor sessions',
    value: 'Live support',
    detail: 'Book structured sessions with instructors when you need help.',
  },
  {
    title: 'Community',
    value: 'Always active',
    detail: 'Ask questions, share progress, and learn in public with peers.',
  },
  {
    title: 'Progress',
    value: 'Trackable',
    detail: 'Keep momentum with milestones, sessions, and visible progress.',
  },
];

const featureCards = [
  {
    icon: Sparkles,
    title: 'AI learning studio',
    copy: 'Generate a roadmap, weekly objectives, and curated resources for any skill you want to learn.',
  },
  {
    icon: Calendar,
    title: 'Mentor booking',
    copy: 'Schedule sessions around your calendar and keep teaching and learning commitments organized.',
  },
  {
    icon: Users,
    title: 'Community feedback',
    copy: 'Post updates, ask for help, and learn from other people working through similar goals.',
  },
  {
    icon: BookOpen,
    title: 'Skill marketplace',
    copy: 'Browse what others teach, publish what you can teach, and match learning goals with expertise.',
  },
  {
    icon: Trophy,
    title: 'Achievements',
    copy: 'Celebrate momentum with visible milestones that make your progress feel tangible.',
  },
  {
    icon: MessageSquare,
    title: 'Real-time messaging',
    copy: 'Keep conversations moving with direct chat for learners, mentors, and collaborators.',
  },
];

const steps = [
  {
    title: 'Tell CollabLearn what you want to master',
    copy: 'Start with a skill, timeline, weekly hours, and your current level. The app turns that into a practical learning plan.',
  },
  {
    title: 'Follow a roadmap that stays actionable',
    copy: 'Move through weekly goals, curated resources, and focused study sessions without guessing what comes next.',
  },
  {
    title: 'Add mentors and community when you get stuck',
    copy: 'Book a session, ask the community, and keep momentum instead of stalling out halfway through.',
  },
];

const workflowLanes = [
  {
    title: 'Plan the work',
    eyebrow: 'Roadmap',
    copy: 'Define a skill, weekly hours, and a realistic timeline. The app translates that into a roadmap you can actually keep.',
  },
  {
    title: 'Practice with support',
    eyebrow: 'Mentors + community',
    copy: 'Book help when you are stuck, ask questions in public, and keep the next move clear instead of stalling out.',
  },
  {
    title: 'Turn progress into leverage',
    eyebrow: 'Teach + share',
    copy: 'Show what you know, publish teachable skills, and turn your learning momentum into a teaching lane later.',
  },
];

export default function CollabLearnLanding() {
  const navigate = useNavigate();
  const hasSession = Boolean(localStorage.getItem('token'));

  return (
    <div className="glass-page min-h-screen overflow-x-hidden text-slate-100 selection:bg-red-500/30">
      <LandingNavbar />

      <section className="relative overflow-hidden px-6 pb-20 pt-32 md:pb-24 md:pt-36">
        <div className="ambient-grid pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-30" />
        <div className="pointer-events-none absolute left-[-10%] top-20 h-72 w-72 rounded-full bg-red-500/12 blur-[110px]" />
        <div className="pointer-events-none absolute right-[-6%] top-10 h-80 w-80 rounded-full bg-blue-500/12 blur-[120px]" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative z-10">
            <div className="eyebrow">
              <Sparkles size={14} className="text-red-300" />
              AI roadmaps, mentor sessions, and community learning
            </div>

            <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl">
              Learn faster
              <span className="block text-red-400">with structure, not guesswork.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 md:text-xl">
              CollabLearn turns vague goals into weekly learning roadmaps, live mentor sessions, community support, and visible progress tracking in one workspace.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate(hasSession ? '/dashboard' : '/signup')}
                className="glass-cta"
              >
                {hasSession ? 'Open your dashboard' : 'Start learning free'}
                <ArrowRight size={18} />
              </button>
              {hasSession ? (
                <button
                  type="button"
                  onClick={() => navigate('/ai-learning')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-blue-400/45 hover:bg-blue-500/12"
                >
                  Open AI learning
                </button>
              ) : (
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-blue-400/45 hover:bg-blue-500/12"
                >
                  See how it works
                </a>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="glass-chip">
                <Target size={14} className="text-red-300" />
                Roadmaps built from your goal
              </span>
              <span className="glass-chip">
                <GraduationCap size={14} className="text-blue-300" />
                Learn or teach on the same platform
              </span>
              <span className="glass-chip">
                <CheckCircle2 size={14} className="text-emerald-300" />
                Built for consistency, not one-off inspiration
              </span>
            </div>
          </div>

          <div className="relative z-10">
            <div className="surface-card relative overflow-hidden p-5 md:p-6">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/4 via-transparent to-red-500/6" />
              <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-400">
                    This week
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Frontend roadmap</h2>
                </div>
                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200">
                  On track
                </div>
              </div>

              <div className="relative mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Weekly roadmap</p>
                    <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-200">
                      Week 2 of 6
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      'Finish React state management module',
                      'Book a 30 min mentor session for feedback',
                      'Share one progress post in the community',
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3"
                      >
                        <span className="signal-dot mt-1 bg-emerald-400" />
                        <p className="text-sm leading-6 text-zinc-200">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-red-500/[0.07] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Next session</p>
                      <Clock3 size={16} className="text-red-300" />
                    </div>
                    <p className="mt-3 text-lg font-bold text-white">CSS review with mentor</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      Tomorrow at 7:00 PM with a focus on layout systems and responsive patterns.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-blue-500/[0.08] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Progress</p>
                      <TrendingUp size={16} className="text-blue-300" />
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-blue-400 to-red-400" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">
                      You completed 68% of this month’s milestones and stayed active for four straight study weeks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-6">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickSignals.map((signal) => (
            <div key={signal.title} className="metric-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {signal.title}
              </p>
              <p className="mt-4 text-2xl font-black text-white">{signal.value}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{signal.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-10 pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="surface-card overflow-hidden p-6 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="eyebrow">
                  <Target size={14} className="text-red-300" />
                  What the product actually replaces
                </div>
                <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-4xl">
                  Planning, accountability, mentor support, and teaching workflow in one place.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-zinc-300 md:text-base">
                Most learners patch these together across notes, calendars, chat apps, and marketplaces.
                CollabLearn makes the flow coherent from the start.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {workflowLanes.map((lane) => (
                <div key={lane.title} className="rounded-[26px] border border-white/10 bg-white/[0.035] p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
                    {lane.eyebrow}
                  </p>
                  <h3 className="mt-4 text-2xl font-bold text-white">{lane.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-zinc-300">{lane.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="eyebrow">
              <BookOpen size={14} className="text-blue-300" />
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
            {featureCards.map((feature) => (
              <div key={feature.title} className="feature-tile">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
                  <feature.icon size={22} className="text-red-300" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{feature.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-white/8 bg-black/20 px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="eyebrow">
              <Target size={14} className="text-red-300" />
              How it works
            </div>
            <h2 className="section-title mt-6">From vague ambition to a plan you can actually follow.</h2>
            <p className="section-copy mt-5 max-w-xl">
              The value is not just AI output. The value is staying in motion after the first burst of motivation fades.
            </p>
          </div>

          <div className="space-y-5">
            {steps.map((step, index) => (
              <div key={step.title} className="surface-card p-6 md:p-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/12 text-lg font-black text-red-200">
                    0{index + 1}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-300">{step.copy}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="teach" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="eyebrow">
              <Users size={14} className="text-blue-300" />
              Built for both sides
            </div>
            <h2 className="section-title mt-6">Learn new skills or turn your expertise into a teaching lane.</h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="surface-card p-7 md:p-8">
              <div className="inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-200">
                For learners
              </div>
              <h3 className="mt-5 text-3xl font-black text-white">Stay accountable when self-study starts slipping.</h3>
              <ul className="mt-6 space-y-4 text-sm leading-7 text-zinc-300">
                <li className="flex gap-3">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-300" />
                  Build a roadmap from your actual schedule, not an unrealistic ideal week.
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-300" />
                  Book help when you need clarity instead of waiting until you burn out.
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-300" />
                  Keep momentum with progress markers, study goals, and community interaction.
                </li>
              </ul>
            </div>

            <div className="surface-card p-7 md:p-8">
              <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-200">
                For teachers
              </div>
              <h3 className="mt-5 text-3xl font-black text-white">Teach what you know and build real trust with students.</h3>
              <ul className="mt-6 space-y-4 text-sm leading-7 text-zinc-300">
                <li className="flex gap-3">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-300" />
                  Publish teaching skills, manage upcoming sessions, and stay visible to motivated learners.
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-300" />
                  Use messaging and calendar tools to keep sessions organized without extra apps.
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-300" />
                  Grow a teaching presence inside the same ecosystem learners already use to stay on track.
                </li>
              </ul>
              <div className="mt-8">
                <Link
                  to="/teach"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-red-400/45 hover:bg-red-500/12"
                >
                  Explore teaching
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="surface-card relative overflow-hidden p-8 text-center md:p-12">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-red-500/6 via-transparent to-blue-500/8" />
            <div className="relative">
              <div className="eyebrow">
                <Sparkles size={14} className="text-red-300" />
                Ready to get moving
              </div>
              <h2 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
                Build a learning system
                <span className="block text-red-400">that survives past week one.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
                Start with an AI roadmap, add mentor sessions when needed, and keep the feedback loop active through community and messaging.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate(hasSession ? '/dashboard' : '/signup')}
                  className="glass-cta"
                >
                  {hasSession ? 'Return to workspace' : 'Create your account'}
                  <ArrowRight size={18} />
                </button>
                {hasSession ? (
                  <button
                    type="button"
                    onClick={() => navigate('/ai-learning')}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-blue-400/45 hover:bg-blue-500/12"
                  >
                    Open AI learning
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-blue-400/45 hover:bg-blue-500/12"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 bg-black/35 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-bold text-white">CollabLearn</p>
            <p className="mt-2 text-sm text-zinc-400">
              AI-guided skill learning, mentor sessions, and community accountability in one product.
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm font-semibold text-zinc-300">
            <a href="#features" className="transition-colors hover:text-red-300">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-red-300">How it works</a>
            <a href="#teach" className="transition-colors hover:text-red-300">Teach</a>
            <Link to="/login" className="transition-colors hover:text-red-300">Login</Link>
            <Link to="/signup" className="transition-colors hover:text-red-300">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
