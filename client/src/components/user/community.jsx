import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  Compass,
  Flame,
  Hash,
  MessageSquare,
  Pin,
  Plus,
  RefreshCcw,
  Search,
  SendHorizontal,
  Share2,
  Sparkles,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import MainNavbar from '../../navbar/mainNavbar';
import { getAvatarDisplayProps } from '../../utils/avatarUtils';
import { API_URL } from '../../config';

const POSTS_PAGE_SIZE = 10;

const CATEGORY_OPTIONS = [
  'General Discussion',
  'React',
  'JavaScript',
  'Python',
  'Career Growth',
  'Teaching',
  'Study Systems',
  'Projects',
];

const POST_PROMPTS = [
  'Share a workflow that helped you learn faster this week.',
  'Ask for feedback on a module, portfolio piece, or curriculum idea.',
  'Start a challenge thread for your next teaching or study sprint.',
];

const VIEW_OPTIONS = [
  { key: 'all', label: 'All discussions' },
  { key: 'mine', label: 'My posts' },
  { key: 'hot', label: 'Trending now' },
  { key: 'unanswered', label: 'Needs replies' },
];

const SORT_OPTIONS = [
  { key: 'recent', label: 'Newest first' },
  { key: 'popular', label: 'Most active' },
  { key: 'liked', label: 'Most liked' },
];

function getCurrentUserId(post) {
  return String(post?.userInfo?.id || post?.userId?._id || post?.userId || '');
}

function postScore(post) {
  const likes = post?.stats?.likes || 0;
  const comments = post?.stats?.comments || 0;
  const views = post?.stats?.views || 0;
  return likes * 3 + comments * 4 + views;
}

function getCategoryTone(category) {
  const tones = {
    React: 'bg-cyan-500/12 text-cyan-200 border-cyan-400/25',
    JavaScript: 'bg-amber-500/12 text-amber-100 border-amber-300/30',
    Python: 'bg-emerald-500/12 text-emerald-100 border-emerald-300/30',
    Projects: 'bg-fuchsia-500/12 text-fuchsia-100 border-fuchsia-300/30',
    Teaching: 'bg-red-500/12 text-red-100 border-red-300/30',
    'Career Growth': 'bg-violet-500/12 text-violet-100 border-violet-300/30',
    'Study Systems': 'bg-blue-500/12 text-blue-100 border-blue-300/30',
  };

  return tones[category] || 'bg-white/8 text-zinc-200 border-white/10';
}

function AvatarBadge({ user, size = 44, className = '' }) {
  const avatar = getAvatarDisplayProps(user, size);

  return (
    <div
      className={`overflow-hidden rounded-full border border-white/10 bg-white/5 ${className}`}
      style={{ height: size, width: size }}
    >
      {avatar.hasCustom && avatar.avatarUrl ? (
        <img
          src={avatar.avatarUrl}
          alt={avatar.userName}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-sm font-semibold text-white"
          style={{ backgroundColor: avatar.initialsColor }}
        >
          {avatar.initials}
        </div>
      )}
    </div>
  );
}

