import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Globe,
  Layers3,
  Lock,
  PlusCircle,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import MainNavbar from '../navbar/mainNavbar.jsx';
import { API_URL } from '../config';

const FILTERS = [
  { key: 'all', label: 'All modules' },
  { key: 'mine', label: 'Owned by me' },
  { key: 'shared', label: 'Shared with me' },
  { key: 'public', label: 'Public library' },
];

const SORTS = [
  { key: 'recent', label: 'Most recent' },
  { key: 'alphabetical', label: 'A to Z' },
  { key: 'collaborative', label: 'Most collaborative' },
];

const TEMPLATES = [
  {
    key: 'study-guide',
    title: 'Study guide',
    copy: 'Structured notes, checkpoints, and reading links for a skill sprint.',
  },
  {
    key: 'workshop',
    title: 'Workshop plan',
    copy: 'Agenda, exercises, and outcomes for a mentor-led live session.',
  },
  {
    key: 'team-notes',
    title: 'Team notes',
    copy: 'Shared learning notes for collaborators, cohorts, or peer review groups.',
  },
];

function formatUpdatedAt(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown update';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function estimateReadingMinutes(module) {
  const plainText = `${module.title || ''} ${module.description || ''} ${module.content || ''}`
    .replace(/<[^>]*>/g, ' ')
    .trim();
  const words = plainText ? plainText.split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 180));
}

