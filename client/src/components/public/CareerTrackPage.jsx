import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Briefcase, Target } from 'lucide-react';
import { PublicLoading, PublicNotice, PublicShell } from './PublicShell.jsx';
import { loadPublicItems, usePublicSession } from './publicData.js';
import { careerFallbackTracks, resolvePublicPageCta } from './publicContent.js';

export function CareerTrackPage() {
  const { trackSlug = '' } = useParams();
  const session = usePublicSession();
  const publicEntry = resolvePublicPageCta(session);
  const [state, setState] = useState({ loading: true, item: null, source: 'loading', warning: '' });

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await loadPublicItems({
        listPath: '/api/public/career/tracks',
        detailPath: (value) => `/api/public/career/tracks/${value}`,
        listKeys: ['tracks', 'careerTracks', 'items', 'data', 'results'],
        detailKeys: ['track', 'item', 'data', 'result'],
        slug: trackSlug,
        fallbackItems: careerFallbackTracks,
      });
      if (active) {
        setState({
          loading: false,
          item: result.item,
          source: result.source,
          warning: result.warning || '',
        });
      }
    })();
    return () => {
      active = false;
    };
  }, [trackSlug]);

  const track = state.item || careerFallbackTracks[0];
  const linkedSkills = Array.isArray(track?.linkedSkills) ? track.linkedSkills : [];
  const linkedCourses = Array.isArray(track?.linkedCourses) ? track.linkedCourses : [];
  const linkedModules = Array.isArray(track?.linkedModules) ? track.linkedModules : [];

  return (
    <PublicShell
      eyebrow="Career track"
      title={track.title || 'Career track'}
      copy={track.roleSummary || track.summary || 'Guest-facing career detail page.'}
      chips={[track.roleTitle, ...(track.tags || []).slice(0, 2)].filter(Boolean)}
      cta={{ label: session.hasSession ? 'Open workspace' : 'Get started', to: publicEntry.path }}
    >
      {state.loading ? (
        <PublicLoading label="Loading career track detail" />
      ) : (
        <>
          {state.warning ? (
            <PublicNotice
              title="Using a fallback fixture"
              copy={`The public career endpoint was unavailable or empty. ${state.warning}`}
            />
          ) : null}
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="surface-card p-6 md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="glass-chip border-white/15 bg-white/[0.04] text-zinc-200">
                  {track.roleTitle || 'Career track'}
                </span>
                {(track.tags || []).slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="glass-chip border-white/15 bg-white/[0.04] text-zinc-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-4xl">
                {track.title}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">
                {track.summary || track.roleSummary}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <PublicNotice
                  title="Role summary"
                  copy={track.roleSummary || 'No role summary provided.'}
                />
                <PublicNotice
                  title="Hiring advice"
                  copy={track.hiringAdvice || 'No hiring advice provided.'}
                />
              </div>
            </div>
            <div className="grid gap-4 self-start">
              <div className="surface-card p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-red-200">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                      Skill stack
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {linkedSkills.length ? (
                        linkedSkills.map((item) => (
                          <span
                            key={typeof item === 'string' ? item : item?.name || item?.title}
                            className="glass-chip border-white/10 bg-white/[0.035] text-zinc-200"
                          >
                            {typeof item === 'string' ? item : item?.name || item?.title || 'Skill'}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-zinc-400">No linked skills</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="surface-card p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-blue-200">
                    <Target size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                      Supporting assets
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[...linkedCourses, ...linkedModules].length ? (
                        [...linkedCourses, ...linkedModules].map((item) => (
                          <span
                            key={typeof item === 'string' ? item : item?.name || item?.title}
                            className="glass-chip border-white/10 bg-white/[0.035] text-zinc-200"
                          >
                            {typeof item === 'string' ? item : item?.name || item?.title || 'Item'}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-zinc-400">No supporting assets</span>
                      )}
                    </div>
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
            <PublicNotice
              title="Source mode"
              copy={
                state.source === 'api-list' || state.source === 'api-detail'
                  ? 'Live public payload'
                  : 'Client-side fixture fallback'
              }
            />
            <PublicNotice
              title="Access"
              copy={`Guests can view this page without signing in. ${session.hasSession ? 'Signed-in users are sent to their workspace CTA.' : 'The CTA routes to account creation or login.'}`}
            />
            <PublicNotice
              title="Next step"
              copy={track.cta?.label || 'Continue into the track from the public listing.'}
            />
          </section>
        </>
      )}
    </PublicShell>
  );
}
