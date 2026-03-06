import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Sparkles,
  RefreshCcw,
  Clock3,
  Star,
  Plus,
  X,
  ChevronDown,
  Check,
  SlidersHorizontal,
  CircleDollarSign,
  BookOpen,
  ArrowRight,
  Bookmark,
  TrendingUp,
  BadgeCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import MainNavbar from '../../navbar/mainNavbar.jsx';
import { API_URL } from '../../config';
import { getAvatarDisplayProps } from '../../utils/avatarUtils';

const SUB_CATEGORIES = {
  Programming: ['Web Development', 'Mobile Dev', 'Data Science', 'Game Dev', 'DevOps'],
  Design: ['UI/UX', 'Graphic Design', 'Motion Graphics', 'Logo Design'],
  Music: ['Guitar', 'Piano', 'Violin', 'Drums', 'Singing', 'Music Theory'],
  Drawing: ['Sketching', 'Watercolors', 'Oil Painting', 'Digital Art'],
  'Art & Craft': ['Origami', 'Pottery', 'Knitting', 'Calligraphy'],
  Cybersecurity: ['Ethical Hacking', 'Network Security', 'SOC Analyst'],
  'Quality Assurance': ['Manual Testing', 'Automation', 'API Testing'],
  Academics: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
  Business: ['Finance', 'Entrepreneurship', 'Leadership', 'Sales'],
  Lifestyle: ['Yoga', 'Meditation', 'Nutrition'],
  Gaming: ['Valorant', 'League of Legends', 'Minecraft'],
  Writing: ['Creative Writing', 'Copywriting', 'Technical Writing'],
  Photography: ['Portrait', 'Landscape', 'Editing'],
  Marketing: ['SEO', 'Content', 'Social Media', 'Email Marketing'],
  Language: ['English', 'Spanish', 'French', 'German', 'Japanese'],
  Cooking: ['Baking', 'Meal Prep', 'Regional Cuisine']
};

const DURATION_OPTIONS = ['30 minutes', '1 hour', '1.5 hours', '2 hours', '2.5 hours', '3 hours'];
const SAVED_SKILLS_KEY = 'collablearn-saved-skills';
const SORT_OPTIONS = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'rating', label: 'Highest rated' },
  { key: 'price-low', label: 'Lowest price' },
  { key: 'price-high', label: 'Highest price' },
  { key: 'recent', label: 'Newest' }
];

const getLevelBadgeClass = (level) => {
  if (level === 'Advanced' || level === 'Expert') return 'bg-rose-500/20 text-rose-200 border-rose-400/30';
  if (level === 'Intermediate') return 'bg-amber-500/20 text-amber-200 border-amber-400/30';
  return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30';
};

