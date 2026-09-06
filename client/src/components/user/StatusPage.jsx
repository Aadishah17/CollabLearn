import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CircleAlert,
  Clock3,
  Cpu,
  Database,
  RefreshCcw,
  Server,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LandingNavbar from '../../navbar/landingNavbar';
import { API_URL } from '../../config';
import { hasStoredSession } from '../../utils/session';
import { requestJson } from '../../services/apiClient';
import {
  formatProviderLabel,
  formatStatusTimestamp,
  getAiStatusMeta,
  getHealthStatusMeta,
  getStudioModelLabel,
  getToneClasses,
} from '../../utils/status';

export default function StatusPage() {
  const [health, setHealth] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingLive, setCheckingLive] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  const [loadError, setLoadError] = useState('');

  const hasSession = hasStoredSession();

  const loadStatus = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [healthResult, aiResult] = await Promise.allSettled([
        requestJson('/api/health'),
        requestJson('/api/ai/studio-status'),
      ]);

      const loadFailures = [];

      if (healthResult.status === 'fulfilled') {
        setHealth(healthResult.value);
      } else {
        loadFailures.push('platform health');
      }

      if (aiResult.status === 'fulfilled') {
        setAiStatus(aiResult.value);
      } else {
        loadFailures.push('AI status');
      }

      setLastRefreshAt(new Date().toISOString());
      setLoadError(loadFailures.length ? `Could not refresh ${loadFailures.join(' and ')}.` : '');
    } catch (error) {
      console.error('Public status load error:', error);
      setLoadError(error.message || 'Could not load public system status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const runLiveCheck = async () => {
    setCheckingLive(true);

    try {
      const data = await requestJson('/api/ai/studio-test', { method: 'POST', auth: true });
      await loadStatus({ silent: true });
      toast.success(`${formatProviderLabel(data.provider)} responded successfully`);
    } catch (error) {
      await loadStatus({ silent: true });
      toast.error(error.message || 'AI live check failed');
    } finally {
      setCheckingLive(false);
    }
  };

  const healthMeta = getHealthStatusMeta(health);
  const aiMeta = getAiStatusMeta(aiStatus);
  const dbStatus = health?.dbStatus || health?.db || 'unknown';
  const aiModelLabel = getStudioModelLabel(aiStatus);

  return (
    <div className="glass-page min-h-screen overflow-x-hidden text-zinc-100">
      <LandingNavbar />

      <main className="px-6 pb-20 pt-32 md:pt-36">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="surface-card relative overflow-hidden p-7 md:p-10">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-500/8 via-transparent to-red-500/8" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl">
                <div className="eyebrow">
                  <Activity size={14} className="text-blue-300" />
                  Public system status
                </div>
                <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
                  See whether the website, API, and AI layer are actually ready.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
                  This page exposes the public health snapshot, the current AI provider state, and
                  the latest live verification result so learners do not have to guess.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className={`glass-chip ${getToneClasses(healthMeta.tone)}`}>
                    {healthMeta.tone === 'emerald' ? (
                      <ShieldCheck size={14} />
                    ) : (
                      <CircleAlert size={14} />
                    )}
                    {healthMeta.label}
                  </span>
                  <span className={`glass-chip ${getToneClasses(aiMeta.tone)}`}>
                    {aiMeta.tone === 'emerald' ? (
                      <ShieldCheck size={14} />
                    ) : (
                      <CircleAlert size={14} />
                    )}
                    {aiMeta.label}
                  </span>
                  <span className="glass-chip border-white/15">
                    <Clock3 size={14} />
                    Updated {formatStatusTimestamp(lastRefreshAt)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  onClick={() => loadStatus({ silent: true })}
                  disabled={refreshing}
                  className="glass-outline-btn"
                >
                  <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
                  {refreshing ? 'Refreshing...' : 'Refresh status'}
                </button>
                <button
                  type="button"
                  onClick={runLiveCheck}
                  disabled={checkingLive}
                  className="glass-cta"
                >
                  {checkingLive ? 'Running live check...' : 'Run live AI check'}
                </button>
                <Link
                  to={hasSession ? '/dashboard' : '/signup'}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-red-400/45 hover:bg-red-500/12"
                >
                  {hasSession ? 'Open workspace' : 'Create account'}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>

          {loadError ? (
            <section className="rounded-[28px] border border-rose-500/35 bg-rose-500/10 p-5 text-sm leading-7 text-rose-100">
              <p className="font-semibold text-white">
                Status page could not load the latest snapshot.
              </p>
              <p className="mt-2">{loadError}</p>
            </section>
          ) : null}

          {aiStatus?.quotaExceeded ? (
            <section className="rounded-[28px] border border-amber-500/35 bg-amber-500/10 p-5 text-sm leading-7 text-amber-100">
              <p className="font-semibold text-white">Primary AI quota is currently exhausted.</p>
              <p className="mt-2">
                Gemini is configured, but the last live check hit provider quota. The learning
                workspace can still rely on the local planner until quota or billing headroom is
                restored.
              </p>
            </section>
          ) : null}

          <section className="grid gap-5 lg:grid-cols-3">
            <div className="surface-card p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  Platform
                </p>
                <Server size={18} className="text-blue-300" />
              </div>
              <p className="mt-5 text-3xl font-black text-white">{healthMeta.label}</p>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{healthMeta.detail}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-400">
                <span className="glass-chip border-white/12">
                  API {health?.status || 'unknown'}
                </span>
                <span className="glass-chip border-white/12">DB {dbStatus}</span>
              </div>
            </div>

            <div className="surface-card p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  Database
                </p>
                <Database size={18} className="text-emerald-300" />
              </div>
              <p className="mt-5 text-3xl font-black text-white">{dbStatus}</p>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                Connection state reported by the API health endpoint.
              </p>
              <div className="mt-5 space-y-2 text-sm text-zinc-300">
                <p>
                  Environment:{' '}
                  <span className="text-white">{health?.environment || 'unknown'}</span>
                </p>
                <p>
                  Uptime:{' '}
                  <span className="text-white">{health?.uptimeSeconds ?? 'unknown'} seconds</span>
                </p>
              </div>
            </div>

            <div className="surface-card p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  Learning AI
                </p>
                <Sparkles size={18} className="text-red-300" />
              </div>
              <p className="mt-5 text-3xl font-black text-white">{aiMeta.label}</p>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{aiMeta.detail}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-400">
                <span className="glass-chip border-white/12">
                  {formatProviderLabel(aiStatus?.provider)}
                </span>
                {aiModelLabel ? (
                  <span className="glass-chip border-white/12">{aiModelLabel}</span>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="surface-card p-6 md:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    Public diagnostics
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    What the platform is reporting right now
                  </h2>
                </div>
                <Cpu size={20} className="text-zinc-300" />
              </div>

              {loading && !health && !aiStatus ? (
                <p className="mt-6 text-sm text-zinc-400">Loading the current system snapshot...</p>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                      API endpoint
                    </p>
                    <p className="mt-3 text-base font-semibold text-white">{API_URL}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      Health checked via <span className="text-white">/api/health</span>.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                      Last live AI check
                    </p>
                    <p className="mt-3 text-base font-semibold text-white">
                      {formatStatusTimestamp(
                        aiStatus?.lastCheckedAt || aiStatus?.diagnostics?.checkedAt
                      )}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      The latest cached verification result from the AI status endpoint.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                      Fallback mode
                    </p>
                    <p className="mt-3 text-base font-semibold text-white">
                      {aiStatus?.fallbackActive ? 'Enabled' : 'Not needed'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      If the live provider is unavailable, the workspace can still generate a local
                      plan.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                      Latest issue
                    </p>
                    <p className="mt-3 text-base font-semibold text-white">
                      {aiStatus?.lastError || 'No provider issue cached'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      Provider errors are normalized so degraded and quota states can be shown
                      clearly.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="surface-card p-6 md:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Operational notes
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">How to read this page</h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-zinc-300">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="font-semibold text-white">Healthy</p>
                  <p className="mt-2">
                    The API is reachable, the database is connected, and the latest AI live check
                    succeeded.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="font-semibold text-white">Degraded</p>
                  <p className="mt-2">
                    The site is up, but the external AI provider failed its latest live check. The
                    app may fall back to local planning.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="font-semibold text-white">Quota exhausted</p>
                  <p className="mt-2">
                    The AI key is recognized, but the provider has no available request quota right
                    now. A new live check will return once quota or billing is fixed.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
