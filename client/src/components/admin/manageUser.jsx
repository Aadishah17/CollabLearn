import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Loader,
  Crown,
  X,
  CheckCircle,
  AlertCircle,
  Shield,
  Search,
  UserCheck,
  UserX,
  Sparkles,
} from 'lucide-react';
import AdminNavbar from '../../navbar/adminNavbar';
import { API_URL } from '../../config';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newSubscription, setNewSubscription] = useState('free');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setUsers(result.data || []);
        } else {
          console.error('Failed to fetch users:', result.message);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const blockUser = async (userId) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/block`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setUsers(users.map((user) => (user.id === userId ? { ...user, status: 'Blocked' } : user)));
        setNotification({
          type: 'success',
          message: 'User has been blocked from accessing the platform.',
        });
        setTimeout(() => setNotification(null), 3000);
      } else {
        console.error('Failed to block user:', result.message);
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const unblockUser = async (userId) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/unblock`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setUsers(users.map((user) => (user.id === userId ? { ...user, status: 'Active' } : user)));
        setNotification({
          type: 'success',
          message: 'User access has been restored.',
        });
        setTimeout(() => setNotification(null), 3000);
      } else {
        console.error('Failed to unblock user:', result.message);
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openSubscriptionModal = (user) => {
    setSelectedUser(user);
    setNewSubscription(user.isPremium ? 'premium' : 'free');
    setShowSubscriptionModal(true);
  };

  const closeSubscriptionModal = () => {
    setShowSubscriptionModal(false);
    setSelectedUser(null);
    setNewSubscription('free');
  };

  const updateSubscription = async () => {
    if (!selectedUser) return;

    setActionLoading(selectedUser.id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/users/${selectedUser.id}/subscription`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPremium: newSubscription === 'premium' }),
      });

      const result = await response.json();

      if (result.success) {
        setUsers(
          users.map((user) =>
            user.id === selectedUser.id
              ? { ...user, isPremium: newSubscription === 'premium' }
              : user
          )
        );

        setNotification({
          type: 'success',
          message: `Updated ${selectedUser.name}'s plan to ${newSubscription === 'premium' ? 'Premium' : 'Free'}.`,
        });

        closeSubscriptionModal();
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'Failed to update subscription',
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      setNotification({
        type: 'error',
        message: 'Network error. Please try again.',
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  return (
    <div className="glass-page min-h-screen text-zinc-100 font-sans">
      <AdminNavbar />

      {/* Notification Toast */}
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
              <AlertCircle size={20} />
            )}
            <p className="text-sm font-semibold">{notification.message}</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-3">
              <Shield size={14} className="text-red-300" />
              Access Control
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              User Management
            </h1>
            <p className="mt-2 text-zinc-400 text-sm max-w-xl">
              Inspect user roles, manage platform subscriptions, and enforce moderation policies
              across all registered accounts.
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
                placeholder="Search name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-10 pr-4 py-2 text-sm w-64 md:w-80"
              />
            </div>
          </div>
        </header>

        {/* User Table Card */}
        <div className="surface-card card-spotlight p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-red-400" />
              Registered Accounts
              <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300">
                {filteredUsers.length} total
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <Loader size={32} className="animate-spin inline text-red-400" />
              <p className="mt-3 text-sm text-zinc-400">Loading accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 text-sm">
              No accounts match the current query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left">
                <thead>
                  <tr>
                    {[
                      'Name',
                      'Email',
                      'Role',
                      'Access Level',
                      'Plan',
                      'Joined',
                      'Status',
                      'Actions',
                    ].map((header) => (
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
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`transition-colors hover:bg-white/[0.04] ${
                        user.status === 'Blocked' ? 'bg-rose-500/[0.04]' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-white text-sm">{user.name}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-zinc-300 font-mono text-xs">
                        {user.email}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            user.role === 'Instructor'
                              ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'
                              : 'bg-blue-500/15 text-blue-200 border-blue-400/30'
                          }`}
                        >
                          {user.role || 'Student'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            user.isSuperAdmin
                              ? 'bg-amber-500/15 text-amber-200 border-amber-400/30'
                              : user.accessRole === 'admin'
                                ? 'bg-purple-500/15 text-purple-200 border-purple-400/30'
                                : 'bg-white/5 text-zinc-300 border-white/10'
                          }`}
                        >
                          {user.isSuperAdmin
                            ? 'SUPER ADMIN'
                            : String(user.accessLevel || 'user').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                        <button
                          type="button"
                          onClick={() => openSubscriptionModal(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all hover:scale-105"
                          style={{
                            background: user.isPremium
                              ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1))'
                              : 'rgba(255,255,255,0.05)',
                            borderColor: user.isPremium
                              ? 'rgba(245,158,11,0.4)'
                              : 'rgba(255,255,255,0.1)',
                            color: user.isPremium ? '#fbbf24' : '#a1a1aa',
                          }}
                        >
                          {user.isPremium ? <Crown size={12} className="text-amber-400" /> : null}
                          {user.isPremium ? 'PRO TIER' : 'FREE'}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-zinc-400">
                        {user.registered ? new Date(user.registered).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${
                            user.status === 'Blocked'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-400/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                          }`}
                        >
                          {user.status === 'Blocked' ? (
                            <UserX size={12} />
                          ) : (
                            <UserCheck size={12} />
                          )}
                          {user.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                        {user.isSuperAdmin ? (
                          <span className="text-xs font-semibold text-amber-400/80">Protected</span>
                        ) : user.status === 'Blocked' ? (
                          <button
                            type="button"
                            onClick={() => unblockUser(user.id)}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1 rounded-xl text-xs font-semibold border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                          >
                            {actionLoading === user.id ? '...' : 'Unblock'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => blockUser(user.id)}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1 rounded-xl text-xs font-semibold border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 transition-all disabled:opacity-50"
                          >
                            {actionLoading === user.id ? '...' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Subscription Change Modal */}
      {showSubscriptionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="surface-card border border-white/15 rounded-3xl p-7 max-w-md w-full relative shadow-2xl">
            <button
              type="button"
              onClick={closeSubscriptionModal}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="eyebrow mb-2">
              <Sparkles size={12} className="text-amber-400" />
              Plan Override
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Change User Subscription</h2>
            <p className="text-xs text-zinc-400 mb-6">
              Update plan privileges for{' '}
              <span className="text-white font-semibold">{selectedUser.name}</span> (
              {selectedUser.email}).
            </p>

            <div className="space-y-3 mb-6">
              {/* Free Plan */}
              <div
                onClick={() => setNewSubscription('free')}
                className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                  newSubscription === 'free'
                    ? 'border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Free Standard Plan</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Core learning, standard booking, community access
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      newSubscription === 'free' ? 'border-blue-400 bg-blue-500' : 'border-zinc-600'
                    }`}
                  >
                    {newSubscription === 'free' && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </div>

              {/* Premium Plan */}
              <div
                onClick={() => setNewSubscription('premium')}
                className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                  newSubscription === 'premium'
                    ? 'border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Crown size={20} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Pro Accelerator Plan</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Priority bookings, AI Studio generation, WebRTC video calls
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      newSubscription === 'premium'
                        ? 'border-amber-400 bg-amber-500'
                        : 'border-zinc-600'
                    }`}
                  >
                    {newSubscription === 'premium' && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeSubscriptionModal}
                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-zinc-300 font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateSubscription}
                disabled={actionLoading === selectedUser.id}
                className="flex-1 glass-cta justify-center py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {actionLoading === selectedUser.id ? 'Updating...' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
