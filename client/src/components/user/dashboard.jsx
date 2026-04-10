import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock3,
  GraduationCap,
  LoaderCircle,
  Lock,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import MainNavbar from '../../navbar/mainNavbar';
import { getDashboardStats } from '../../services/dashboardApi';
import { clearSession } from '../../utils/session';

const StudentInfoModal = lazy(() => import('./StudentInfoModal'));

const CACHE_KEY = 'dashboard_data_v2';
const CACHE_TIMESTAMP_KEY = 'dashboard_timestamp_v2';
const CACHE_TTL_MS = 2 * 60 * 1000;
const memoryCache = { data: null, timestamp: 0 };

const formatSessionDate = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today · ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow · ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getSkillInitials = (skillName) =>
  String(skillName || 'SK')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

const getProgressTone = (progress) => {
  if (progress >= 75) return 'from-emerald-400 to-emerald-500';
  if (progress >= 50) return 'from-sky-400 to-blue-500';
  if (progress >= 25) return 'from-amber-400 to-orange-500';
  return 'from-zinc-400 to-zinc-500';
};

const readCachedDashboard = () => {
  try {
    if (memoryCache.data && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
      return memoryCache.data;
    }

    const cached = sessionStorage.getItem(CACHE_KEY);
    const timestamp = Number(sessionStorage.getItem(CACHE_TIMESTAMP_KEY) || 0);

    if (!cached || !timestamp || Date.now() - timestamp >= CACHE_TTL_MS) {
      return null;
    }

    const parsed = JSON.parse(cached);
    memoryCache.data = parsed;
    memoryCache.timestamp = timestamp;
    return parsed;
  } catch {
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(CACHE_TIMESTAMP_KEY);
    return null;
  }
};

