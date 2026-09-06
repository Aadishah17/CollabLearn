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

export const quickSignals = [
  {
    title: 'Guided roadmaps',
    value: 'Start with the next six weeks',
    detail: 'Turn a vague goal into weekly focus areas, resources, and checkpoints.',
    icon: Target,
    iconClass: 'border-red-400/25 bg-red-500/12 text-red-100',
    haloClass: 'from-red-500/16 via-red-500/5 to-transparent',
  },
  {
    title: 'Mentor sessions',
    value: 'Bring in live help at the right moment',
    detail:
      'Use sessions for blockers, feedback, and sharper next steps instead of generic advice.',
    icon: Calendar,
    iconClass: 'border-blue-400/25 bg-blue-500/12 text-blue-100',
    haloClass: 'from-blue-500/16 via-blue-500/5 to-transparent',
  },
  {
    title: 'Community',
    value: 'Keep the feedback loop open',
    detail: 'Ask for help, post progress, and stay connected to other learners already in motion.',
    icon: Users,
    iconClass: 'border-emerald-400/25 bg-emerald-500/12 text-emerald-100',
    haloClass: 'from-emerald-500/16 via-emerald-500/5 to-transparent',
  },
  {
    title: 'Progress',
    value: 'See momentum, not just tasks',
    detail: 'Make consistency visible with milestones, study sessions, and active streaks.',
    icon: TrendingUp,
    iconClass: 'border-amber-400/25 bg-amber-500/12 text-amber-100',
    haloClass: 'from-amber-500/16 via-amber-500/5 to-transparent',
  },
];

export const heroStats = [
  {
    value: '3',
    label: 'Core loops',
    detail: 'Roadmap, mentor support, and community feedback stay connected in one interface.',
  },
  {
    value: '1',
    label: 'Shared workspace',
    detail:
      'Study planning, sessions, and progress tracking live together instead of across scattered tools.',
  },
  {
    value: '7d',
    label: 'Momentum window',
    detail:
      'The product is designed to keep your next step obvious after the first burst of motivation fades.',
  },
];

export const heroPulseItems = [
  'Goal-first roadmaps',
  'Mentor sessions on demand',
  'Community checkpoints',
  'Visible weekly momentum',
  'Teach what you master later',
];

export const heroBoardLanes = [
  {
    label: 'Active roadmap',
    title: 'Frontend systems sprint',
    detail: 'Week 2 of 6 · layout systems, component patterns, and one mentor review.',
    tone: 'border-red-400/20 bg-red-500/10 text-red-100',
    iconClass: 'bg-red-400',
  },
  {
    label: 'Next checkpoint',
    title: 'Mentor review tomorrow · 7:00 PM',
    detail: 'Use the session to review responsive structure before the next milestone locks.',
    tone: 'border-blue-400/20 bg-blue-500/10 text-blue-100',
    iconClass: 'bg-blue-400',
  },
  {
    label: 'Momentum',
    title: '68% of this month completed',
    detail: 'Progress stays visible so the next study block is obvious before motivation drops.',
    tone: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
    iconClass: 'bg-emerald-400',
  },
];

export const heroThreadItems = [
  'Review my responsive nav before I ship it',
  'What changed your consistency this month?',
  'Looking for feedback on a portfolio case study',
];

export const heroStatusTiles = [
  { label: 'Study streak', value: '4 weeks' },
  { label: 'Mentor queue', value: '1 review booked' },
];

export const featureCards = [
  {
    icon: Sparkles,
    title: 'Learning workspace',
    copy: 'Generate a roadmap, focused study sessions, and curated resources for the exact skill you want to learn next.',
    accent: 'from-red-500/15 via-red-500/6 to-transparent',
    iconClass: 'border-red-400/20 bg-red-500/10 text-red-200',
    featured: true,
    badge: 'Most visible surface',
  },
  {
    icon: Calendar,
    title: 'Mentor booking',
    copy: 'Move from roadmap to live support with scheduled sessions that fit your actual calendar.',
    accent: 'from-blue-500/14 via-blue-500/5 to-transparent',
    iconClass: 'border-blue-400/20 bg-blue-500/10 text-blue-200',
  },
  {
    icon: Users,
    title: 'Community feedback',
    copy: 'Post updates, ask sharper questions, and learn alongside people solving similar problems.',
    accent: 'from-emerald-500/14 via-emerald-500/5 to-transparent',
    iconClass: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
  },
  {
    icon: BookOpen,
    title: 'Skill marketplace',
    copy: 'Discover what others teach, publish what you can teach, and match goals with expertise.',
    accent: 'from-fuchsia-500/14 via-fuchsia-500/5 to-transparent',
    iconClass: 'border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200',
  },
  {
    icon: Trophy,
    title: 'Achievements',
    copy: 'Keep motivation concrete with milestones and visible proof that the plan is working.',
    accent: 'from-amber-500/14 via-amber-500/5 to-transparent',
    iconClass: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
  },
  {
    icon: MessageSquare,
    title: 'Real-time messaging',
    copy: 'Keep conversations moving with direct chat between learners, mentors, and collaborators.',
    accent: 'from-cyan-500/14 via-cyan-500/5 to-transparent',
    iconClass: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200',
  },
];

