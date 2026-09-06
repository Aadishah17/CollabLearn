import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Award,
  Flame,
  Zap,
  Star,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  BookOpen,
  Users,
  Target,
  Crown,
} from 'lucide-react';
import MainNavbar from '../../navbar/mainNavbar';

const BADGES = [
  {
    id: 'badge-1',
    title: 'Code Pioneer',
    category: 'Learning',
    rarity: 'Epic',
    rarityColor: 'from-purple-500 to-indigo-500 border-purple-400/40 text-purple-200',
    xp: 500,
    description: 'Generated your first structured AI learning roadmap and completed Milestone 1.',
    unlocked: true,
    unlockedAt: 'Sep 2, 2026',
    icon: Zap,
    progress: 100,
  },
  {
    id: 'badge-2',
    title: 'Streak Architect',
    category: 'Consistency',
    rarity: 'Rare',
    rarityColor: 'from-amber-500 to-orange-500 border-amber-400/40 text-amber-200',
    xp: 350,
    description: 'Maintained a consistent study sprint across 7 consecutive calendar days.',
    unlocked: true,
    unlockedAt: 'Sep 4, 2026',
    icon: Flame,
    progress: 100,
  },
  {
    id: 'badge-3',
    title: 'Collaborative Mentor',
    category: 'Teaching',
    rarity: 'Legendary',
    rarityColor: 'from-yellow-400 to-amber-500 border-yellow-300/40 text-yellow-100',
    xp: 1000,
    description: 'Conducted your first confirmed 1-on-1 skill mentorship session.',
    unlocked: true,
    unlockedAt: 'Sep 5, 2026',
    icon: Crown,
    progress: 100,
  },
  {
    id: 'badge-4',
    title: 'Knowledge Publisher',
    category: 'Modules',
    rarity: 'Epic',
    rarityColor: 'from-purple-500 to-indigo-500 border-purple-400/40 text-purple-200',
    xp: 600,
    description: 'Created and shared an interactive learning module with the community.',
    unlocked: true,
    unlockedAt: 'Sep 6, 2026',
    icon: BookOpen,
    progress: 100,
  },
  {
    id: 'badge-5',
    title: 'Community Catalyst',
    category: 'Community',
    rarity: 'Rare',
    rarityColor: 'from-blue-500 to-cyan-500 border-blue-400/40 text-blue-200',
    xp: 300,
    description: 'Started a discussion thread that reached trending status with 5+ peer replies.',
    unlocked: true,
    unlockedAt: 'Sep 6, 2026',
    icon: Users,
    progress: 100,
  },
  {
    id: 'badge-6',
    title: 'Deep Focus Sprint',
    category: 'Learning',
    rarity: 'Common',
    rarityColor: 'from-emerald-500 to-teal-500 border-emerald-400/40 text-emerald-200',
    xp: 150,
    description: 'Logged 10+ hours of focused roadmap study within a single calendar week.',
    unlocked: false,
    unlockedAt: null,
    icon: Target,
    progress: 65,
    requirement: '6.5 / 10 hours logged',
  },
  {
    id: 'badge-7',
    title: 'Polymath Velocity',
    category: 'Learning',
    rarity: 'Legendary',
    rarityColor: 'from-yellow-400 to-amber-500 border-yellow-300/40 text-yellow-100',
    xp: 1200,
    description: 'Achieve 80%+ progress across 3 distinct skill curriculum roadmaps.',
    unlocked: false,
    unlockedAt: null,
    icon: Award,
    progress: 34,
    requirement: '1 / 3 roadmaps mastered',
  },
  {
    id: 'badge-8',
    title: 'Master Evaluator',
    category: 'Teaching',
    rarity: 'Epic',
    rarityColor: 'from-purple-500 to-indigo-500 border-purple-400/40 text-purple-200',
    xp: 750,
    description: 'Receive 5 consecutive 5.0 rating reviews on mentorship sessions.',
    unlocked: false,
    unlockedAt: null,
    icon: Star,
    progress: 40,
    requirement: '2 / 5 five-star reviews',
  },
];

const CATEGORIES = ['All', 'Learning', 'Consistency', 'Teaching', 'Modules', 'Community'];