export default function ModuleDashboard() {
  const currentUserId = localStorage.getItem('userId');
  const currentUserName = localStorage.getItem('username') || 'Learner';

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/modules`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        setModules(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch (fetchError) {
        console.error('Error fetching modules:', fetchError);
        setError('Unable to load modules right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const metrics = useMemo(() => {
    const total = modules.length;
    const publicModules = modules.filter((module) => module.visibility === 'public').length;
    const ownedModules = modules.filter(
      (module) => String(module.owner?._id || module.owner?.id || '') === String(currentUserId),
    ).length;
    const collaborativeModules = modules.filter((module) =>
      (module.collaborators || []).some(
        (collaborator) => String(collaborator.user?._id || collaborator.user?.id || '') !== String(currentUserId),
      ),
    ).length;

    return { total, publicModules, ownedModules, collaborativeModules };
  }, [currentUserId, modules]);

  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const visibleModules = modules.filter((module) => {
      const ownerId = String(module.owner?._id || module.owner?.id || '');
      const collaboratorIds = (module.collaborators || []).map((collaborator) =>
        String(collaborator.user?._id || collaborator.user?.id || collaborator.user || ''),
      );
      const isOwner = ownerId === String(currentUserId);
      const isShared = collaboratorIds.includes(String(currentUserId)) && !isOwner;

      if (activeFilter === 'mine' && !isOwner) return false;
      if (activeFilter === 'shared' && !isShared) return false;
      if (activeFilter === 'public' && module.visibility !== 'public') return false;

      if (!query) return true;

      const haystack = [
        module.title,
        module.description,
        ...(Array.isArray(module.tags) ? module.tags : []),
        module.owner?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });

    const sortedModules = [...visibleModules];

    if (sortBy === 'alphabetical') {
      sortedModules.sort((left, right) => String(left.title || '').localeCompare(String(right.title || '')));
    } else if (sortBy === 'collaborative') {
      sortedModules.sort(
        (left, right) => (right.collaborators?.length || 0) - (left.collaborators?.length || 0),
      );
    } else {
      sortedModules.sort(
        (left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt),
      );
    }

    return sortedModules;
  }, [activeFilter, currentUserId, modules, searchQuery, sortBy]);

  return (
    <div className="glass-page min-h-screen text-zinc-100">
      <MainNavbar />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6">
        <section className="surface-card surface-card-shimmer card-spotlight relative overflow-hidden p-7 md:p-8">
          <div className="ambient-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="pointer-events-none absolute left-[-6%] top-12 h-48 w-48 rounded-full bg-red-500/16 blur-[110px]" />
          <div className="pointer-events-none absolute right-[-4%] top-4 h-56 w-56 rounded-full bg-blue-500/14 blur-[130px]" />

          <div className="relative grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="reveal-up">
              <div className="eyebrow">
                <Sparkles size={14} className="text-red-300" />
                Collaborative learning documents
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-5xl">
                Modules that feel like a shared study workspace, not a file dump.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
                Organize learning notes, workshop plans, and collaborative study docs in one
                place. Search quickly, separate private work from the public library, and keep the
                next resource easy to find.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/modules/create" className="glass-cta">
                  <PlusCircle size={18} />
                  Create module
                </Link>
                <Link
                  to="/ai-learning"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-blue-400/45 hover:bg-blue-500/12"
                >
                  Open AI learning
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 reveal-up">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Total modules
                </p>
                <p className="mt-3 text-3xl font-black text-white">{metrics.total}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Across personal drafts, shared docs, and the public library.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Public library
                </p>
                <p className="mt-3 text-3xl font-black text-white">{metrics.publicModules}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Ready for discovery by learners and collaborators.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Owned by you
                </p>
                <p className="mt-3 text-3xl font-black text-white">{metrics.ownedModules}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Created under {currentUserName}'s workspace.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Collaborative docs
                </p>
                <p className="mt-3 text-3xl font-black text-white">{metrics.collaborativeModules}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Shared with at least one additional collaborator.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-panel p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="glass-input pl-9"
                  placeholder="Search title, description, owner, or tags"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className={`glass-chip ${
                      activeFilter === filter.key
                        ? 'border-red-400/55 bg-red-500/18 text-red-100'
                        : 'border-white/15 bg-white/5 text-zinc-300'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-400">
                Showing <span className="font-semibold text-zinc-200">{filteredModules.length}</span> module
                {filteredModules.length === 1 ? '' : 's'}
              </p>

              <label className="flex items-center gap-2 text-sm text-zinc-300">
                Sort by
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="glass-input min-w-[180px] py-2"
                >
                  {SORTS.map((sortOption) => (
                    <option key={sortOption.key} value={sortOption.key}>
                      {sortOption.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="glass-panel p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Quick starts
            </p>
            <div className="mt-4 grid gap-3">
              {TEMPLATES.map((template) => (
                <Link
                  key={template.key}
                  to={`/modules/create?template=${template.key}`}
                  className="interactive-tile rounded-[24px] border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-white">{template.title}</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">{template.copy}</p>
                    </div>
                    <ArrowRight size={16} className="mt-1 text-red-300" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {error ? (
          <section className="glass-panel mt-6 border border-red-500/35 p-5 text-red-100">
            {error}
          </section>
        ) : null}

        {loading ? (
          <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="glass-panel animate-pulse p-5">
                <div className="mb-4 h-4 w-24 rounded bg-white/10" />
                <div className="mb-3 h-7 w-2/3 rounded bg-white/10" />
                <div className="mb-2 h-4 w-full rounded bg-white/10" />
                <div className="mb-5 h-4 w-4/5 rounded bg-white/10" />
                <div className="h-10 w-full rounded bg-white/10" />
              </div>
            ))}
          </section>
        ) : filteredModules.length === 0 ? (
          <section className="glass-panel mt-6 p-10 text-center">
            <Layers3 size={48} className="mx-auto text-zinc-500" />
            <h2 className="mt-5 text-2xl font-bold text-white">No modules match this view</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-zinc-300">
              Adjust the search, switch filters, or start a fresh module with one of the quick
              templates above.
            </p>
            <Link to="/modules/create" className="glass-cta mt-6">
              Create a module
            </Link>
          </section>
        ) : (
          <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredModules.map((module, index) => {
              const ownerId = String(module.owner?._id || module.owner?.id || '');
              const isOwner = ownerId === String(currentUserId);
              const collaboratorCount = module.collaborators?.length || 0;
              const readingMinutes = estimateReadingMinutes(module);
              const visibilityLabel =
                module.visibility === 'public'
                  ? 'Public'
                  : module.visibility === 'link'
                    ? 'Shared by link'
                    : 'Private';

              return (
                <article
                  key={module._id}
                  className="glass-panel card-spotlight reveal-up flex h-full flex-col p-5"
                  style={{ animationDelay: `${Math.min(index * 70, 280)}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                        module.visibility === 'public'
                          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                          : module.visibility === 'link'
                            ? 'border-blue-400/30 bg-blue-500/10 text-blue-200'
                            : 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                      }`}
                    >
                      {module.visibility === 'public' ? <Globe size={20} /> : <Lock size={20} />}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="glass-chip border-white/15 bg-white/5 text-zinc-200">
                        {visibilityLabel}
                      </span>
                      {isOwner ? (
                        <span className="glass-chip border-red-400/45 bg-red-500/15 text-red-100">
                          Owner
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <h2 className="mt-5 text-2xl font-bold text-white">{module.title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-zinc-300">
                    {module.description || 'No description yet. Open the module to add context and resources.'}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(module.tags || []).slice(0, 3).map((tag) => (
                      <span
                        key={`${module._id}-${tag}`}
                        className="glass-chip border-white/12 bg-white/[0.04] text-zinc-300"
                      >
                        #{tag}
                      </span>
                    ))}
                    {module.tags?.length > 3 ? (
                      <span className="glass-chip border-white/12 bg-white/[0.04] text-zinc-400">
                        +{module.tags.length - 3}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-3 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2">
                        <Users size={14} className="text-red-300" />
                        Collaborators
                      </span>
                      <span>{collaboratorCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={14} className="text-blue-300" />
                        Reading time
                      </span>
                      <span>{readingMinutes} min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2">
                        <BookOpen size={14} className="text-emerald-300" />
                        Updated
                      </span>
                      <span>{formatUpdatedAt(module.updatedAt || module.createdAt)}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Owner
                      </p>
                      <p className="truncate text-sm font-semibold text-zinc-100">
                        {module.owner?.name || currentUserName}
                      </p>
                    </div>

                    <Link to={`/modules/${module._id}`} className="glass-cta px-4 py-2">
                      Open
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
