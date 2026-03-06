import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import MainNavbar from '../../navbar/mainNavbar';
import { API_URL } from '../../config';

const NOTE_SUGGESTIONS = [
  'I want to cover a specific blocker and leave with a concrete plan.',
  'I would like feedback on my current project, portfolio, or module draft.',
  'I want a guided session with examples, exercises, and next steps.',
];

function formatCurrency(amount) {
  const numeric = Number(amount || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 'Free';
  }

  return `INR ${numeric.toLocaleString('en-IN')}`;
}

export default function BookingSessionPage() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [blockedOwnBooking, setBlockedOwnBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [form, setForm] = useState({
    date: '',
    time: '',
    duration: '60',
    notes: '',
  });

  const sessionDetails = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      skill: params.get('skillId') || '',
      instructor: params.get('instructorId') || '',
      title: decodeURIComponent(params.get('skillTitle') || ''),
      instructorName: decodeURIComponent(params.get('instructorName') || ''),
      price: Number(params.get('price') || 0),
      baseDuration: params.get('duration') || '',
      category: decodeURIComponent(params.get('category') || ''),
      level: decodeURIComponent(params.get('level') || ''),
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        const userId = data.user?._id || data.user?.id;
        if (response.ok && data.success && userId) {
          setStudentId(String(userId));
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (
      studentId &&
      sessionDetails.instructor &&
      String(studentId) === String(sessionDetails.instructor)
    ) {
      setBlockedOwnBooking(true);
      toast.error("You can't book a session for your own skill.");
    }
  }, [sessionDetails.instructor, studentId]);

  const estimatedCost = useMemo(() => {
    if (!sessionDetails.price) return 0;
    return Math.round((sessionDetails.price * Number(form.duration || 0)) / 60);
  }, [form.duration, sessionDetails.price]);

  const isMissingDetails = !sessionDetails.skill || !sessionDetails.instructor;

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.date || !form.time || !form.duration) {
      toast.error('Choose a date, time, and duration.');
      return;
    }

    const scheduledAt = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      toast.error('Choose a future time slot.');
      return;
    }

    if (isMissingDetails || !studentId) {
      toast.error('Session details are incomplete.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          skill: sessionDetails.skill,
          instructor: sessionDetails.instructor,
          student: studentId,
          date: scheduledAt.toISOString(),
          duration: Number(form.duration),
          notes: form.notes.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Booking failed.');
      }

      setBookingComplete(true);
      toast.success('Session request sent.');
    } catch (submitError) {
      console.error(submitError);
      toast.error(submitError.message || 'Booking failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-page min-h-screen text-zinc-100">
        <MainNavbar />
        <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 pt-24">
          <div className="surface-card w-full p-8 text-center">
            <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-2 border-white/15 border-t-red-500" />
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-300/80">
              Booking
            </p>
            <h1 className="mt-3 text-2xl font-bold text-white">Preparing your session request</h1>
          </div>
        </main>
      </div>
    );
  }

  if (isMissingDetails) {
    return (
      <div className="glass-page min-h-screen text-zinc-100">
        <MainNavbar />
        <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 pt-24">
          <div className="surface-card w-full p-8 text-center">
            <h1 className="text-2xl font-bold text-white">Booking details are missing</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Open booking from the skills marketplace so the instructor and skill context are carried in.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/browse-skills" className="glass-cta">
                Browse skills
              </Link>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="glass-chip border-white/20 bg-white/8 hover:border-red-300/45"
              >
                Go back
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (blockedOwnBooking) {
    return (
      <div className="glass-page min-h-screen text-zinc-100">
        <MainNavbar />
        <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 pt-24">
          <div className="surface-card w-full p-8 text-center">
            <h1 className="text-2xl font-bold text-white">You cannot book your own skill</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Open another skill listing to continue, or return to your marketplace dashboard.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/browse-skills" className="glass-cta">
                Back to marketplace
              </Link>
              <Link
                to="/dashboard"
                className="glass-chip border-white/20 bg-white/8 hover:border-red-300/45"
              >
                Open dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="glass-page min-h-screen text-zinc-100">
        <MainNavbar />
        <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 pt-24">
          <div className="surface-card card-spotlight w-full p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-500/10 text-emerald-100">
              <CheckCircle2 size={28} />
            </div>
            <h1 className="mt-5 text-3xl font-black text-white">Request sent to {sessionDetails.instructorName}</h1>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Your booking request is in. The instructor can now review the session context and respond.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/calendar" className="glass-cta">
                Open calendar
              </Link>
              <Link
                to="/browse-skills"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-blue-400/45 hover:bg-blue-500/12"
              >
                Discover more skills
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="glass-page min-h-screen text-zinc-100">
      <MainNavbar />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6">
        <div className="mb-5">
          <Link
            to="/browse-skills"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:border-red-300/35 hover:bg-red-500/10"
          >
            <ArrowLeft size={16} />
            Back to marketplace
          </Link>
        </div>

        <section className="surface-card surface-card-shimmer relative overflow-hidden p-7 md:p-8">
          <div className="ambient-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="pointer-events-none absolute left-[-4%] top-10 h-48 w-48 rounded-full bg-red-500/15 blur-[120px]" />
          <div className="pointer-events-none absolute right-[-5%] top-4 h-56 w-56 rounded-full bg-blue-500/10 blur-[130px]" />

          <div className="relative grid gap-6 xl:grid-cols-[0.98fr_0.52fr]">
            <div className="reveal-up">
              <div className="eyebrow">
                <Sparkles size={14} className="text-red-300" />
                Session booking
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
                Request a focused session for {sessionDetails.title || 'this skill'}.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
                Set the time, share your context, and help the instructor prepare a session that is
                more useful than a generic call.
              </p>
            </div>

            <div className="reveal-up rounded-[28px] border border-white/10 bg-black/35 p-5 backdrop-blur">
              <div className="grid gap-4">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    Skill
                  </p>
                  <p className="mt-2 text-xl font-black text-white">{sessionDetails.title || 'Selected skill'}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    Instructor
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    {sessionDetails.instructorName || 'Selected instructor'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.65fr_0.35fr]">
          <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-7">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
              <CalendarDays size={14} className="text-red-300" />
              Schedule details
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-200">Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => handleChange('date', event.target.value)}
                  className="glass-input"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-200">Time</span>
                <input
                  type="time"
                  value={form.time}
                  onChange={(event) => handleChange('time', event.target.value)}
                  className="glass-input"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[0.55fr_0.45fr]">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-200">Duration</span>
                <select
                  value={form.duration}
                  onChange={(event) => handleChange('duration', event.target.value)}
                  className="glass-input"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                </select>
              </label>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Estimated total
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {estimatedCost > 0 ? formatCurrency(estimatedCost) : 'Free or custom'}
                </p>
              </div>
            </div>

            <label className="mt-5 grid gap-2">
              <span className="text-sm font-semibold text-zinc-200">Session notes</span>
              <textarea
                rows={6}
                value={form.notes}
                onChange={(event) => handleChange('notes', event.target.value)}
                className="glass-input min-h-[180px]"
                placeholder="What do you want to cover? Add your current level, blockers, or any materials the instructor should review before the session."
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              {NOTE_SUGGESTIONS.map((note) => (
                <button
                  key={note}
                  type="button"
                  onClick={() => handleChange('notes', note)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-red-300/35 hover:bg-red-500/10 hover:text-white"
                >
                  {note}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-white/8 pt-5 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-zinc-400">
                The more context you give, the easier it is for the instructor to prepare a focused session.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="glass-cta disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Sending request' : 'Confirm request'}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="glass-panel p-5">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
                <UserRound size={14} className="text-red-300" />
                Session summary
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Category</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {sessionDetails.category || 'General skill'}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Level</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {sessionDetails.level || 'Flexible'}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Standard duration</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {sessionDetails.baseDuration || 'Custom'}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Rate</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {sessionDetails.price > 0 ? `${formatCurrency(sessionDetails.price)}/hr` : 'Free or flexible'}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
                <ShieldCheck size={14} className="text-red-300" />
                What happens next
              </div>

              <div className="mt-4 space-y-3">
                {[
                  'The instructor receives your requested date, duration, and notes.',
                  'You can continue the conversation through the platform once they respond.',
                  'Sessions with clear goals usually get better acceptance and outcomes.',
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-zinc-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-5">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
                <MessageSquareQuote size={14} className="text-red-300" />
                Helpful context
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-zinc-300">
                  Mention your current level, what you already tried, and what outcome would make the session successful.
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-zinc-300">
                  If you are booking project feedback, include links or files before the call.
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-zinc-300">
                  <div className="flex items-center gap-2 text-white">
                    <Clock3 size={15} />
                    Duration affects the estimated total when the listing includes a paid rate.
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-white">
                    <CircleDollarSign size={15} />
                    Current estimate: {estimatedCost > 0 ? formatCurrency(estimatedCost) : 'Flexible'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