export default function Achievements() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'All') return BADGES;
    return BADGES.filter((b) => b.category === selectedCategory);
  }, [selectedCategory]);

  const stats = useMemo(() => {
    const unlocked = BADGES.filter((b) => b.unlocked);
    const totalXp = unlocked.reduce((acc, b) => acc + b.xp, 0);
    return {
      unlockedCount: unlocked.length,
      totalCount: BADGES.length,
      totalXp,
      level: 4,
      levelTitle: 'Knowledge Architect',
      nextLevelXp: 5000,
      streakDays: 7,
    };
  }, []);

  const progressPercent = Math.min(100, Math.round((stats.totalXp / stats.nextLevelXp) * 100));

  return (
    <div className="glass-page min-h-screen text-zinc-100 font-sans">
      <MainNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        {/* Header Hero Banner */}
        <section className="surface-card card-spotlight p-7 md:p-8 mb-8 relative overflow-hidden">
          <div className="ambient-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-red-500/15 blur-[90px]" />
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-56 w-56 rounded-full bg-amber-400/10 blur-[100px]" />

          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <div className="eyebrow mb-3">
                <Trophy size={14} className="text-amber-400" />
                Learner Milestones & Mastery
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Achievements & Skill Trophies
              </h1>
              <p className="mt-3 text-zinc-300 text-sm md:text-base leading-relaxed max-w-xl">
                Track your active study momentum, unlock verified accomplishment badges, and level
                up your standing across the global CollabLearn network.
              </p>

              <div className="mt-6 flex flex-wrap gap-4 items-center">
                <Link
                  to="/ai-learning"
                  className="glass-cta flex items-center gap-2 text-sm font-semibold"
                >
                  <span>Resume Roadmap</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/browse-skills"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-blue-400/45 hover:bg-blue-500/12"
                >
                  Explore Mentorship
                </Link>
              </div>
            </div>

            {/* Level & XP Card */}
            <div className="surface-card p-6 border border-white/15 bg-white/[0.03] backdrop-blur-xl rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-zinc-950 font-black text-lg shadow-lg shadow-amber-500/20">
                    L{stats.level}
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-widest text-amber-400 block">
                      Current Rank
                    </span>
                    <h3 className="text-lg font-bold text-white">{stats.levelTitle}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400 block">Total Experience</span>
                  <span className="text-xl font-black text-white font-mono">
                    {stats.totalXp.toLocaleString()} XP
                  </span>
                </div>
              </div>

              {/* Progress to Next Level */}
              <div className="space-y-1.5 mt-4">
                <div className="flex justify-between text-xs font-semibold text-zinc-300">
                  <span>Level {stats.level}</span>
                  <span className="text-zinc-400">
                    {stats.totalXp} / {stats.nextLevelXp} XP ({progressPercent}%)
                  </span>
                  <span>Level {stats.level + 1}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-yellow-400 transition-all duration-1000 shadow-md shadow-amber-500/20"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Quick Stat Pill Grid */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-white/10">
                <div className="flex items-center gap-2.5">
                  <Flame size={18} className="text-orange-400" />
                  <div>
                    <div className="text-xs text-zinc-400">Current Streak</div>
                    <div className="text-sm font-bold text-white">
                      {stats.streakDays} Days Active
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Award size={18} className="text-purple-400" />
                  <div>
                    <div className="text-xs text-zinc-400">Badges Unlocked</div>
                    <div className="text-sm font-bold text-white">
                      {stats.unlockedCount} of {stats.totalCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-950/40 scale-105'
                  : 'bg-white/[0.04] text-zinc-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`surface-card card-spotlight p-6 flex flex-col justify-between relative transition-all duration-300 hover:-translate-y-1 ${
                  badge.unlocked ? 'border-white/15' : 'opacity-70 border-white/5 bg-white/[0.01]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${
                        badge.unlocked
                          ? 'bg-gradient-to-tr ' + badge.rarityColor
                          : 'bg-white/5 border-white/10 text-zinc-500'
                      }`}
                    >
                      {badge.unlocked ? <Icon size={22} /> : <Lock size={20} />}
                    </div>

                    <div className="flex flex-col items-end">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          badge.unlocked
                            ? 'bg-white/10 border-white/20 text-zinc-200'
                            : 'bg-white/5 border-white/5 text-zinc-500'
                        }`}
                      >
                        {badge.rarity}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400 mt-1">
                        +{badge.xp} XP
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-1.5">
                    {badge.title}
                    {badge.unlocked && <CheckCircle2 size={14} className="text-emerald-400" />}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">{badge.description}</p>
                </div>

                <div className="pt-3 border-t border-white/10 text-xs">
                  {badge.unlocked ? (
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <Sparkles size={12} />
                      Unlocked on {badge.unlockedAt}
                    </span>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>Progress</span>
                        <span>{badge.requirement}</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-zinc-400 h-full rounded-full"
                          style={{ width: `${badge.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