function SidebarPanel({ icon, title, children }) {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-zinc-100">
          {createElement(icon, { size: 18 })}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function CommunityPostCard({
  currentUserId,
  onAddComment,
  onDelete,
  onShare,
  onToggleLike,
  post,
}) {
  const [commentText, setCommentText] = useState('');
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const isOwner = getCurrentUserId(post) === String(currentUserId);
  const isLiked = Array.isArray(post?.likedBy) && post.likedBy.includes(currentUserId);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    const saved = await onAddComment(post._id, commentText.trim());
    setSubmittingComment(false);
    if (saved) {
      setCommentText('');
      setIsCommentOpen(true);
    }
  };

  return (
    <article className="interactive-tile reveal-up rounded-[28px] border border-white/10 bg-black/35 p-5 shadow-[0_24px_60px_rgba(2,6,23,0.28)] backdrop-blur md:p-6">
      <div className="flex gap-4">
        <AvatarBadge
          user={{
            name: post.author,
            avatar: post.userInfo?.avatar || post.avatar,
            avatarUrl: post.userInfo?.avatarUrl,
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                <span className="font-semibold text-white">{post.author}</span>
                <span>{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</span>
                {(post.isHot || postScore(post) > 12) && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-100">
                    <Flame size={12} />
                    Hot
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                  {post.authorRole || 'Community member'}
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getCategoryTone(post.category)}`}>
                  {post.category || 'General Discussion'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              <button
                type="button"
                onClick={() => onShare(post)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white"
                aria-label="Share discussion"
              >
                <Share2 size={16} />
              </button>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => onDelete(post._id)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-white"
                  aria-label="Delete discussion"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          <Link to={`/post/${post._id}`} className="mt-4 block">
            <h2 className="text-2xl font-black tracking-tight text-white transition-colors hover:text-red-200">
              {post.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">{post.excerpt}</p>
          </Link>

          <div className="mt-4 flex flex-wrap gap-2">
            {(post.tags || []).map((tag) => (
              <span
                key={`${post._id}-${tag}`}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-300"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <button
              type="button"
              onClick={() => onToggleLike(post._id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 transition-colors ${
                isLiked
                  ? 'border-red-400/40 bg-red-500/10 text-red-100'
                  : 'border-white/10 bg-white/[0.04] hover:border-red-400/35 hover:text-white'
              }`}
            >
              <ThumbsUp size={15} />
              {post?.stats?.likes || 0}
            </button>
            <button
              type="button"
              onClick={() => setIsCommentOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 transition-colors hover:border-blue-400/35 hover:text-white"
            >
              <MessageSquare size={15} />
              {post?.stats?.comments || 0}
            </button>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              {post?.stats?.views || 0} views
            </span>
          </div>

          {isCommentOpen && (
            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSubmitComment();
                    }
                  }}
                  placeholder="Add a useful reply, resource, or follow-up question"
                  className="glass-input flex-1"
                />
                <button
                  type="button"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="glass-cta disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SendHorizontal size={16} />
                  Reply
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {(post.comments || []).slice(-3).map((comment, index) => (
                  <div
                    key={`${post._id}-comment-${index}`}
                    className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-white">{comment.author}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-300">{comment.text}</p>
                  </div>
                ))}
                {!post.comments?.length && (
                  <p className="text-sm text-zinc-400">
                    No replies yet. Start the conversation with a concrete next step or resource.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function NewPostModal({ onClose, onCreate, submitting }) {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [tags, setTags] = useState('');

  const canSubmit = title.trim() && excerpt.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10 backdrop-blur-md">
      <div className="surface-card w-full max-w-2xl p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">
              <Sparkles size={14} className="text-red-300" />
              Start a sharper discussion
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
              Publish a post worth replying to
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-zinc-300 transition-colors hover:text-white"
            aria-label="Close composer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-200">Title</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="glass-input"
              placeholder="What should the community help you solve or improve?"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-200">Summary</span>
            <textarea
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              rows={5}
              className="glass-input min-h-[150px]"
              placeholder="Add context, what you tried, what outcome you want, and any constraints."
            />
          </label>

          <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-200">Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="glass-input"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-200">Tags</span>
              <input
                type="text"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                className="glass-input"
                placeholder="react, modules, study-group"
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-200">Prompt starters</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {POST_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setExcerpt(prompt)}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-left text-xs font-medium text-zinc-300 transition-colors hover:border-red-300/30 hover:bg-red-500/10 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/8 pt-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-zinc-400">
              Strong posts get faster replies when they include context, examples, and a clear ask.
            </p>
            <button
              type="button"
              onClick={() =>
                onCreate({
                  title: title.trim(),
                  excerpt: excerpt.trim(),
                  category,
                  tags: tags
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
              disabled={!canSubmit || submitting}
              className="glass-cta disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={16} />
              Publish discussion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const currentUserId = localStorage.getItem('userId') || '';
  const currentUserName = localStorage.getItem('username') || 'Community member';
  const currentUserRole = localStorage.getItem('role') || 'Learner';

  const [allPosts, setAllPosts] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingContributors, setLoadingContributors] = useState(true);
  const [error, setError] = useState('');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('recent');
  const [activeView, setActiveView] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  const fetchPosts = useCallback(async (nextPage = 1, append = false) => {
    const query = new URLSearchParams({
      page: String(nextPage),
      limit: String(POSTS_PAGE_SIZE),
    });

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingPosts(true);
      }

      const response = await fetch(`${API_URL}/api/posts?${query.toString()}`);
      if (!response.ok) {
        throw new Error('Unable to load discussions.');
      }

      const data = await response.json();
      const posts = Array.isArray(data.posts) ? data.posts : [];

      setAllPosts((current) => (append ? [...current, ...posts] : posts));
      setPage(nextPage);
      setHasMorePosts(nextPage * POSTS_PAGE_SIZE < Number(data.total || 0));
      setError('');
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || 'Unable to load discussions.');
    } finally {
      setLoadingPosts(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchTopContributors = useCallback(async () => {
    try {
      setLoadingContributors(true);
      const response = await fetch(`${API_URL}/api/posts/top-contributors?limit=5`);
      if (!response.ok) {
        throw new Error('Unable to load contributors.');
      }

      const data = await response.json();
      setTopContributors(Array.isArray(data.contributors) ? data.contributors : []);
    } catch (fetchError) {
      console.error(fetchError);
    } finally {
      setLoadingContributors(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1, false);
    fetchTopContributors();
  }, [fetchPosts, fetchTopContributors]);

  const categories = useMemo(() => {
    const counts = new Map();
    allPosts.forEach((post) => {
      const category = post.category || 'General Discussion';
      counts.set(category, (counts.get(category) || 0) + 1);
    });

    return [
      { name: 'All', count: allPosts.length },
      ...CATEGORY_OPTIONS.map((category) => ({
        name: category,
        count: counts.get(category) || 0,
      })),
    ];
  }, [allPosts]);

  const trendingTags = useMemo(() => {
    const counts = new Map();
    allPosts.forEach((post) => {
      (post.tags || []).forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6);
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const posts = allPosts.filter((post) => {
      const matchesCategory =
        selectedCategory === 'All' || (post.category || 'General Discussion') === selectedCategory;
      const matchesView =
        activeView === 'all' ||
        (activeView === 'mine' && getCurrentUserId(post) === String(currentUserId)) ||
        (activeView === 'hot' && (post.isHot || postScore(post) > 12)) ||
        (activeView === 'unanswered' && (post?.stats?.comments || 0) === 0);

      if (!matchesCategory || !matchesView) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        post.title,
        post.excerpt,
        post.author,
        post.category,
        ...(post.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });

    const sorted = [...posts];
    if (sortBy === 'popular') {
      sorted.sort((left, right) => postScore(right) - postScore(left));
    } else if (sortBy === 'liked') {
      sorted.sort((left, right) => (right?.stats?.likes || 0) - (left?.stats?.likes || 0));
    } else {
      sorted.sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
    }

    return sorted;
  }, [activeView, allPosts, currentUserId, searchQuery, selectedCategory, sortBy]);

  const metrics = useMemo(
    () => ({
      total: allPosts.length,
      trending: allPosts.filter((post) => post.isHot || postScore(post) > 12).length,
      unanswered: allPosts.filter((post) => (post?.stats?.comments || 0) === 0).length,
      contributors: topContributors.length,
    }),
    [allPosts, topContributors],
  );

  const featuredPost = useMemo(() => {
    if (!filteredPosts.length) return null;
    return [...filteredPosts].sort((left, right) => postScore(right) - postScore(left))[0];
  }, [filteredPosts]);

  const upsertPost = useCallback((updatedPost) => {
    setAllPosts((current) =>
      current.map((post) => (post._id === updatedPost._id ? updatedPost : post)),
    );
  }, []);

  const handleCreatePost = useCallback(
    async ({ category, excerpt, tags, title }) => {
      if (!currentUserId) {
        setError('Sign in to publish a discussion.');
        return;
      }

      try {
        setIsSubmitting(true);
        const response = await fetch(`${API_URL}/api/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: currentUserName,
            authorRole: currentUserRole,
            category,
            excerpt,
            tags,
            title,
            userId: currentUserId,
          }),
        });

        if (!response.ok) {
          throw new Error('Unable to publish discussion.');
        }

        const newPost = await response.json();
        setAllPosts((current) => [newPost, ...current]);
        setIsComposerOpen(false);
        fetchTopContributors();
      } catch (submitError) {
        console.error(submitError);
        setError(submitError.message || 'Unable to publish discussion.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUserId, currentUserName, currentUserRole, fetchTopContributors],
  );

  const handleDeletePost = useCallback(
    async (postId) => {
      try {
        const response = await fetch(`${API_URL}/api/posts/${postId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'user-id': currentUserId,
          },
        });

        if (!response.ok) {
          throw new Error('Unable to delete discussion.');
        }

        setAllPosts((current) => current.filter((post) => post._id !== postId));
        fetchTopContributors();
      } catch (deleteError) {
        console.error(deleteError);
        setError(deleteError.message || 'Unable to delete discussion.');
      }
    },
    [currentUserId, fetchTopContributors],
  );

  const handleToggleLike = useCallback(
    async (postId) => {
      if (!currentUserId) {
        setError('Sign in to react to discussions.');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId }),
        });

        if (!response.ok) {
          throw new Error('Unable to update reaction.');
        }

        const updatedPost = await response.json();
        upsertPost(updatedPost);
      } catch (likeError) {
        console.error(likeError);
        setError(likeError.message || 'Unable to update reaction.');
      }
    },
    [currentUserId, upsertPost],
  );

  const handleAddComment = useCallback(
    async (postId, commentText) => {
      if (!currentUserId) {
        setError('Sign in to reply.');
        return false;
      }

      try {
        const response = await fetch(`${API_URL}/api/posts/${postId}/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            author: currentUserName,
            text: commentText,
          }),
        });

        if (!response.ok) {
          throw new Error('Unable to add reply.');
        }

        const updatedPost = await response.json();
        upsertPost(updatedPost);
        return true;
      } catch (commentError) {
        console.error(commentError);
        setError(commentError.message || 'Unable to add reply.');
        return false;
      }
    },
    [currentUserId, currentUserName, upsertPost],
  );

  const handleSharePost = useCallback(async (post) => {
    const shareUrl = `${window.location.origin}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (shareError) {
      console.error(shareError);
    }
  }, []);

  return (
    <div className="glass-page min-h-screen text-zinc-100">
      <MainNavbar />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6">
        <section className="surface-card surface-card-shimmer relative overflow-hidden p-7 md:p-8">
          <div className="ambient-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="pointer-events-none absolute left-[-4%] top-10 h-52 w-52 rounded-full bg-red-500/15 blur-[120px]" />
          <div className="pointer-events-none absolute right-[-5%] top-4 h-60 w-60 rounded-full bg-blue-500/12 blur-[130px]" />

          <div className="relative grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="reveal-up">
              <div className="eyebrow">
                <Compass size={14} className="text-red-300" />
                Community operating layer
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
                Turn scattered questions into visible momentum across the community.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
                The community feed now acts like a real collaboration surface: trending threads,
                category browsing, fast replies, and sharper prompts that make discussions useful
                instead of noisy.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setIsComposerOpen(true)} className="glass-cta">
                  <Plus size={18} />
                  Start a discussion
                </button>
                <button
                  type="button"
                  onClick={() => fetchPosts(1, false)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-blue-400/45 hover:bg-blue-500/12"
                >
                  <RefreshCcw size={16} />
                  Refresh feed
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 reveal-up">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Discussions loaded
                </p>
                <p className="mt-3 text-3xl font-black text-white">{metrics.total}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Available in the live feed for browsing and search.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Trending threads
                </p>
                <p className="mt-3 text-3xl font-black text-white">{metrics.trending}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Posts with enough activity to deserve more visibility.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Open questions
                </p>
                <p className="mt-3 text-3xl font-black text-white">{metrics.unanswered}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Easy starting point for anyone looking to contribute.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Active contributors
                </p>
                <p className="mt-3 text-3xl font-black text-white">{metrics.contributors}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Pulled from the most active community voices.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.32fr_0.68fr]">
          <div className="space-y-6">
            <SidebarPanel icon={Hash} title="Browse by category">
              {categories.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition-colors ${
                    selectedCategory === category.name
                      ? 'border-red-400/35 bg-red-500/10 text-white'
                      : 'border-white/8 bg-white/[0.03] text-zinc-300 hover:border-white/15 hover:text-white'
                  }`}
                >
                  <span className="font-medium">{category.name}</span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                    {category.count}
                  </span>
                </button>
              ))}
            </SidebarPanel>

            <SidebarPanel icon={TrendingUp} title="Trending tags">
              <div className="flex flex-wrap gap-2">
                {trendingTags.length ? (
                  trendingTags.map(([tag, count]) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-blue-400/35 hover:text-white"
                    >
                      #{tag} <span className="text-zinc-500">({count})</span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-zinc-400">
                    Tags will appear here as new discussions are published.
                  </p>
                )}
              </div>
            </SidebarPanel>

            <SidebarPanel icon={Users} title="Top contributors">
              {loadingContributors ? (
                <p className="text-sm text-zinc-400">Loading contributors...</p>
              ) : topContributors.length ? (
                topContributors.map((contributor) => (
                  <div
                    key={String(contributor.userId)}
                    className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarBadge
                        user={{
                          name: contributor.name,
                          avatarUrl: contributor.avatarUrl,
                          avatar: contributor.avatar,
                        }}
                        size={40}
                      />
                      <div>
                        <p className="text-sm font-semibold text-white">{contributor.name}</p>
                        <p className="text-xs text-zinc-400">
                          {contributor.totalPosts} discussions started
                        </p>
                      </div>
                    </div>
                    <Pin size={16} className="text-zinc-500" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-400">No contributor data available yet.</p>
              )}
            </SidebarPanel>
          </div>

          <div className="space-y-6">
            <div className="glass-panel p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="glass-input pl-9"
                    placeholder="Search by topic, title, author, or tag"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:w-[340px]">
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="glass-input"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsComposerOpen(true)} className="glass-cta">
                    <Plus size={16} />
                    New post
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {VIEW_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setActiveView(option.key)}
                    className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                      activeView === option.key
                        ? 'border-red-400/35 bg-red-500/10 text-white'
                        : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-[24px] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            {featuredPost && (
              <div className="surface-card card-spotlight overflow-hidden p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  <Sparkles size={14} className="text-red-300" />
                  Featured discussion
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-white">
                      {featuredPost.title}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
                      {featuredPost.excerpt}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(featuredPost.tags || []).slice(0, 4).map((tag) => (
                        <span
                          key={`${featuredPost._id}-featured-${tag}`}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    to={`/post/${featuredPost._id}`}
                    className="glass-cta justify-self-start lg:justify-self-end"
                  >
                    Open thread
                  </Link>
                </div>
              </div>
            )}

            {loadingPosts ? (
              <div className="glass-panel p-6 text-sm text-zinc-400">Loading discussions...</div>
            ) : filteredPosts.length ? (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <CommunityPostCard
                    key={post._id}
                    currentUserId={currentUserId}
                    onAddComment={handleAddComment}
                    onDelete={handleDeletePost}
                    onShare={handleSharePost}
                    onToggleLike={handleToggleLike}
                    post={post}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-panel p-8 text-center">
                <p className="text-lg font-semibold text-white">No discussions match this view.</p>
                <p className="mt-2 text-sm text-zinc-400">
                  Try another category, clear the search, or start a new thread.
                </p>
              </div>
            )}

            {hasMorePosts && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => fetchPosts(page + 1, true)}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-blue-400/35 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw size={16} className={loadingMore ? 'animate-spin' : ''} />
                  {loadingMore ? 'Loading more' : 'Load more discussions'}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {isComposerOpen && (
        <NewPostModal
          onClose={() => setIsComposerOpen(false)}
          onCreate={handleCreatePost}
          submitting={isSubmitting}
        />
      )}
    </div>
  );
}
