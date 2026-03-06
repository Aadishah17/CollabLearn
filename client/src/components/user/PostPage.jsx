import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Bookmark,
  Flame,
  MessageSquare,
  RefreshCcw,
  SendHorizontal,
  Share2,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import MainNavbar from '../../navbar/mainNavbar';
import { getAvatarDisplayProps } from '../../utils/avatarUtils';
import { API_URL } from '../../config';

const SAVED_POSTS_KEY = 'collablearn-saved-posts';

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

function AvatarBadge({ user, size = 48 }) {
  const avatar = getAvatarDisplayProps(user, size);

  return (
    <div
      className="overflow-hidden rounded-full border border-white/10 bg-white/5"
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

export default function PostPage() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [savedPosts, setSavedPosts] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVED_POSTS_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const currentUser = useMemo(() => {
    const username = localStorage.getItem('username') || 'Community member';
    const userId = localStorage.getItem('userId') || '';
    const userAvatar = localStorage.getItem('userAvatar') || '';

    return {
      id: userId,
      name: username,
      avatar: userAvatar,
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(savedPosts));
  }, [savedPosts]);

  const fetchPost = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const response = await fetch(`${API_URL}/api/posts/${postId}`);
        if (!response.ok) {
          throw new Error('Unable to load this discussion.');
        }

        const data = await response.json();
        setPost(data);
        setError('');
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError.message || 'Unable to load this discussion.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [postId],
  );

  useEffect(() => {
    if (postId) {
      fetchPost(true);
    }
  }, [fetchPost, postId]);

  const isSaved = Boolean(post?._id && savedPosts.includes(post._id));
  const isLiked = Boolean(
    currentUser.id && Array.isArray(post?.likedBy) && post.likedBy.includes(currentUser.id),
  );

  const author = useMemo(
    () => ({
      name: post?.author || 'Community member',
      avatar: post?.avatar || '',
      avatarUrl: post?.userInfo?.avatarUrl,
    }),
    [post],
  );

  const commentPrompts = useMemo(() => {
    const category = post?.category || 'discussion';
    return [
      `Share one practical tactic related to ${category.toLowerCase()}.`,
      'Offer a resource, example, or working pattern the author can try next.',
      'Reply with a clarifying question if you need more context before advising.',
    ];
  }, [post]);

  const discussionSignals = useMemo(() => {
    const likes = post?.stats?.likes || 0;
    const comments = post?.stats?.comments || 0;
    const views = post?.stats?.views || 0;

    return [
      { label: 'Replies', value: comments },
      { label: 'Reactions', value: likes },
      { label: 'Views', value: views },
    ];
  }, [post]);

  const handleLike = useCallback(async () => {
    if (!currentUser.id || !post?._id) {
      toast.error('Sign in to react to discussions.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      if (!response.ok) {
        throw new Error('Unable to update reaction.');
      }

      const updatedPost = await response.json();
      setPost(updatedPost);
    } catch (likeError) {
      console.error(likeError);
      toast.error(likeError.message || 'Unable to update reaction.');
    }
  }, [currentUser.id, post?._id]);

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim()) {
      return;
    }

    if (!currentUser.id || !post?._id) {
      toast.error('Sign in to reply.');
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await fetch(`${API_URL}/api/posts/${post._id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          author: currentUser.name,
          text: commentText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to publish reply.');
      }

      const updatedPost = await response.json();
      setPost(updatedPost);
      setCommentText('');
      toast.success('Reply added.');
    } catch (commentError) {
      console.error(commentError);
      toast.error(commentError.message || 'Unable to publish reply.');
    } finally {
      setSubmittingComment(false);
    }
  }, [commentText, currentUser.id, currentUser.name, post?._id]);

  const handleShare = useCallback(async () => {
    if (!post?._id) return;

    const shareUrl = `${window.location.origin}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Discussion link copied.');
    } catch (shareError) {
      console.error(shareError);
      toast.error('Unable to copy the link.');
    }
  }, [post?._id]);

  const handleToggleSave = useCallback(() => {
    if (!post?._id) return;

    setSavedPosts((current) => {
      if (current.includes(post._id)) {
        toast.success('Removed from saved discussions.');
        return current.filter((id) => id !== post._id);
      }

      toast.success('Saved for later.');
      return [...current, post._id];
    });
  }, [post?._id]);

  if (loading) {
    return (
      <div className="glass-page min-h-screen text-zinc-100">
        <MainNavbar />
        <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 pt-24">
          <div className="surface-card w-full p-8 text-center">
            <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-2 border-white/15 border-t-red-500" />
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-300/80">
              Discussion
            </p>
            <h1 className="mt-3 text-2xl font-bold text-white">Loading the thread</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Pulling the latest replies and engagement signals.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="glass-page min-h-screen text-zinc-100">
        <MainNavbar />
        <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 pt-24">
          <div className="surface-card w-full p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-300/80">
              Discussion
            </p>
            <h1 className="mt-3 text-2xl font-bold text-white">This thread is unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {error || 'The discussion could not be found.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/community" className="glass-cta">
                <ArrowLeft size={16} />
                Back to community
              </Link>
              <button
                type="button"
                onClick={() => fetchPost(true)}
                className="glass-chip border-white/20 bg-white/8 hover:border-red-300/45"
              >
                <RefreshCcw size={14} />
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="glass-page min-h-screen text-zinc-100">
      <MainNavbar />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/community"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:border-red-300/35 hover:bg-red-500/10"
          >
            <ArrowLeft size={16} />
            Back to community
          </Link>
          <button
            type="button"
            onClick={() => fetchPost(false)}
            className="glass-chip border-white/20 bg-white/8 hover:border-red-300/45"
            disabled={refreshing}
          >
            <RefreshCcw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
        </div>

        <section className="surface-card surface-card-shimmer relative overflow-hidden p-7 md:p-8">
          <div className="ambient-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="pointer-events-none absolute left-[-4%] top-12 h-44 w-44 rounded-full bg-red-500/15 blur-[110px]" />
          <div className="pointer-events-none absolute right-[-5%] top-6 h-52 w-52 rounded-full bg-blue-500/12 blur-[130px]" />

          <div className="relative grid gap-6 xl:grid-cols-[1fr_0.42fr]">
            <div className="reveal-up">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryTone(post.category)}`}>
                  {post.category || 'General Discussion'}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-zinc-300">
                  {post.authorRole || 'Community member'}
                </span>
                {(post.isHot || (post?.stats?.likes || 0) + (post?.stats?.comments || 0) > 5) && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-100">
                    <Flame size={12} />
                    Active thread
                  </span>
                )}
              </div>

              <h1 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-white md:text-5xl">
                {post.title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
                {post.excerpt}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {(post.tags || []).map((tag) => (
                  <span
                    key={`${post._id}-${tag}`}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="reveal-up rounded-[28px] border border-white/10 bg-black/35 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <AvatarBadge user={author} />
                <div>
                  <p className="text-base font-semibold text-white">{post.author}</p>
                  <p className="text-sm text-zinc-400">
                    {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {discussionSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-center"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{signal.label}</p>
                    <p className="mt-2 text-2xl font-black text-white">{signal.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleLike}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    isLiked
                      ? 'border-red-400/35 bg-red-500/12 text-white'
                      : 'border-white/12 bg-white/[0.04] text-zinc-200 hover:border-red-300/35 hover:text-white'
                  }`}
                >
                  <ThumbsUp size={15} />
                  {isLiked ? 'Liked' : 'Like'}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-blue-300/35 hover:text-white"
                >
                  <Share2 size={15} />
                  Share
                </button>
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    isSaved
                      ? 'border-amber-300/35 bg-amber-500/12 text-amber-50'
                      : 'border-white/12 bg-white/[0.04] text-zinc-200 hover:border-amber-300/30 hover:text-white'
                  }`}
                >
                  <Bookmark size={15} />
                  {isSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.68fr_0.32fr]">
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
                <MessageSquare size={15} className="text-red-300" />
                Join the conversation
              </div>
              <div className="mt-5 flex gap-4">
                <AvatarBadge user={currentUser} size={44} />
                <div className="min-w-0 flex-1">
                  <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                        handleAddComment();
                      }
                    }}
                    rows={5}
                    placeholder={`Reply as ${currentUser.name}. Add a tactic, example, or focused question.`}
                    className="glass-input min-h-[160px]"
                  />
                  <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-zinc-400">Use Ctrl/Cmd + Enter to send quickly.</p>
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || submittingComment}
                      className="glass-cta disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <SendHorizontal size={16} />
                      {submittingComment ? 'Posting' : 'Post reply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    Replies
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    {post.comments?.length || 0} community responses
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                  Latest first
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {post.comments?.length ? (
                  [...post.comments]
                    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
                    .map((comment, index) => (
                      <article
                        key={`${comment.author}-${comment.createdAt}-${index}`}
                        className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div className="flex gap-3">
                          <AvatarBadge user={{ name: comment.author, avatar: comment.avatar }} size={40} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-white">{comment.author}</p>
                              <p className="text-xs text-zinc-500">
                                {formatDistanceToNow(new Date(comment.createdAt || Date.now()), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            <p className="mt-2 text-sm leading-7 text-zinc-300">{comment.text}</p>
                          </div>
                        </div>
                      </article>
                    ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.02] p-6 text-center">
                    <p className="text-lg font-semibold text-white">No replies yet</p>
                    <p className="mt-2 text-sm text-zinc-400">
                      Start the thread with a concrete suggestion, example, or useful question.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel p-5">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
                <Sparkles size={14} className="text-red-300" />
                Good reply prompts
              </div>
              <div className="mt-4 space-y-3">
                {commentPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setCommentText(prompt)}
                    className="w-full rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm leading-6 text-zinc-300 transition-colors hover:border-red-300/35 hover:bg-red-500/10 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel p-5">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
                <Sparkles size={14} className="text-red-300" />
                Next actions
              </div>
              <div className="mt-4 space-y-3">
                <Link
                  to="/community"
                  className="block rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:text-white"
                >
                  Explore more discussions
                </Link>
                <Link
                  to="/teach"
                  className="block rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:text-white"
                >
                  See the creator program
                </Link>
                <Link
                  to="/modules"
                  className="block rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:text-white"
                >
                  Open module workspace
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
