import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { PublicListBlock } from './PublicBlocks.jsx';
import { PublicLoading, PublicNotice, PublicShell } from './PublicShell.jsx';
import { loadPublicItems, usePublicSession } from './publicData.js';
import { careerFallbackTracks, resolvePublicPageCta } from './publicContent.js';

export function CareerPage() {
  const session = usePublicSession();
  const publicEntry = resolvePublicPageCta(session);
  const [state, setState] = useState({ loading: true, items: [], source: 'loading', warning: '' });

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await loadPublicItems({
        listPath: '/api/public/career/tracks',
        detailPath: (value) => `/api/public/career/tracks/${value}`,
        listKeys: ['tracks', 'careerTracks', 'items', 'data', 'results'],
        detailKeys: ['track', 'item', 'data', 'result'],
        fallbackItems: careerFallbackTracks,
      });
      if (active) {
        setState({ loading: false, items: result.items, source: result.source, warning: result.warning || '' });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const featured = state.items[0] || careerFallbackTracks[0];

  return (
    <PublicShell
      eyebrow="Public career tracks"
      title="Career paths that stay concrete, current, and easy to browse without logging in."
      copy="A small, premium public surface for learning what a track leads to, what it connects to, and how it maps to real job search advice."
      chips={[
        `${state.items.length || careerFallbackTracks.length} public tracks`,
        featured?.roleTitle || 'Career direction for guests',
        featured?.linkedSkills?.length ? `${featured.linkedSkills.length} linked skills` : 'Connected learning assets',
      ]}
      cta={{ label: session.hasSession ? 'Open workspace' : 'Get started', to: publicEntry.path }}
    >
      {state.warning ? (
        <PublicNotice
          title="Public feed fallback"
          copy={`The career list could not be loaded cleanly, so a small fixture is being used. ${state.warning}`}
        />
      ) : null}
      {state.loading ? <PublicLoading label="Loading career tracks" /> : null}
      {!state.loading ? (
        <>
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="surface-card p-6 md:p-7">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-red-200">
                  <Briefcase size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Featured track</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">{featured.title}</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-zinc-300">{featured.summary || featured.roleSummary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(featured.tags || []).slice(0, 4).map((tag) => (
                  <span key={tag} className="glass-chip border-white/10 bg-white/[0.035] text-zinc-200">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={`/career/${featured.slug}`} className="glass-cta">
                  View track
                </Link>
                <Link to={publicEntry.path} className="glass-outline-btn">
                  {publicEntry.label}
                </Link>
              </div>
            </div>
            <div className="grid gap-4">
              <PublicNotice title="Live count" copy={`${state.items.length} public career track${state.items.length === 1 ? '' : 's'} available.`} />
              <PublicNotice title="Access" copy="Guests can read every track without a login. Signed-in users are routed to their existing workspace destination." />
              <PublicNotice title="Source" copy={state.source === 'api-list' ? 'Public API' : 'Fallback fixture'} />
            </div>
          </section>
          <PublicListBlock kind="career" items={state.items} />
        </>
      ) : null}
    </PublicShell>
  );
}

