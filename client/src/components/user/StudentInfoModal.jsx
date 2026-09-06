import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  GraduationCap,
  LoaderCircle,
  MessageSquare,
  Target,
  X,
} from 'lucide-react';
import { getStudentDetails } from '../../services/dashboardApi';

const formatDateTime = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatDate = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const statusClassMap = {
  completed: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  confirmed: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
  pending: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  cancelled: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
  ongoing: 'border-violet-400/30 bg-violet-500/10 text-violet-200',
};

export default function StudentInfoModal({ student, skill, onClose, onMessage }) {
  const studentId = student?._id || student?.id;
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudentDetails = useCallback(async () => {
    if (!studentId) {
      setError('Student details are unavailable for this session.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = await getStudentDetails(studentId);
      setDetails(payload);
    } catch (fetchError) {
      console.error('Error fetching student details:', fetchError);
      setError(fetchError.message || 'Failed to load student details.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
    }
  }, [fetchStudentDetails, studentId]);

  const metrics = useMemo(() => {
    const stats = details?.stats || {};
    return [
      {
        label: 'Sessions together',
        value: stats.totalSessions ?? 0,
        detail: 'Booked across past and upcoming coaching blocks.',
        icon: CalendarClock,
      },
      {
        label: 'Completed',
        value: stats.completedSessions ?? 0,
        detail: 'Sessions already finished and reflected in history.',
        icon: CheckCircle2,
      },
      {
        label: 'Scheduled',
        value: stats.upcomingSessions ?? 0,
        detail: 'Upcoming sessions still on the calendar.',
        icon: Clock3,
      },
      {
        label: 'Practice hours',
        value: details?.stats?.totalHours ?? 0,
        detail: 'Total shared session time logged so far.',
        icon: Target,
      },
    ];
  }, [details]);

  if (!student) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm">
      <div className="surface-card relative w-full max-w-5xl overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-blue-500/10" />

        <div className="relative border-b border-white/10 px-6 py-5 md:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/8 text-xl font-black text-white">
                {(details?.student?.name || student?.name || 'S').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-zinc-400">
                  Student Snapshot
                </p>
                <h2 className="mt-2 truncate text-3xl font-black tracking-tight text-white">
                  {details?.student?.name || student?.name || 'Unknown student'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {skill?.name ? `Focused on ${skill.name}. ` : ''}
                  Student since {formatDate(details?.student?.joinDate)}.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="glass-icon-btn shrink-0"
              aria-label="Close student details"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="relative flex flex-col items-center justify-center gap-4 px-6 py-16 text-center md:px-8">
            <LoaderCircle className="h-10 w-10 animate-spin text-red-300" />
            <div>
              <p className="text-lg font-semibold text-white">Loading student details</p>
              <p className="mt-2 text-sm text-zinc-400">
                Pulling in booked sessions, learning goals, and live progress.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="relative px-6 py-16 text-center md:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-red-300">
              Student details unavailable
            </p>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-300">{error}</p>
            <div className="mt-8 flex justify-center gap-3">
              <button type="button" onClick={fetchStudentDetails} className="glass-cta">
                Retry
              </button>
              <button type="button" onClick={onClose} className="glass-outline-btn">
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="relative max-h-[85vh] overflow-y-auto px-6 py-6 md:px-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
                >
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
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-6">
                <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-red-200">
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Learning goals</h3>
                      <p className="text-sm text-zinc-400">
                        Live progress pulled from the student’s active skill goals.
                      </p>
                    </div>
                  </div>

                  {details?.learningGoals?.length ? (
                    <div className="mt-5 space-y-4">
                      {details.learningGoals.map((goal) => (
                        <div
                          key={goal.id || goal.skill}
                          className="rounded-[22px] border border-white/8 bg-black/20 p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-white">{goal.skill}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                                {goal.currentInstructor?.name
                                  ? `Learning with ${goal.currentInstructor.name}`
                                  : 'Instructor not assigned'}
                              </p>
                            </div>
                            <p className="text-lg font-black text-white">{goal.progress}%</p>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-red-400 via-red-500 to-blue-400"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-5 text-sm leading-7 text-zinc-300">
                      This student has not added trackable learning goals yet. Their session history
                      is still available below.
                    </p>
                  )}
                </section>

                <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
                  <h3 className="text-xl font-bold text-white">Session timing</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                        Last session
                      </p>
                      <p className="mt-3 text-base font-semibold text-white">
                        {formatDateTime(details?.stats?.lastSessionAt)}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                        Next session
                      </p>
                      <p className="mt-3 text-base font-semibold text-white">
                        {formatDateTime(details?.stats?.nextSessionAt)}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
                <h3 className="text-xl font-bold text-white">Session history</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Shared session records between you and this student.
                </p>

                {details?.sessionHistory?.length ? (
                  <div className="mt-5 space-y-3">
                    {details.sessionHistory.map((session) => (
                      <div
                        key={session.id}
                        className="rounded-[22px] border border-white/8 bg-black/20 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{session.skill}</p>
                            <p className="mt-1 text-sm text-zinc-400">
                              {formatDateTime(session.date)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                              statusClassMap[session.status] || statusClassMap.pending
                            }`}
                          >
                            {session.status}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
                          <span>{session.duration} min</span>
                          {session.rating ? <span>Rating {session.rating}/5</span> : null}
                        </div>

                        {session.notes ? (
                          <p className="mt-3 text-sm leading-6 text-zinc-300">{session.notes}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm leading-7 text-zinc-300">
                    No shared session history has been recorded yet.
                  </p>
                )}
              </section>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/10 pt-6">
              <button type="button" onClick={onClose} className="glass-outline-btn">
                Close
              </button>
              <button type="button" onClick={() => onMessage?.(student)} className="glass-cta">
                <MessageSquare size={16} />
                Message student
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