const writeCachedDashboard = (payload) => {
  memoryCache.data = payload;
  memoryCache.timestamp = Date.now();

  try {
    const serialized = JSON.stringify(payload);
    if (serialized.length < 1024 * 1024) {
      sessionStorage.setItem(CACHE_KEY, serialized);
      sessionStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
    }
  } catch {
    // Best effort cache only.
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = useCallback(
    async ({ bypassCache = false } = {}) => {
      try {
        setLoading(true);
        setError('');

        if (!bypassCache) {
          const cached = readCachedDashboard();
          if (cached) {
            setDashboardData(cached);
            setLastUpdated(new Date());
            setLoading(false);
            return;
          }
        }

        const payload = await getDashboardStats();
        setDashboardData(payload);
        writeCachedDashboard(payload);
        setLastUpdated(new Date());
      } catch (fetchError) {
        console.error('Dashboard error:', fetchError);

        if (fetchError?.status === 401) {
          clearSession();
          navigate('/login');
          return;
        }

        setError(fetchError.message || 'Failed to load your dashboard.');
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const derivedData = useMemo(() => {
    if (!dashboardData) return null;

    const teachingSkills = dashboardData.skills?.teaching || [];
    const learningSkills = dashboardData.skills?.learning || [];
    const teachingBookings = dashboardData.upcomingBookings?.teaching || [];
    const learningBookings = dashboardData.upcomingBookings?.learning || [];
    const studentSummaries = dashboardData.studentSummaries || [];
    const recentActivity = dashboardData.recentActivity || [];

    const allUpcomingSessions = [
      ...teachingBookings.map((booking) => ({ ...booking, dashboardRole: 'teaching' })),
      ...learningBookings.map((booking) => ({ ...booking, dashboardRole: 'learning' })),
    ].sort((left, right) => new Date(left.date) - new Date(right.date));

    return {
      user: dashboardData.user || {},
      stats: dashboardData.stats || {},
      teachingSkills,
      learningSkills,
      studentSummaries,
      recentActivity,
      teachingBookings,
      learningBookings,
      allUpcomingSessions,
      nextSession: allUpcomingSessions[0] || null,
      totalCompletedSessions: studentSummaries.reduce(
        (sum, summary) => sum + (summary.completedSessions || 0),
        0,
      ),
    };
  }, [dashboardData]);

  const dashboardPulseItems = useMemo(() => {
    if (!derivedData) return [];

    return [
      `${derivedData.teachingSkills.length} teaching lanes live`,
      `${derivedData.learningSkills.length} learning tracks active`,
      `${derivedData.studentSummaries.length} learners in motion`,
      `${derivedData.allUpcomingSessions.length} upcoming sessions`,
      `${derivedData.totalCompletedSessions} sessions completed`,
    ];
  }, [derivedData]);

  const allowJoin = Boolean(derivedData?.user?.isPremium);

  const handleOpenStudent = useCallback((summary) => {
    setSelectedStudent(summary.student);
    setSelectedSkill(summary.focusSkill || null);
    setShowStudentModal(true);
  }, []);

  const handleMessageStudent = useCallback(
    (student) => {
      navigate('/messages', { state: { startChat: student } });
      setShowStudentModal(false);
    },
    [navigate],
  );

  const handleOpenSkill = useCallback(
    (skill) => {
      if (!skill?._id) {
        return;
      }

      navigate('/skill-sessions', { state: { skill } });
    },
    [navigate],
  );

  if (loading) {
    return (
      <div className="glass-page flex min-h-screen items-center justify-center px-6">
        <div className="surface-card w-full max-w-md p-8 text-center">
          <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-red-300" />
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.3em] text-red-300/80">
            Dashboard
          </p>
          <h1 className="mt-3 text-2xl font-bold text-white">Loading your workspace</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Pulling in sessions, learning goals, and student signals.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-page flex min-h-screen items-center justify-center px-6">
        <div className="surface-card w-full max-w-2xl p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-300/80">
            Dashboard error
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
            Your workspace did not load cleanly.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-300">{error}</p>
          <button type="button" onClick={() => fetchDashboardData({ bypassCache: true })} className="glass-cta mt-8">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!derivedData) {
    return null;
  }

  const statCards = [
    {
      label: 'Teaching',
      value: derivedData.teachingSkills.length,
      note: 'Active skills available for students',
      icon: <Users size={16} />,
      accent: 'from-red-500/20 via-red-500/5 to-transparent text-red-200',
    },
    {
      label: 'Learning',
      value: derivedData.learningSkills.length,
      note: 'Goals currently being tracked',
      icon: <GraduationCap size={16} />,
      accent: 'from-sky-500/20 via-sky-500/5 to-transparent text-sky-200',
    },
    {
      label: 'Avg progress',
      value: `${derivedData.stats.averageLearningProgress || 0}%`,
      note: 'Average completion across learning tracks',
      icon: <Target size={16} />,
      accent: 'from-emerald-500/20 via-emerald-500/5 to-transparent text-emerald-200',
    },
    {
      label: 'Students',
      value: derivedData.studentSummaries.length,
      note: 'Live teaching relationships in motion',
      icon: <Sparkles size={16} />,
      accent: 'from-amber-500/20 via-amber-500/5 to-transparent text-amber-200',
    },
  ];

  const quickActions = [
    {
      label: 'Open learning workspace',
      note: 'Resume guided study',
      onClick: () => navigate('/ai-learning'),
      primary: true,
    },
    {
      label: 'Browse skills',
      note: 'Expand teaching or learning',
      onClick: () => navigate('/browse-skills'),
      primary: false,
    },
    {
      label: 'Open calendar',
      note: 'Review upcoming sessions',
      onClick: () => navigate('/calendar'),
      primary: false,
    },
  ];

  return (
    <div className="dashboard-shell glass-page min-h-screen text-zinc-100">
      <MainNavbar />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-12 pt-28 sm:px-6">
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="surface-card dashboard-shell hero-stage hero-beam glow-frame group relative overflow-hidden p-7 transition-transform duration-300 hover:-translate-y-1 hover:border-white/15 md:p-8">
            <div className="aurora-orb aurora-orb-warm left-[-7%] top-0 h-44 w-44" />
            <div className="aurora-orb aurora-orb-cool right-[4%] top-10 h-52 w-52" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <div className="relative reveal-up">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="eyebrow">
                  <Sparkles size={14} className="text-red-300" aria-hidden="true" />
                  Authenticated workspace
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" aria-hidden="true" />
                    Live data
                  </div>
                  {lastUpdated && (
                    <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                      <Clock3 size={10} aria-hidden="true" />
                      {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fetchDashboardData({ bypassCache: true })}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:border-red-400/30 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Refresh dashboard data"
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">Command center</p>
                  <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl xl:text-6xl">
                    Welcome back, {derivedData.user?.name || 'Learner'}.
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
                    Real sessions, current learning momentum, and active student progress are all surfaced here in one operating view.
                  </p>

                  <div className="signal-marquee mt-6 rounded-[24px] px-3 py-3">
                    <div className="signal-marquee-track gap-3">
                      {[...dashboardPulseItems, ...dashboardPulseItems].map((item, index) => (
                        <span key={`${item}-${index}`} className="signal-pill whitespace-nowrap">
                          <TrendingUp size={12} className="text-red-300" />
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={action.onClick}
                        className={
                          action.primary
                            ? 'glass-cta justify-between px-4 py-4 text-left transition duration-300 hover:-translate-y-0.5'
                            : 'glass-outline-btn justify-between px-4 py-4 text-left transition duration-300 hover:-translate-y-0.5'
                        }
                      >
                        <span className="block">
                          <span className="block text-sm font-semibold text-white">{action.label}</span>
                          <span className="mt-1 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                            {action.note}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 self-start">
                  <div className="glow-frame reveal-up reveal-delay-2 rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-sm transition duration-300 hover:border-white/15 hover:bg-black/25">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Next session</p>
                        <h2 className="mt-3 text-2xl font-bold text-white">
                          {derivedData.nextSession?.skill?.name || 'No session scheduled'}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-zinc-300">
                          {derivedData.nextSession
                            ? `${formatSessionDate(derivedData.nextSession.date)} · ${
                                derivedData.nextSession.dashboardRole === 'teaching'
                                  ? `Teaching ${derivedData.nextSession.student?.name || 'student'}`
                                  : `Learning with ${derivedData.nextSession.instructor?.name || 'instructor'}`
                              }`
                            : 'Use the calendar to lock in your next teaching or learning block.'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-red-200">
                        <Calendar className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Session queue</p>
                        <p className="mt-1 text-sm text-zinc-200">
                          {derivedData.allUpcomingSessions.length} upcoming{' '}
                          {derivedData.allUpcomingSessions.length === 1 ? 'booking' : 'bookings'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/calendar')}
                        className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
                      >
                        Open calendar
                      </button>
                    </div>
                  </div>

                  <div className="glow-frame reveal-up reveal-delay-3 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:border-white/15 hover:bg-white/[0.05]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Account access</p>
                        <h2 className="mt-3 text-2xl font-bold text-white">
                          {allowJoin ? 'Premium active' : 'Standard access'}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-zinc-300">
                          {allowJoin
                            ? 'Video sessions and premium meeting tools are available from your upcoming bookings.'
                            : 'Upgrade when you need premium session tools like in-app video calls.'}
                        </p>
                      </div>
                      <div
                        className={`rounded-2xl border p-3 ${
                          allowJoin
                            ? 'border-amber-400/20 bg-amber-500/10 text-amber-200'
                            : 'border-white/10 bg-white/[0.04] text-zinc-400'
                        }`}
                      >
                        <Trophy className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                        {allowJoin ? 'Meetings unlocked' : 'Upgrade available'}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(allowJoin ? '/settings' : '/get-premium')}
                        className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
                      >
                        {allowJoin ? 'Manage account' : 'Explore premium'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-4">
                {statCards.map((card) => (
                  <div
                    key={card.label}
                    className="metric-rail group/stat relative overflow-hidden"
                  >
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 ${card.accent}`} />
                    <div className="relative">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">{card.label}</p>
                        <div className="text-zinc-300 transition-transform duration-300 group-hover/stat:scale-110">
                          {card.icon}
                        </div>
                      </div>
                      <p className="mt-4 text-3xl font-black text-white">{card.value}</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">{card.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <section className="glass-panel glow-frame reveal-up overflow-hidden p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Schedule</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Upcoming sessions</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/calendar')}
                  className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
                >
                  View all
                </button>
              </div>

              {derivedData.allUpcomingSessions.length ? (
                <div className="space-y-3">
                  {derivedData.allUpcomingSessions.slice(0, 5).map((booking) => {
                    const isTeaching = booking.dashboardRole === 'teaching';
                    const otherUserName = isTeaching
                      ? booking.student?.name || 'Unknown student'
                      : booking.instructor?.name || 'Unknown instructor';

                    return (
                      <div
                        key={booking._id}
                        className="glass-card glow-frame border-white/8 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.05]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-sm font-black text-white shadow-lg shadow-red-900/20">
                              {getSkillInitials(booking.skill?.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-semibold text-white">{booking.skill?.name || 'Unknown skill'}</p>
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                                  {isTeaching ? 'Teaching' : 'Learning'}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-zinc-300">
                                {isTeaching ? `Teaching ${otherUserName}` : `Learning with ${otherUserName}`}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
                                <span className="inline-flex items-center gap-2">
                                  <Clock3 size={12} />
                                  {formatSessionDate(booking.date)}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                  <MessageSquare size={12} />
                                  {allowJoin ? 'Join-ready' : 'Premium required'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                allowJoin &&
                                navigate('/video-call', {
                                  state: { userName: derivedData.user?.name },
                                })
                              }
                              disabled={!allowJoin}
                              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                                allowJoin
                                  ? 'bg-red-600 text-white transition duration-300 hover:-translate-y-0.5 hover:bg-red-700'
                                  : 'cursor-not-allowed bg-zinc-800 text-zinc-500'
                              }`}
                            >
                              {!allowJoin ? <Lock size={14} /> : null}
                              Join
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
                  <p className="text-lg font-semibold text-white">No upcoming sessions</p>
                  <p className="mt-2 text-sm text-zinc-400">Book a session or open the calendar to plan the next one.</p>
                </div>
              )}
            </section>

            <section className="glass-panel glow-frame reveal-up reveal-delay-1 p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Teaching</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Teaching skills</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/browse-skills')}
                  className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
                >
                  Manage
                </button>
              </div>

              {derivedData.teachingSkills.length ? (
                <div className="space-y-3">
                  {derivedData.teachingSkills.map((skill) => {
                    const activeStudents = derivedData.studentSummaries.filter((summary) =>
                      summary.sharedSkills.includes(skill.name),
                    );

                    return (
                      <div
                        key={skill._id}
                        className="glass-card glow-frame border-white/8 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.05]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-sm font-black text-white shadow-lg shadow-red-900/20">
                              {getSkillInitials(skill.name)}
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-white">{skill.name}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-400">
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                                  {skill.offering?.level || 'Beginner'}
                                </span>
                                <span>
                                  {activeStudents.length} active{' '}
                                  {activeStudents.length === 1 ? 'student' : 'students'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenSkill(skill)}
                            className="glass-outline-btn px-4 py-2"
                          >
                            View info
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
                  <p className="text-lg font-semibold text-white">You are not teaching any skills yet</p>
                  <p className="mt-2 text-sm text-zinc-400">Post your first skill to start building teaching momentum.</p>
                  <button type="button" onClick={() => navigate('/browse-skills')} className="glass-cta mt-5">
                    Add teaching skill
                  </button>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="glass-panel glow-frame reveal-up p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-red-200">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Coaching</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">Student momentum</h2>
                    <p className="text-sm text-zinc-400">Live coaching relationships with deterministic progress signals.</p>
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  {derivedData.totalCompletedSessions} sessions completed
                </div>
              </div>

              {derivedData.studentSummaries.length ? (
                <div className="space-y-3">
                  {derivedData.studentSummaries.slice(0, 4).map((summary) => (
                    <div
                      key={summary.student.id}
                      className="glass-card glow-frame border-white/8 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.05]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-white">{summary.student.name}</p>
                          <p className="mt-1 text-sm text-zinc-300">
                            {summary.focusSkill?.name || 'Active learner'} · {summary.completedSessions}/{summary.totalSessions}{' '}
                            sessions completed
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                            {summary.nextSessionAt
                              ? `Next session ${formatSessionDate(summary.nextSessionAt)}`
                              : 'No upcoming session scheduled'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenStudent(summary)}
                          className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
                        >
                          View details
                        </button>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500">
                          <span>Tracked progress</span>
                          <span>
                            {summary.focusSkill?.progress === null || summary.focusSkill?.progress === undefined
                              ? 'Not tracked'
                              : `${summary.focusSkill.progress}%`}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${
                              getProgressTone(summary.focusSkill?.progress || 0)
                            }`}
                            style={{
                              width: `${
                                summary.focusSkill?.progress === null || summary.focusSkill?.progress === undefined
                                  ? 0
                                  : Math.max(8, summary.focusSkill.progress)
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-7 text-zinc-300">
                  Student relationships will appear here as soon as confirmed teaching bookings start accumulating.
                </p>
              )}
            </section>

            <section className="glass-panel glow-frame reveal-up reveal-delay-1 p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-blue-200">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Learning</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Learning tracks</h2>
                  <p className="text-sm text-zinc-400">Progress reflects the actual percentages stored on your goals.</p>
                </div>
              </div>

              {derivedData.learningSkills.length ? (
                <div className="space-y-3">
                  {derivedData.learningSkills.map((skill) => (
                    <div
                      key={skill._id}
                      className="glass-card glow-frame border-white/8 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.05]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-white">{skill.name}</p>
                          <p className="mt-1 text-sm text-zinc-300">
                            {skill.seeking?.currentInstructor?.name
                              ? `Learning with ${skill.seeking.currentInstructor.name}`
                              : 'Instructor not assigned yet'}
                          </p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white">
                          {skill.seeking?.progress || 0}%
                        </div>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${getProgressTone(skill.seeking?.progress || 0)}`}
                          style={{ width: `${Math.max(6, skill.seeking?.progress || 0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-7 text-zinc-300">
                  Add a learning goal to start tracking progress here.
                </p>
              )}
            </section>

            <section className="glass-panel glow-frame reveal-up reveal-delay-2 p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-amber-200">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Activity</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">Recent activity</h2>
                    <p className="text-sm text-zinc-400">Completed sessions and recent learning movement.</p>
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  {derivedData.recentActivity.length} entries
                </div>
              </div>

              {derivedData.recentActivity.length ? (
                <div className="space-y-3">
                  {derivedData.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="glow-frame rounded-[22px] border border-white/8 bg-white/[0.03] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.05]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 rounded-full bg-red-500/12 p-2 text-red-200">
                          {activity.type === 'teaching_completed' ? <Users size={14} /> : <BookOpen size={14} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{activity.description}</p>
                          <p className="mt-1 text-sm text-zinc-400">
                            {activity.otherUser} · {formatSessionDate(activity.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-7 text-zinc-300">
                  Recent completed sessions will appear here once activity starts building.
                </p>
              )}
            </section>
          </div>
        </section>
      </main>

      {showStudentModal ? (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <LoaderCircle className="h-10 w-10 animate-spin text-red-300" />
            </div>
          }
        >
          <StudentInfoModal
            student={selectedStudent}
            skill={selectedSkill}
            onClose={() => {
              setShowStudentModal(false);
              setSelectedStudent(null);
              setSelectedSkill(null);
            }}
            onMessage={handleMessageStudent}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
