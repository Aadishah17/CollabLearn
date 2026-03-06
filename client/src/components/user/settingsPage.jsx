import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Calendar,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  Trophy,
  User,
} from 'lucide-react';
import MainNavbar from '../../navbar/mainNavbar.jsx';
import { useTheme } from './useTheme.js';
import { API_URL } from '../../config';
import { clearSession, emitProfileUpdated } from '../../utils/session.js';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [user, setUser] = useState(() => ({
    name: localStorage.getItem('username') || 'Learner',
    email: localStorage.getItem('email') || '',
    isPremium: localStorage.getItem('isPremium') === 'true',
  }));
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        if (!data.success || !data.user) return;

        const nextUser = {
          name: data.user.name || 'Learner',
          email: data.user.email || '',
          isPremium: Boolean(data.user.isPremium),
        };

        setUser(nextUser);
        localStorage.setItem('username', nextUser.name);
        localStorage.setItem('email', nextUser.email);
        localStorage.setItem('isPremium', String(nextUser.isPremium));
      } catch (error) {
        console.error('Settings: failed to fetch current user', error);
      }
    };

    fetchCurrentUser();
  }, []);

  const quickLinks = useMemo(
    () => [
      {
        icon: Sparkles,
        title: 'AI Learning',
        description: 'Open your roadmap, guided resources, and learning plan.',
        action: () => navigate('/ai-learning'),
      },
      {
        icon: Calendar,
        title: 'Calendar',
        description: 'Review upcoming sessions and keep your study schedule visible.',
        action: () => navigate('/calendar'),
      },
      {
        icon: MessageSquare,
        title: 'Messages',
        description: 'Pick up conversations with mentors, learners, and collaborators.',
        action: () => navigate('/messages'),
      },
    ],
    [navigate],
  );

  const handleManageProfile = () => {
    navigate('/profile?edit=true');
  };

  const handleSignOut = () => {
    clearSession();
    emitProfileUpdated({ name: 'Guest', email: '', isPremium: false });
    toast.success('Signed out from this device.');
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account permanently? This will remove your profile, bookings, and related data.')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expired. Sign in again and retry.');
      navigate('/login');
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account.');
      }

      clearSession();
      emitProfileUpdated({ name: 'Guest', email: '', isPremium: false });

      toast.success('Account deleted.');
      navigate('/');
    } catch (error) {
      console.error('Settings: delete account failed', error);
      toast.error(error.message || 'Unable to delete account right now.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="glass-page min-h-screen font-sans transition-colors duration-300">
      <MainNavbar />

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-28">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="eyebrow">
              <Settings size={14} className="text-red-300" />
              Preferences
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white md:text-5xl">
              Settings that keep your workspace clear and reliable.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
              Manage your profile, visual preferences, and session state without leaving the learning flow.
            </p>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6">
            <div className="surface-card p-7">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 text-lg font-black text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
                      Account summary
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">{user.name}</h2>
                    <p className="mt-1 text-sm text-zinc-300">{user.email || 'No email synced'}</p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-zinc-200">
                      <Trophy size={15} className={user.isPremium ? 'text-amber-300' : 'text-zinc-400'} />
                      {user.isPremium ? 'Premium member' : 'Standard member'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManageProfile}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-red-400/45 hover:bg-red-500/12"
                >
                  Edit profile
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="surface-card p-7">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    Appearance
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Theme mode</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300">
                    Keep the interface aligned with your preference. The theme is shared across the website and app workspace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-blue-400/45 hover:bg-blue-500/12"
                  aria-pressed={isDarkMode}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8">
                    {isDarkMode ? <Sun size={18} className="text-amber-300" /> : <Moon size={18} className="text-blue-300" />}
                  </span>
                  <span>{isDarkMode ? 'Dark mode enabled' : 'Light mode enabled'}</span>
                </button>
              </div>
            </div>

            <div className="surface-card p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Quick access
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">Jump back into the parts of the app you use most.</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {quickLinks.map((linkItem) => (
                  <button
                    key={linkItem.title}
                    type="button"
                    onClick={linkItem.action}
                    className="feature-tile text-left"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
                      <linkItem.icon size={20} className="text-red-300" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-white">{linkItem.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">{linkItem.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="surface-card p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-200">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    Security
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Session control</h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">
                    This build uses token-based sign-in. You can safely clear your current device session here at any time.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-red-400/45 hover:bg-red-500/12"
              >
                <LogOut size={18} />
                Sign out on this device
              </button>
            </div>

            <div className="surface-card p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Profile controls
              </p>
              <div className="mt-5 space-y-4">
                <button
                  type="button"
                  onClick={handleManageProfile}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/4 px-4 py-4 text-left transition-colors hover:border-white/20"
                >
                  <span className="flex items-center gap-3">
                    <User size={18} className="text-red-300" />
                    <span className="text-sm font-semibold text-white">Update profile details</span>
                  </span>
                  <ArrowRight size={18} className="text-zinc-400" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/4 px-4 py-4 text-left transition-colors hover:border-white/20"
                >
                  <span className="flex items-center gap-3">
                    <Sparkles size={18} className="text-blue-300" />
                    <span className="text-sm font-semibold text-white">Return to dashboard</span>
                  </span>
                  <ArrowRight size={18} className="text-zinc-400" />
                </button>
              </div>
            </div>

            <div className="surface-card border border-red-500/20 p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-200/80">
                Danger zone
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">Delete account</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                Permanently removes your profile and related data. This action cannot be reversed.
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={18} />
                {deleting ? 'Deleting account...' : 'Delete account permanently'}
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