const formatPriceLabel = (price) => {
  const amount = Number(price || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'Free';
  return `INR ${amount.toLocaleString('en-IN')}/hr`;
};

const getSkillScore = (skill) => {
  const rating = Number(skill.user?.rating?.average || skill.offering?.rating || 0);
  const sessions = Number(skill.offering?.sessions || 0);
  const price = Number(skill.offering?.price || 0);
  const priceBonus = price === 0 ? 2 : Math.max(0, 5 - price / 800);
  return rating * 4 + Math.log10(sessions + 1) * 3 + priceBonus;
};

const SkillSkeleton = () => (
  <div className="glass-panel p-5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-white/10" />
      <div className="flex-1">
        <div className="h-4 w-28 bg-white/10 rounded mb-2" />
        <div className="h-3 w-20 bg-white/10 rounded" />
      </div>
    </div>
    <div className="h-6 w-2/3 bg-white/10 rounded mb-3" />
    <div className="h-4 w-full bg-white/10 rounded mb-2" />
    <div className="h-4 w-4/5 bg-white/10 rounded mb-4" />
    <div className="h-10 w-full bg-white/10 rounded" />
  </div>
);

export default function SkillSwapBrowse() {
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [visibleSkills, setVisibleSkills] = useState(8);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [sortBy, setSortBy] = useState('recommended');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedSkills, setSavedSkills] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVED_SKILLS_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [showPostSkillModal, setShowPostSkillModal] = useState(false);
  const [postSkillForm, setPostSkillForm] = useState({
    title: '',
    description: '',
    skills: '',
    category: 'Other',
    subCategory: '',
    timePerHour: '1 hour',
    price: ''
  });
  const [availableSkills, setAvailableSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    localStorage.setItem(SAVED_SKILLS_KEY, JSON.stringify(savedSkills));
  }, [savedSkills]);

  const fetchPostedSkills = async (showLoader = true) => {
    try {
      setError('');
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await fetch(`${API_URL}/api/skills/search`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch skills');
      }

      setSkills(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('Fetch skills error:', err);
      setError(err.message || 'Could not load skills right now.');
    } finally {
      if (showLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchPostedSkills(true);

    const autoRefreshInterval = setInterval(() => {
      fetchPostedSkills(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(autoRefreshInterval);
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = { 'All Categories': skills.length };

    skills.forEach((skill) => {
      const category = skill.category || 'Other';
      counts[category] = (counts[category] || 0) + 1;
    });

    return counts;
  }, [skills]);

  const categories = useMemo(() => {
    const names = Object.keys(categoryCounts).filter((name) => name !== 'All Categories').sort();
    return ['All Categories', ...names];
  }, [categoryCounts]);

  const filteredSkills = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = skills.filter((skill) => {
      const categoryMatch =
        selectedCategory === 'All Categories' || (skill.category || 'Other') === selectedCategory;
      if (!categoryMatch) return false;

      const level = skill.offering?.level || 'Beginner';
      const levelMatch = selectedLevel === 'All Levels' || level === selectedLevel;
      if (!levelMatch) return false;

      if (showSavedOnly && !savedSkills.includes(skill._id)) {
        return false;
      }

      if (!query) return true;

      const searchableText = [
        skill.name,
        skill.offering?.description,
        skill.user?.name,
        skill.category,
        skill.subCategory,
        ...(Array.isArray(skill.tags) ? skill.tags : [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });

    const sorted = [...filtered];

    if (sortBy === 'rating') {
      sorted.sort(
        (left, right) =>
          Number(right.user?.rating?.average || right.offering?.rating || 0) -
          Number(left.user?.rating?.average || left.offering?.rating || 0),
      );
    } else if (sortBy === 'price-low') {
      sorted.sort((left, right) => Number(left.offering?.price || 0) - Number(right.offering?.price || 0));
    } else if (sortBy === 'price-high') {
      sorted.sort((left, right) => Number(right.offering?.price || 0) - Number(left.offering?.price || 0));
    } else if (sortBy === 'recent') {
      sorted.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    } else {
      sorted.sort((left, right) => getSkillScore(right) - getSkillScore(left));
    }

    return sorted;
  }, [savedSkills, searchQuery, selectedCategory, selectedLevel, showSavedOnly, skills, sortBy]);

  const displayedSkills = useMemo(() => filteredSkills.slice(0, visibleSkills), [filteredSkills, visibleSkills]);

  const featuredSkill = useMemo(() => filteredSkills[0] || skills[0] || null, [filteredSkills, skills]);

  const marketplaceSignals = useMemo(() => {
    const topRatedCount = skills.filter(
      (skill) => Number(skill.user?.rating?.average || skill.offering?.rating || 0) >= 4,
    ).length;

    return {
      saved: savedSkills.length,
      topRatedCount,
      avgPrice:
        skills.length === 0
          ? 0
          : Math.round(
              skills.reduce((sum, item) => sum + Number(item.offering?.price || 0), 0) / skills.length,
            ),
    };
  }, [savedSkills.length, skills]);

  useEffect(() => {
    setVisibleSkills(8);
  }, [searchQuery, selectedCategory, selectedLevel, showSavedOnly, sortBy]);

  const fetchAvailableSkills = async () => {
    try {
      setSkillsLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setAvailableSkills([]);
        return;
      }

      const response = await fetch(`${API_URL}/api/skills/my-skills`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch your skills');
      }

      const skillsOffering = Array.isArray(data.data?.skillsOffering) ? data.data.skillsOffering : [];
      const postable = skillsOffering.filter((item) => !item.isPosted).map((item) => item.name).filter(Boolean);
      setAvailableSkills(Array.from(new Set(postable)).sort());
    } catch (err) {
      console.error('Fetch available skills error:', err);
      setAvailableSkills([]);
    } finally {
      setSkillsLoading(false);
    }
  };

  useEffect(() => {
    if (showPostSkillModal) {
      fetchAvailableSkills();
    }
  }, [showPostSkillModal]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setPostSkillForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'category') {
        next.subCategory = '';
      }
      return next;
    });
  };

  const handleSkillSelect = (skillName) => {
    setPostSkillForm((prev) => ({ ...prev, skills: skillName }));
    setShowSkillsDropdown(false);
  };

  const handlePostSkillSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to post a skill.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/skills/post`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: postSkillForm.title.trim(),
          description: postSkillForm.description.trim(),
          skills: postSkillForm.skills,
          category: postSkillForm.category,
          subCategory: postSkillForm.subCategory.trim(),
          timePerHour: postSkillForm.timePerHour,
          price: postSkillForm.price
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to post skill');
      }

      setSuccessMessage('Skill posted successfully.');
      setTimeout(() => setSuccessMessage(''), 3500);

      setPostSkillForm({
        title: '',
        description: '',
        skills: '',
        category: 'Other',
        subCategory: '',
        timePerHour: '1 hour',
        price: ''
      });
      setShowSkillsDropdown(false);
      setShowPostSkillModal(false);
      fetchPostedSkills(false);
    } catch (err) {
      console.error('Post skill error:', err);
      setError(err.message || 'Could not post skill.');
    }
  };

  const clearModal = () => {
    setShowPostSkillModal(false);
    setShowSkillsDropdown(false);
  };

  const toggleSavedSkill = (skillId) => {
    setSavedSkills((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId],
    );
  };

  return (
    <div className="min-h-screen glass-page text-zinc-100">
      <MainNavbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-12 space-y-6">
        <section className="surface-card surface-card-shimmer p-6 md:p-8 relative overflow-hidden">
          <div className="absolute -top-14 left-8 h-36 w-36 rounded-full bg-red-500/20 blur-3xl" />
          <div className="absolute -bottom-20 right-6 h-44 w-44 rounded-full bg-sky-500/18 blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-red-300 font-semibold">
                <Sparkles size={14} />
                Skill Marketplace
              </p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-3">
                Discover mentors and skill offers that feel ready to book, not random listings.
              </h1>
              <p className="text-zinc-300 mt-3 max-w-3xl leading-7">
                The marketplace now surfaces stronger signals: who is rated well, which offers are worth saving,
                and which sessions fit your level, budget, and timing.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link to="/skill-recommendations" className="glass-chip border-sky-400/40 bg-sky-500/15 text-sky-100">
                <BookOpen size={14} />
                Recommendations
              </Link>
              <button
                type="button"
                onClick={() => setShowPostSkillModal(true)}
                className="glass-cta px-4 py-2.5"
              >
                <Plus size={16} />
                Post Skill
              </button>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="glass-panel-strong p-3">
              <p className="text-xs uppercase text-zinc-400">Total Listings</p>
              <p className="text-xl font-bold mt-1">{skills.length}</p>
            </div>
            <div className="glass-panel-strong p-3">
              <p className="text-xs uppercase text-zinc-400">Visible</p>
              <p className="text-xl font-bold mt-1">{filteredSkills.length}</p>
            </div>
            <div className="glass-panel-strong p-3">
              <p className="text-xs uppercase text-zinc-400">Saved</p>
              <p className="text-xl font-bold mt-1">{marketplaceSignals.saved}</p>
            </div>
            <div className="glass-panel-strong p-3">
              <p className="text-xs uppercase text-zinc-400">Top Rated</p>
              <p className="text-xl font-bold mt-1">{marketplaceSignals.topRatedCount}</p>
            </div>
            <div className="glass-panel-strong p-3">
              <p className="text-xs uppercase text-zinc-400">Avg Price</p>
              <p className="text-xl font-bold mt-1">INR {marketplaceSignals.avgPrice.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </section>

        <section className="glass-panel p-4 md:p-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,220px,220px,auto] gap-3 items-center">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search skill, instructor, tags"
                className="glass-input pl-9"
              />
            </div>

            <label className="relative">
              <SlidersHorizontal size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select
                value={selectedLevel}
                onChange={(event) => setSelectedLevel(event.target.value)}
                className="glass-input pl-9 appearance-none"
              >
                <option>All Levels</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Expert</option>
              </select>
            </label>

            <label className="relative">
              <TrendingUp size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="glass-input pl-9 appearance-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => fetchPostedSkills(false)}
              className="glass-chip border-white/20 bg-white/8 hover:border-red-300/55"
              disabled={refreshing}
              title="Refresh skills"
            >
              <RefreshCcw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSavedOnly((prev) => !prev)}
              className={`glass-chip transition-colors ${
                showSavedOnly
                  ? 'border-amber-300/45 bg-amber-500/15 text-amber-50'
                  : 'border-white/15 bg-white/5 text-zinc-300 hover:border-amber-300/35 hover:text-zinc-100'
              }`}
            >
              <Bookmark size={14} />
              Saved only
            </button>
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
                  {category}
                  <span className="text-[10px] text-zinc-400">{categoryCounts[category] || 0}</span>
                </button>
              );
            })}
          </div>
        </section>

        {featuredSkill && !loading && (
          <section className="surface-card card-spotlight overflow-hidden p-6 md:p-7">
            <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr] xl:items-end">
              <div>
                <div className="eyebrow">
                  <BadgeCheck size={14} className="text-red-300" />
                  Featured listing
                </div>
                <h2 className="mt-5 text-3xl md:text-4xl font-black tracking-tight text-white">
                  {featuredSkill.name}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
                  {featuredSkill.offering?.description || 'A focused skill listing ready for booking.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="glass-chip border-white/15 bg-white/5 text-zinc-200">
                    {featuredSkill.category || 'Other'}
                  </span>
                  {featuredSkill.subCategory && (
                    <span className="glass-chip border-red-400/40 bg-red-500/15 text-red-100">
                      {featuredSkill.subCategory}
                    </span>
                  )}
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${getLevelBadgeClass(featuredSkill.offering?.level)}`}>
                    {featuredSkill.offering?.level || 'Beginner'}
                  </span>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                <div className="space-y-3 text-sm text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span>Instructor</span>
                    <span className="font-semibold text-white">{featuredSkill.user?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rating</span>
                    <span className="font-semibold text-white">
                      {(featuredSkill.user?.rating?.average || featuredSkill.offering?.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Duration</span>
                    <span className="font-semibold text-white">{featuredSkill.offering?.duration || 'Flexible'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Price</span>
                    <span className="font-semibold text-white">{formatPriceLabel(featuredSkill.offering?.price)}</span>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    to={`/book-session?skillId=${featuredSkill._id}&instructorId=${featuredSkill.user?._id || featuredSkill.user?.id}&skillTitle=${encodeURIComponent(featuredSkill.name)}&instructorName=${encodeURIComponent(featuredSkill.user?.name || 'Unknown Instructor')}&price=${encodeURIComponent(featuredSkill.offering?.price || 0)}&duration=${encodeURIComponent(featuredSkill.offering?.duration || '')}&category=${encodeURIComponent(featuredSkill.category || '')}&level=${encodeURIComponent(featuredSkill.offering?.level || '')}`}
                    className="glass-cta justify-center"
                  >
                    Book featured session
                    <ArrowRight size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleSavedSkill(featuredSkill._id)}
                    className="glass-chip border-white/20 bg-white/8 hover:border-amber-300/45"
                  >
                    <Bookmark size={14} />
                    {savedSkills.includes(featuredSkill._id) ? 'Saved' : 'Save listing'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {successMessage && (
          <section className="glass-panel p-3 border border-emerald-500/40 text-emerald-200 text-sm">
            {successMessage}
          </section>
        )}

        {error && (
          <section className="glass-panel p-3 border border-red-500/40 text-red-200 text-sm">
            {error}
          </section>
        )}

        {loading ? (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkillSkeleton key={index} />
            ))}
          </section>
        ) : filteredSkills.length === 0 ? (
          <section className="glass-panel p-10 text-center">
            <h2 className="text-xl font-semibold">No matching skills found</h2>
            <p className="text-zinc-400 mt-2">Try another category, level, or search term.</p>
          </section>
        ) : (
          <section className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {displayedSkills.map((skill) => {
                const ownerId = skill.user?._id || skill.user?.id;
                const isOwnSkill = currentUserId && ownerId && String(ownerId) === String(currentUserId);
                const avatar = getAvatarDisplayProps(skill.user, 44);
                const rating = Number(skill.user?.rating?.average || skill.offering?.rating || 0);
                const isSaved = savedSkills.includes(skill._id);

                return (
                  <article key={skill._id} className="glass-panel interactive-tile p-5 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {avatar.hasCustom ? (
                          <img
                            src={avatar.avatarUrl}
                            alt={avatar.userName}
                            className="w-11 h-11 rounded-full object-cover border border-white/25"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: avatar.initialsColor }}>
                            {avatar.initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-100 truncate">{skill.user?.name || 'Unknown Instructor'}</p>
                          <p className="text-xs text-zinc-400 flex items-center gap-1">
                            <Star size={12} className="text-amber-300" />
                            {rating.toFixed(1)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSavedSkill(skill._id)}
                        className={`glass-chip text-[10px] transition-colors ${
                          isSaved
                            ? 'border-amber-300/45 bg-amber-500/15 text-amber-50'
                            : 'border-white/20 bg-black/30 text-zinc-300 hover:border-amber-300/35'
                        }`}
                        title={isSaved ? 'Remove from saved' : 'Save listing'}
                      >
                        <Bookmark size={12} />
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                    </div>

                    <h3 className="text-xl font-semibold leading-tight text-zinc-100">{skill.name}</h3>
                    <p className="text-sm text-zinc-400 mt-2 line-clamp-3 flex-1">{skill.offering?.description || 'No description yet.'}</p>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {skill.subCategory && (
                        <span className="glass-chip text-[10px] border-red-400/40 bg-red-500/15 text-red-100">
                          {skill.subCategory}
                        </span>
                      )}
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${getLevelBadgeClass(skill.offering?.level)}`}>
                        {skill.offering?.level || 'Beginner'}
                      </span>
                      {(skill.tags || []).slice(0, 2).map((tag) => (
                        <span key={tag} className="glass-chip text-[10px] border-white/15 bg-white/5 text-zinc-300">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Match</p>
                        <p className="mt-2 text-lg font-bold text-white">{Math.min(98, Math.round(getSkillScore(skill) * 5))}%</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Sessions</p>
                        <p className="mt-2 text-lg font-bold text-white">{skill.offering?.sessions || 0}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                      <div className="space-y-1 text-xs text-zinc-400">
                        <p className="inline-flex items-center gap-1">
                          <Clock3 size={13} />
                          {skill.offering?.duration || 'Flexible'}
                        </p>
                        <p className="inline-flex items-center gap-1">
                          <CircleDollarSign size={13} />
                          {formatPriceLabel(skill.offering?.price)}
                        </p>
                      </div>

                      {isOwnSkill ? (
                        <button
                          type="button"
                          disabled
                          className="px-3 py-2 rounded-lg border border-zinc-600 text-zinc-400 text-sm cursor-not-allowed"
                        >
                          Your Skill
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Link
                            to="/skill-sessions"
                            state={{ skill }}
                            className="glass-chip border-white/20 bg-white/8 hover:border-red-300/45"
                            title="View details"
                          >
                            <BookOpen size={14} />
                          </Link>
                          <Link
                            to={`/book-session?skillId=${skill._id}&instructorId=${ownerId}&skillTitle=${encodeURIComponent(skill.name)}&instructorName=${encodeURIComponent(skill.user?.name || 'Unknown Instructor')}&price=${encodeURIComponent(skill.offering?.price || 0)}&duration=${encodeURIComponent(skill.offering?.duration || '')}&category=${encodeURIComponent(skill.category || '')}&level=${encodeURIComponent(skill.offering?.level || '')}`}
                            className="glass-cta px-4 py-2 text-sm"
                          >
                            Book Session
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {visibleSkills < filteredSkills.length && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setVisibleSkills((prev) => prev + 6)}
                  className="glass-chip border-white/25 bg-white/8 hover:border-red-300/55"
                >
                  Load More Skills
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {showPostSkillModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="glass-panel w-full max-w-xl p-6 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Post a New Skill</h2>
              <button type="button" onClick={clearModal} className="glass-chip border-white/20 bg-white/8">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handlePostSkillSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-2">Title</label>
                <input
                  name="title"
                  value={postSkillForm.title}
                  onChange={handleInputChange}
                  className="glass-input"
                  placeholder="Example: Master JavaScript Fundamentals"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-300 mb-2">Description</label>
                <textarea
                  name="description"
                  value={postSkillForm.description}
                  onChange={handleInputChange}
                  className="glass-input min-h-[100px]"
                  placeholder="Describe what learners will gain in this session."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-300 mb-2">Category</label>
                  <select
                    name="category"
                    value={postSkillForm.category}
                    onChange={handleInputChange}
                    className="glass-input appearance-none"
                  >
                    <option value="Other">Other</option>
                    {Object.keys(SUB_CATEGORIES).sort().map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-2">Sub-category</label>
                  {SUB_CATEGORIES[postSkillForm.category] ? (
                    <select
                      name="subCategory"
                      value={postSkillForm.subCategory}
                      onChange={handleInputChange}
                      className="glass-input appearance-none"
                    >
                      <option value="">Select</option>
                      {SUB_CATEGORIES[postSkillForm.category].map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name="subCategory"
                      value={postSkillForm.subCategory}
                      onChange={handleInputChange}
                      className="glass-input"
                      placeholder="Optional"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-300 mb-2">Skill to include</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSkillsDropdown((prev) => !prev)}
                    className="glass-input flex items-center justify-between text-left"
                  >
                    <span className={postSkillForm.skills ? 'text-zinc-100' : 'text-zinc-400'}>
                      {postSkillForm.skills || 'Select from your available skills'}
                    </span>
                    <ChevronDown size={16} className={`${showSkillsDropdown ? 'rotate-180' : ''} transition-transform`} />
                  </button>

                  {showSkillsDropdown && (
                    <div className="absolute z-20 mt-1 w-full rounded-xl border border-white/20 bg-zinc-950/95 backdrop-blur max-h-56 overflow-y-auto">
                      {skillsLoading ? (
                        <p className="px-3 py-2 text-sm text-zinc-400">Loading skills...</p>
                      ) : availableSkills.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-zinc-400">No unposted offering skills found.</p>
                      ) : (
                        availableSkills.map((skillName) => {
                          const selected = postSkillForm.skills === skillName;
                          return (
                            <button
                              key={skillName}
                              type="button"
                              onClick={() => handleSkillSelect(skillName)}
                              className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${
                                selected ? 'bg-red-500/20 text-red-100' : 'text-zinc-200 hover:bg-white/8'
                              }`}
                            >
                              {skillName}
                              {selected && <Check size={14} />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-300 mb-2">Session duration</label>
                  <select
                    name="timePerHour"
                    value={postSkillForm.timePerHour}
                    onChange={handleInputChange}
                    className="glass-input appearance-none"
                    required
                  >
                    {DURATION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-2">Price (optional)</label>
                  <input
                    name="price"
                    value={postSkillForm.price}
                    onChange={handleInputChange}
                    className="glass-input"
                    placeholder="Example: 1200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={clearModal} className="glass-chip border-white/20 bg-white/8 px-4 py-2">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!postSkillForm.skills}
                  className="glass-cta px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