export const steps = [
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

export const workflowLanes = [
  {
    title: 'Shape the week before it drifts',
    eyebrow: '01 · Plan',
    icon: Target,
    copy: 'Start from time, level, and a real goal so the roadmap feels like an operating plan, not a wish list.',
    bullets: ['Weekly hours become actual scope', 'Milestones stay tied to one outcome'],
    accent: 'from-red-500/16 via-red-500/6 to-transparent',
    iconClass: 'border-red-400/20 bg-red-500/10 text-red-200',
  },
  {
    title: 'Practice with the next move visible',
    eyebrow: '02 · Practice',
    icon: BookOpen,
    copy: 'Use the roadmap like a daily control panel so each study block has a clear output instead of random resource hunting.',
    bullets: ['Focused study sessions', 'Progress updates that stay visible'],
    accent: 'from-blue-500/16 via-blue-500/6 to-transparent',
    iconClass: 'border-blue-400/20 bg-blue-500/10 text-blue-200',
  },
  {
    title: 'Pull in help before momentum breaks',
    eyebrow: '03 · Feedback',
    icon: MessageSquare,
    copy: 'Ask the community or book a mentor session right where the blocker happens instead of losing another week.',
    bullets: ['Feedback inside the same workflow', 'Mentor sessions when clarity matters'],
    accent: 'from-emerald-500/16 via-emerald-500/6 to-transparent',
    iconClass: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
  },
  {
    title: 'Turn progress into a teaching lane later',
    eyebrow: '04 · Leverage',
    icon: GraduationCap,
    copy: 'Once your skill becomes real, use the same platform to publish teachable expertise and stay in the loop.',
    bullets: ['Move from learner to teacher', 'Keep audience and scheduling in one place'],
    accent: 'from-fuchsia-500/16 via-fuchsia-500/6 to-transparent',
    iconClass: 'border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200',
  },
];

export const rhythmPoints = [
  'Plan the next week from real time constraints.',
  'Practice inside a roadmap with visible momentum.',
  'Ask for feedback before the plan starts slipping.',
  'Turn progress into teaching leverage later.',
];

export const learnerBenefits = [
  {
    text: 'Build a roadmap from your actual schedule, not an unrealistic ideal week.',
    icon: CheckCircle2,
  },
  {
    text: 'Book help when you need clarity instead of waiting until you burn out.',
    icon: CheckCircle2,
  },
  {
    text: 'Keep momentum with progress markers, study goals, and community interaction.',
    icon: CheckCircle2,
  },
];

export const teacherBenefits = [
  {
    text: 'Publish teaching skills, manage upcoming sessions, and stay visible to motivated learners.',
    icon: CheckCircle2,
  },
  {
    text: 'Use messaging and calendar tools to keep sessions organized without extra apps.',
    icon: CheckCircle2,
  },
  {
    text: 'Grow a teaching presence inside the same ecosystem learners already use to stay on track.',
    icon: CheckCircle2,
  },
];

export const ctaFeatures = [
  'Goal-first planning',
  'Visible momentum',
  'Mentor support when needed',
];

export const landingCtaCopy = {
  guestPrimary: 'Start free and build your roadmap',
  guestSecondary: 'I already have an account',
  guestTrust: 'No credit card required to get started',
  sessionPrimary: 'Continue to your workspace',
  sessionSecondary: 'Open AI learning workspace',
  sessionTrust: 'Your last roadmap and progress stay synced',
};

export const trustHighlights = [
  {
    label: 'Focused study blocks completed',
    value: '12k+',
    detail: 'Learners keep weekly consistency when goals, sessions, and feedback stay in one flow.',
  },
  {
    label: 'Mentor sessions booked',
    value: '4.8k+',
    detail: 'Live support is used for real blockers, not generic motivation.',
  },
  {
    label: 'Community feedback posts',
    value: '22k+',
    detail: 'Questions and updates stay close to active roadmaps so progress does not stall.',
  },
];

export const learnerQuotes = [
  {
    quote:
      'I stopped guessing what to do next. The roadmap and mentor check-ins made each week feel clear and manageable.',
    author: 'Priya S.',
    role: 'Frontend learner',
  },
  {
    quote:
      'The momentum tracking helped me keep going after week one. I could see progress instead of just unfinished tasks.',
    author: 'Daniel M.',
    role: 'Data analyst upskilling',
  },
  {
    quote:
      'Community feedback gave me quick answers when I was stuck, so I did not lose a full week to one blocker.',
    author: 'Ananya R.',
    role: 'Career switcher',
  },
];

export const landingFaqs = [
  {
    question: 'Is CollabLearn only for beginners?',
    answer:
      'No. The roadmap starts from your current level and available time, so beginners and advanced learners both get useful next steps.',
  },
  {
    question: 'Do I need to book mentors to use the platform?',
    answer:
      'No. You can run with roadmap + community only, then add mentor sessions when you hit blockers or want faster feedback.',
  },
  {
    question: 'Can I teach as well as learn?',
    answer:
      'Yes. You can start as a learner and later publish teaching expertise in the same ecosystem when you are ready.',
  },
  {
    question: 'What is the fastest way to get value?',
    answer:
      'Create your first roadmap, schedule fixed weekly study blocks, and post one progress update each week to keep momentum visible.',
  },
];

export const footerLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Teach', href: '#teach' },
  { label: 'Status', to: '/status' },
  { label: 'Login', to: '/login' },
  { label: 'Create account', to: '/signup' },
];
