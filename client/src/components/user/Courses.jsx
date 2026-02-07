import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Play,
  Clock3,
  BarChart3,
  Search,
  SlidersHorizontal,
  Sparkles,
  BookOpen,
  ArrowUpDown
} from 'lucide-react';
import MainNavbar from '../../navbar/mainNavbar';
import { API_URL } from '../../config';

const PREFERRED_CATEGORY_ORDER = ['Visual Design', 'Content Creation', 'Productivity', 'Other'];

const sortByPreferredCategory = (categories) => {
  const rank = new Map(PREFERRED_CATEGORY_ORDER.map((name, index) => [name, index]));
  return [...categories].sort((a, b) => {
    const rankA = rank.has(a) ? rank.get(a) : Number.MAX_SAFE_INTEGER;
    const rankB = rank.has(b) ? rank.get(b) : Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return a.localeCompare(b);
  });
};

const parseDurationToMinutes = (value) => {
  const text = String(value || '').toLowerCase();
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*h/);
  const minuteMatch = text.match(/(\d+)\s*m/);

  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  const total = Math.round(hours * 60 + minutes);
  return Number.isFinite(total) && total > 0 ? total : 60;
};

const getDifficultyTone = (difficulty) => {
  if (difficulty === 'Advanced') return 'bg-rose-500/20 text-rose-200 border-rose-400/30';
  if (difficulty === 'Intermediate') return 'bg-amber-500/20 text-amber-200 border-amber-400/30';
  return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30';
};

const LoadingCard = () => (
  <div className="glass-panel overflow-hidden animate-pulse">
    <div className="aspect-video bg-white/10" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-white/10 rounded w-1/3" />
      <div className="h-6 bg-white/10 rounded w-5/6" />
      <div className="h-4 bg-white/10 rounded w-full" />
      <div className="h-4 bg-white/10 rounded w-2/3" />
    </div>
  </div>
);

const CourseCard = ({ course }) => {
  const difficultyClass = getDifficultyTone(course.difficulty);

  return (
    <Link to={`/courses/${course._id}/learn`} className="group block h-full">
      <article className="glass-panel overflow-hidden h-full flex flex-col transition-transform duration-300 group-hover:-translate-y-1">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-zinc-100">
            <Clock3 size={12} />
            {course.duration || '1h'}
          </div>

          <div className="absolute right-3 bottom-3 h-10 w-10 rounded-full bg-white/90 text-red-600 flex items-center justify-center shadow-lg">
            <Play size={18} className="ml-0.5" />
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="glass-chip text-[11px] px-2.5 py-1 border-white/20 bg-black/30">{course.category}</span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] ${difficultyClass}`}>
              <BarChart3 size={12} />
              {course.difficulty}
            </span>
          </div>

          <h3 className="text-zinc-100 font-semibold text-lg leading-tight mb-2 line-clamp-2 group-hover:text-red-300 transition-colors">
            {course.title}
          </h3>

          <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 flex-1">{course.description}</p>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-zinc-300">{course.instructor}</p>
            <span className="text-xs uppercase tracking-wide text-zinc-500">Start</span>
          </div>
        </div>
      </article>
    </Link>
  );
};

const Courses = () => {
  const location = useLocation();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('category') || 'All';
  });
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`${API_URL}/api/courses`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch courses');
        }

        setCourses(Array.isArray(data.courses) ? data.courses : []);
      } catch (err) {
        console.error('Courses fetch error:', err);
        setError(err.message || 'Could not load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(courses.map((course) => course.category).filter(Boolean)));
    return ['All', ...sortByPreferredCategory(unique)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let result = [...courses];

    if (selectedCategory !== 'All') {
      result = result.filter((course) => course.category === selectedCategory);
    }

    if (difficultyFilter !== 'All') {
      result = result.filter((course) => course.difficulty === difficultyFilter);
    }

    if (query) {
      result = result.filter((course) => {
        const searchable = [course.title, course.description, course.instructor, course.category]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchable.includes(query);
      });
    }

    if (sortBy === 'Title A-Z') {
      result.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
    } else if (sortBy === 'Shortest First') {
      result.sort((a, b) => parseDurationToMinutes(a.duration) - parseDurationToMinutes(b.duration));
    } else if (sortBy === 'Longest First') {
      result.sort((a, b) => parseDurationToMinutes(b.duration) - parseDurationToMinutes(a.duration));
    } else {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [courses, selectedCategory, difficultyFilter, searchQuery, sortBy]);

  const categorySummary = useMemo(() => {
    if (selectedCategory === 'All') {
      return 'Browse high-signal lessons across design, content, and productivity tracks.';
    }

    return `Focused learning path for ${selectedCategory}. Filter by level and start with the highest-fit lesson.`;
  }, [selectedCategory]);

  return (
    <div className="min-h-screen glass-page text-zinc-100">
      <MainNavbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-12 space-y-6">
        <section className="glass-panel p-6 md:p-8 relative overflow-hidden">
          <div className="absolute -top-12 -right-10 h-44 w-44 rounded-full bg-red-500/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-sky-500/20 blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-red-300">
                <Sparkles size={14} />
                Course Studio
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mt-2">{selectedCategory === 'All' ? 'Explore Courses' : `${selectedCategory} Courses`}</h1>
              <p className="text-zinc-300 mt-2 max-w-3xl">{categorySummary}</p>
            </div>

            <div className="glass-panel-strong px-4 py-3 min-w-[180px]">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Visible Lessons</p>
              <p className="text-2xl font-bold mt-1">{filteredCourses.length}</p>
            </div>
          </div>
        </section>

        <section className="glass-panel p-4 md:p-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,220px,220px] gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by title, instructor, or topic"
                className="glass-input pl-9"
              />
            </div>

            <label className="relative">
              <SlidersHorizontal size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value)}
                className="glass-input pl-9 appearance-none"
              >
                <option>All</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>

            <label className="relative">
              <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="glass-input pl-9 appearance-none"
              >
                <option>Newest</option>
                <option>Title A-Z</option>
                <option>Shortest First</option>
                <option>Longest First</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`glass-chip transition-colors ${
                    active
                      ? 'border-red-400/60 bg-red-500/20 text-red-100'
                      : 'border-white/15 bg-white/5 text-zinc-300 hover:border-red-300/45 hover:text-zinc-100'
                  }`}
                >
                  <BookOpen size={13} />
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        {error && (
          <section className="glass-panel p-4 border border-red-500/40 text-red-200 text-sm">
            {error}
          </section>
        )}

        {loading ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <LoadingCard key={index} />
            ))}
          </section>
        ) : filteredCourses.length === 0 ? (
          <section className="glass-panel p-10 text-center">
            <h2 className="text-xl font-semibold">No courses match this filter</h2>
            <p className="text-zinc-400 mt-2">Adjust category, level, or search query and try again.</p>
          </section>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {filteredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default Courses;
