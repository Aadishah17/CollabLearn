import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function PublicListBlock({ kind, items }) {
  if (!items.length) {
    return (
      <div className="surface-card p-8 text-center">
        <p className="text-lg font-semibold text-white">No public entries available</p>
        <p className="mt-2 text-sm text-zinc-400">A small fallback fixture keeps the page usable even when the API is empty.</p>
      </div>
    );
  }

  return (
    <section className="surface-card p-5 md:p-6">
      <div className="space-y-3">
        {items.map((item) => {
          const slug = item.slug || item.trackSlug || item.competitionSlug || item.id || item._id;
          const label = item.title || item.name || slug;
          const summary = item.summary || item.description || item.overview || '';

          return (
            <Link
              key={slug}
              to={`/${kind}/${slug}`}
              className="group flex flex-col gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.05] md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{label}</h2>
                  {item.status ? (
                    <span className="glass-chip border-white/12 bg-white/[0.04] text-[11px] uppercase tracking-[0.18em] text-zinc-300">
                      {item.status}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-300">{summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(item.tags || []).slice(0, 3).map((tag) => (
                    <span key={tag} className="glass-chip border-white/10 bg-white/[0.035] text-[11px] text-zinc-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-red-300 transition-colors group-hover:text-red-200">
                <span>{kind === 'career' ? 'Open track' : 'Open brief'}</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

