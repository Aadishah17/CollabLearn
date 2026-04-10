import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, Trophy } from 'lucide-react';
import { PublicLoading, PublicNotice, PublicShell } from './PublicShell.jsx';
import { loadPublicItems, usePublicSession } from './publicData.js';
import { competitionFallbackItems, formatPublicDate, resolvePublicPageCta } from './publicContent.js';

export function CompetitionDetailPage() {
  const { slug = '' } = useParams();
  const session = usePublicSession();
  const publicEntry = resolvePublicPageCta(session);
  const [state, setState] = useState({ loading: true, item: null, source: 'loading', warning: '' });

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await loadPublicItems({
        listPath: '/api/public/competitions',
        detailPath: (value) => `/api/public/competitions/${value}`,
        listKeys: ['competitions', 'items', 'data', 'results'],
        detailKeys: ['competition', 'item', 'data', 'result'],
        slug,
        fallbackItems: competitionFallbackItems,
      });
      if (active) {
        setState({ loading: false, item: result.item, source: result.source, warning: result.warning || '' });
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const competition = state.item || competitionFallbackItems[0];

  return (
    <PublicShell
      eyebrow="Competition brief"
      title={competition.title || 'Competition'}
      copy={competition.overview || competition.summary || 'Guest-facing competition detail page.'}
      chips={[competition.status, competition.timing?.label, competition.reward].filter(Boolean)}
      cta={{ label: session.hasSession ? 'Open workspace' : 'Get started', to: publicEntry.path }}
    >
      {state.loading ? (
        <PublicLoading label="Loading competition detail" />
      ) : (
        <>
          {state.warning ? (
            <PublicNotice title="Using a fallback fixture" copy={`The public competition endpoint was unavailable or empty. ${state.warning}`} />
          ) : null}
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="surface-card p-6 md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                {[competition.status, competition.timing?.label, competition.reward]
                  .filter(Boolean)
                  .map((chip) => (
                    <span key={chip} className="glass-chip border-white/15 bg-white/[0.04] text-zinc-200">
                      {chip}
                    </span>
                  ))}
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-4xl">{competition.title}</h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">
                {competition.summary || competition.overview || 'Guest-facing competition detail page.'}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <PublicNotice title="Timeline" copy={`${formatPublicDate(competition.timing?.start)} to ${formatPublicDate(competition.timing?.end)}`} />
                <PublicNotice title="Source" copy={competition.sourceUrl || 'Public competition feed'} />
              </div>
            </div>
            <div className="grid gap-4 self-start">
              <div className="surface-card p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-red-200">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">What winners get</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">
                      {competition.reward || 'Mentor feedback and a featured showcase slot.'}
                    </p>
                  </div>
                </div>
                {competition.requirements?.length ? (
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Requirements</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {competition.requirements.map((item) => (
                        <span key={item} className="glass-chip border-white/10 bg-white/[0.035] text-zinc-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="surface-card p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-blue-200">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Judging</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">
                      {(competition.judgingCriteria || ['Clarity', 'Craft', 'Execution']).join(' · ')}
                    </p>
                  </div>
                </div>
              </div>
              <Link to={publicEntry.path} className="glass-cta justify-between">
                <span>{publicEntry.path === '/signup' ? 'Create account' : publicEntry.label}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
          <section className="grid gap-4 lg:grid-cols-3">
            <PublicNotice title="Source mode" copy={state.source === 'api-list' || state.source === 'api-detail' ? 'Live public payload' : 'Client-side fixture fallback'} />
            <PublicNotice title="Access" copy={`Guests can view this page without signing in. ${session.hasSession ? 'Signed-in users are sent to their workspace CTA.' : 'The CTA routes to account creation or login.'}`} />
            <PublicNotice title="Next step" copy={competition.cta?.label || 'Enter the competition from the public listing.'} />
          </section>
        </>
      )}
    </PublicShell>
  );
}

