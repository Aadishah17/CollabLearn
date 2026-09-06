import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  Loader,
  MessageSquare,
  ShieldAlert,
  Search,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import AdminNavbar from '../../navbar/adminNavbar';
import { API_URL } from '../../config';

export default function ManagePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/admin/posts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setPosts(result.data || []);
        } else {
          console.error('Failed to fetch posts:', result.message);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const deletePost = async (postId) => {
    setActionLoading(postId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (result.success) {
        setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
        setNotification({
          type: 'success',
          message: 'Post was permanently removed by administrator.',
        });
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'Failed to delete post.',
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setNotification({
        type: 'error',
        message: 'Network error deleting post.',
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const query = searchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        post.author?.toLowerCase().includes(query) || post.content?.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  return (
    <div className="glass-page min-h-screen text-zinc-100 font-sans">
      <AdminNavbar />

      {notification && (
        <div className="fixed top-24 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl ${
              notification.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                : 'bg-rose-500/15 border-rose-400/30 text-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
            <p className="text-sm font-semibold">{notification.message}</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-3">
              <ShieldAlert size={14} className="text-red-300" />
              Content Moderation
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Community Post Moderation
            </h1>
            <p className="mt-2 text-zinc-400 text-sm max-w-xl">
              Review flagged discussions, monitor community health, and purge content violating
              platform terms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder="Search author or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-10 pr-4 py-2 text-sm w-64 md:w-80"
              />
            </div>
          </div>
        </header>

        <div className="surface-card card-spotlight p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-red-400" />
              Community Posts Feed
              <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300">
                {filteredPosts.length} posts
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <Loader size={32} className="animate-spin inline text-red-400" />
              <p className="mt-3 text-sm text-zinc-400">Loading community discussions...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 text-sm">
              No discussions found matching the current query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left">
                <thead>
                  <tr>
                    {['Author', 'Message Snippet', 'Reports', 'Date', 'Actions'].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredPosts.map((post) => (
                    <tr
                      key={post.id}
                      className={`transition-colors hover:bg-white/[0.04] ${
                        post.reports > 0 ? 'bg-rose-500/[0.05]' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-white text-sm">{post.author}</div>
                      </td>
                      <td className="px-4 py-3.5 max-w-md text-sm text-zinc-300">
                        <p className="truncate">{post.content}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                            post.reports > 0
                              ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                              : 'bg-white/5 text-zinc-400 border-white/10'
                          }`}
                        >
                          {post.reports > 0 ? `${post.reports} flagged` : 'Clean'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-zinc-400">
                        {post.date ? new Date(post.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                        <button
                          type="button"
                          onClick={() => deletePost(post.id)}
                          disabled={actionLoading === post.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 transition-all disabled:opacity-50"
                        >
                          {actionLoading === post.id ? (
                            <Loader size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          <span>{actionLoading === post.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
