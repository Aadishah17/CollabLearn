import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import MainNavbar from '../../navbar/mainNavbar';
import { API_URL } from '../../config';
import { requestJson } from '../../services/apiClient';
import { formatINR } from '../../utils/currencyUtils';
import { deriveSkillSessionView, getBookingStatusTone } from '../../utils/skillSessionsView';

const getBaseUrl = () => String(API_URL || '').replace(/\/$/, '');

const formatDateTime = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getParticipant = (session, userRole) =>
  userRole === 'instructor' ? session?.student : session?.instructor;

const canCompleteSession = (session) => {
  if (!session || ['completed', 'cancelled'].includes(session.status)) {
    return false;
  }

  const sessionDate = new Date(session.date);
  if (Number.isNaN(sessionDate.getTime())) {
    return false;
  }

  return session.status === 'ongoing' || sessionDate.getTime() <= Date.now();
};

const readJsonSafely = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export default function SkillSessions() {
  const location = useLocation();
  const navigate = useNavigate();
  const skill = location.state?.skill || null;
  const skillId = skill?._id || skill?.id || '';

  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState(() =>
    deriveSkillSessionView({
      currentUserId: '',
      skillId,
    }),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [actionSessionId, setActionSessionId] = useState('');

  const fetchSessions = useCallback(async () => {
    if (!skillId) {
      setError('Open a skill from the dashboard or marketplace to view its 1:1 bookings.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const authPayload = await requestJson('/api/auth/me', { auth: true });
      const user = authPayload?.user || null;
      const userId = user?._id || user?.id || '';

      if (!userId) {
        throw new Error('Unable to identify the current user for this session thread.');
      }

      setCurrentUser(user);

      const [teachingResult, learningResult] = await Promise.allSettled([
        requestJson(`/api/booking/instructor/${userId}`, { auth: true }),
        requestJson(`/api/booking/student/${userId}`, { auth: true }),
      ]);

      const instructorBookings =
        teachingResult.status === 'fulfilled' ? teachingResult.value?.bookings || [] : [];
      const studentBookings =
        learningResult.status === 'fulfilled' ? learningResult.value?.bookings || [] : [];

      if (
        teachingResult.status === 'rejected' &&
        learningResult.status === 'rejected' &&
        instructorBookings.length === 0 &&
        studentBookings.length === 0
      ) {
        throw teachingResult.reason || learningResult.reason;
      }

      setView(
        deriveSkillSessionView({
          currentUserId: userId,
          skillId,
          instructorBookings,
          studentBookings,
        }),
      );
    } catch (fetchError) {
      console.error('SkillSessions error:', fetchError);
      setError(fetchError.message || 'Failed to load the session thread.');
    } finally {
      setLoading(false);
    }
  }, [skillId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const headerCopy = useMemo(() => {
    if (view.userRole === 'instructor') {
      return `Manage active 1:1 bookings, shared prep material, and post-session follow-up for ${skill?.name || 'this skill'}.`;
    }

    if (view.userRole === 'student' && view.primaryParticipant?.name) {
      return `Track your 1:1 sessions with ${view.primaryParticipant.name}, keep shared material in one place, and close the loop after each session.`;
    }

    return 'This page now tracks single-session bookings only. New bookings will appear here once a learner or instructor confirms the first 1:1 session.';
  }, [skill?.name, view.primaryParticipant?.name, view.userRole]);

  const metrics = useMemo(
    () => [
      {
        label: 'Booked',
        value: view.stats.totalSessions,
        detail: '1:1 sessions tied to this skill.',
        icon: CalendarClock,
      },
      {
        label: 'Upcoming',
        value: view.stats.upcomingSessions,
        detail: 'Still scheduled or awaiting completion.',
        icon: Clock3,
      },
      {
        label: 'Completed',
        value: view.stats.completedSessions,
        detail: 'Closed out individually, not course-wide.',
        icon: CheckCircle2,
      },
      {
        label: 'Resources',
        value: view.sharedDocuments.length,
        detail: 'Shared files attached to the session thread.',
        icon: FileText,
      },
    ],
    [view.sharedDocuments.length, view.stats.completedSessions, view.stats.totalSessions, view.stats.upcomingSessions],
  );

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    if (file && !uploadTitle.trim()) {
      const nextTitle = file.name.replace(/\.[^.]+$/, '');
      setUploadTitle(nextTitle || file.name);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!view.resourceHostSessionId) {
      toast.error('A session must exist before shared resources can be uploaded.');
      return;
    }

    if (!selectedFile || !uploadTitle.trim()) {
      toast.error('Choose a file and provide a title.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('title', uploadTitle.trim());
      if (view.userRole) {
        formData.append('uploadedBy', view.userRole);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getBaseUrl()}/api/booking/${view.resourceHostSessionId}/upload-document`,
        {
          method: 'POST',
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        },
      );

      const payload = await readJsonSafely(response);
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Failed to upload the file.');
      }

      setSelectedFile(null);
      setUploadTitle('');
      toast.success('Shared resource uploaded.');
      await fetchSessions();
    } catch (uploadError) {
      console.error(uploadError);
      toast.error(uploadError.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!view.resourceHostSessionId || !documentId) {
      return;
    }

    try {
      setActionSessionId(documentId);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getBaseUrl()}/api/booking/${view.resourceHostSessionId}/delete-document/${documentId}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            Accept: 'application/json',
          },
        },
      );

      const payload = await readJsonSafely(response);
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Failed to delete the file.');
      }

      toast.success('Shared resource removed.');
      await fetchSessions();
    } catch (deleteError) {
      console.error(deleteError);
      toast.error(deleteError.message || 'Delete failed.');
    } finally {
      setActionSessionId('');
    }
  };

  const handleCompleteSession = async (bookingId) => {
    if (!bookingId || !view.userRole) {
      return;
    }

    try {
      setActionSessionId(bookingId);
      await requestJson(`/api/booking/${bookingId}/complete-session`, {
        method: 'POST',
        auth: true,
        body: {
          completedBy: view.userRole,
        },
      });
      toast.success('Session marked complete.');
      await fetchSessions();
    } catch (completionError) {
      console.error(completionError);
      toast.error(completionError.message || 'Could not complete the session.');
    } finally {
      setActionSessionId('');
    }
  };

  if (loading) {
    return (
      <div className="glass-page min-h-screen text-zinc-100">
        <MainNavbar />
        <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 pt-24">
          <div className="surface-card w-full p-8 text-center">
            <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-red-300" />
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.3em] text-red-300/80">
              Session thread
            </p>
            <h1 className="mt-3 text-2xl font-bold text-white">Loading skill bookings</h1>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-page min-h-screen text-zinc-100">
        <MainNavbar />
        <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 pt-24">
          <div className="surface-card w-full p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-300/80">
              Session thread error
            </p>
            <h1 className="mt-3 text-2xl font-bold text-white">This skill view did not load cleanly</h1>
            <p className="mt-4 text-sm leading-7 text-zinc-300">{error}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={fetchSessions} className="glass-cta">
                Retry
              </button>
              <button type="button" onClick={() => navigate('/dashboard')} className="glass-outline-btn">
                Return to dashboard
              </button>
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
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:border-red-300/35 hover:bg-red-500/10"
          >
            <ArrowLeft size={16} />
            Back to dashboard
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
                1:1 session thread
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
                {skill?.name || 'Skill sessions'}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
                {headerCopy}
              </p>
            </div>

            <div className="reveal-up rounded-[28px] border border-white/10 bg-black/35 p-5 backdrop-blur">
              <div className="grid gap-4">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    Access mode
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    {view.userRole === 'instructor'
                      ? 'Teaching 1:1'
                      : view.userRole === 'student'
                        ? 'Learning 1:1'
                        : 'No active bookings'}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    Session rate
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    {skill?.offering?.price ? `${formatINR(skill.offering.price)}/hr` : 'Flexible or free'}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    You are signed in as
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {currentUser?.name || 'Current user'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="glass-panel p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  {metric.label}
                </p>
                <metric.icon size={16} className="text-red-300" />
              </div>
              <p className="mt-3 text-3xl font-black text-white">{metric.value}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{metric.detail}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.65fr_0.35fr]">
          <div className="space-y-6">
            <section className="glass-panel p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-red-200">
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Shared resources</h2>
                  <p className="text-sm text-zinc-400">
                    Material attached to this skill’s 1:1 session thread.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpload} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                <div className="grid gap-4 md:grid-cols-[0.55fr_0.45fr]">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-zinc-200">Resource title</span>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(event) => setUploadTitle(event.target.value)}
                      className="glass-input"
                      placeholder="Session brief, worksheet, feedback notes..."
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-zinc-200">Choose file</span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="glass-input file:mr-3 file:rounded-full file:border-0 file:bg-red-500/15 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-red-100"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-zinc-400">
                    {selectedFile ? `Ready to upload ${selectedFile.name}` : 'PDFs, docs, images, and text files are supported.'}
                  </p>
                  <button
                    type="submit"
                    disabled={!view.resourceHostSessionId || uploading}
                    className="glass-cta disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Upload size={16} />
                    {uploading ? 'Uploading resource' : 'Upload resource'}
                  </button>
                </div>
              </form>

              {view.sharedDocuments.length ? (
                <div className="mt-5 space-y-3">
                  {view.sharedDocuments.map((document) => (
                    <div key={document._id || document.filename} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{document.title || document.originalName || 'Untitled file'}</p>
                          <p className="mt-1 text-sm text-zinc-400">
                            Uploaded by {document.uploadedBy || 'participant'} on {formatDateTime(document.uploadedAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`${getBaseUrl()}/uploads/session-documents/${document.filename}`}
                            download={document.originalName || document.title || document.filename}
                            className="glass-outline-btn px-4 py-2"
                          >
                            <Download size={16} />
                            Download
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(document._id)}
                            disabled={actionSessionId === document._id}
                            className="glass-icon-btn disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label={`Delete ${document.title || document.originalName || 'document'}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[22px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm leading-7 text-zinc-300">
                  Shared resources will appear here after the first upload. There is no separate course library anymore; files now stay with the live 1:1 booking thread.
                </div>
              )}
            </section>

            <section className="glass-panel p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-blue-200">
                  <CalendarClock size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Session timeline</h2>
                  <p className="text-sm text-zinc-400">
                    Each booking stands on its own and closes individually.
                  </p>
                </div>
              </div>

              {view.sessions.length ? (
                <div className="space-y-3">
                  {view.sessions.map((session) => {
                    const otherParticipant = getParticipant(session, view.userRole);
                    const canComplete = canCompleteSession(session);

                    return (
                      <div key={session._id} className="rounded-[24px] border border-white/8 bg-black/20 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-lg font-semibold text-white">
                                {view.userRole === 'instructor'
                                  ? `Session with ${otherParticipant?.name || 'student'}`
                                  : `Session with ${otherParticipant?.name || 'instructor'}`}
                              </p>
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                                  getBookingStatusTone(session.status)
                                }`}
                              >
                                {session.status || 'pending'}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
                              <span>{formatDateTime(session.date)}</span>
                              <span>{session.duration} min</span>
                              {otherParticipant?.email ? <span>{otherParticipant.email}</span> : null}
                            </div>

                            {session.notes ? (
                              <p className="mt-4 text-sm leading-7 text-zinc-300">{session.notes}</p>
                            ) : (
                              <p className="mt-4 text-sm text-zinc-500">No session notes were added.</p>
                            )}

                            {(session.sessionRating?.student?.rating || session.sessionRating?.instructor?.rating) ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {session.sessionRating?.student?.rating ? (
                                  <span className="glass-chip border-emerald-400/25 bg-emerald-500/10 text-emerald-200">
                                    Student rated {session.sessionRating.student.rating}/5
                                  </span>
                                ) : null}
                                {session.sessionRating?.instructor?.rating ? (
                                  <span className="glass-chip border-sky-400/25 bg-sky-500/10 text-sky-200">
                                    Instructor rated {session.sessionRating.instructor.rating}/5
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex flex-col items-stretch gap-2 sm:items-end">
                            <button
                              type="button"
                              onClick={() => handleCompleteSession(session._id)}
                              disabled={!canComplete || actionSessionId === session._id}
                              className="glass-cta min-w-[170px] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actionSessionId === session._id ? 'Updating' : 'Mark complete'}
                            </button>
                            {!canComplete && session.status !== 'completed' && session.status !== 'cancelled' ? (
                              <p className="max-w-[220px] text-right text-xs leading-5 text-zinc-500">
                                Completion stays locked until the scheduled session time has started or passed.
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[22px] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
                  <p className="text-lg font-semibold text-white">No 1:1 bookings yet</p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Create or accept the first session and this skill thread will start tracking it here.
                  </p>
                  <div className="mt-5 flex justify-center gap-3">
                    <button type="button" onClick={() => navigate('/calendar')} className="glass-outline-btn">
                      Open calendar
                    </button>
                    <button type="button" onClick={() => navigate('/browse-skills')} className="glass-cta">
                      Browse skills
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <div className="glass-panel p-5">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
                <UserRound size={14} className="text-red-300" />
                Participant focus
              </div>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Primary counterpart</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {view.primaryParticipant?.name || 'No active counterpart yet'}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {view.userRole === 'instructor'
                    ? 'You are viewing the teaching side of this skill. Shared resources and completion states are available per booking.'
                    : view.userRole === 'student'
                      ? 'You are viewing the learner side of this skill. Each booked call is independent and should be completed separately.'
                      : 'This skill does not have a live 1:1 booking thread yet.'}
                </p>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Unique participants</p>
                <p className="mt-2 text-2xl font-black text-white">{view.stats.uniqueParticipantCount}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Counted from the other side of the booking relation for this skill only.
                </p>
              </div>
            </div>

            <div className="glass-panel p-5">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
                <ShieldCheck size={14} className="text-red-300" />
                1:1 rules
              </div>

              <div className="mt-4 space-y-3">
                {[
                  'Bookings now stay single-session only. The old course-wide completion flow has been removed.',
                  'A learner cannot book their own teaching listing, and a booking must point at the actual instructor who owns the skill.',
                  'Shared resources live on the active booking thread instead of a separate course container.',
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
          </div>
        </section>
      </main>
    </div>
  );
}
