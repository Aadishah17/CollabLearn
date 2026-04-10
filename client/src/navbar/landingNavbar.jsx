import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, Moon, Sparkles, Sun, X } from 'lucide-react';
import { useTheme } from '../components/user/useTheme.js';
import logo from '../assets/collablearn-logo.svg';
import { hasStoredSession } from '../utils/session.js';
import { buildPublicDiscoveryLinks, resolvePublicWebsiteEntry } from './navLinks.js';

export default function LandingNavbar() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasSession, setHasSession] = useState(hasStoredSession);
  const [userRole, setUserRole] = useState(
    typeof localStorage === 'undefined' ? 'user' : localStorage.getItem('userRole'),
  );
  const [isSuperAdmin, setIsSuperAdmin] = useState(
    typeof localStorage === 'undefined' ? false : localStorage.getItem('isSuperAdmin') === 'true',
  );

  const links = [
    { href: '#how-it-works', label: 'Learning Loop' },
    { href: '#features', label: 'Features' },
    { href: '#teach', label: 'Teach' },
    ...buildPublicDiscoveryLinks().map((link) => ({ to: link.path, label: link.label })),
    { to: '/status', label: 'Status' },
  ];

  useEffect(() => {
    const syncSession = () => {
      setHasSession(hasStoredSession());
      setUserRole(typeof localStorage === 'undefined' ? 'user' : localStorage.getItem('userRole'));
      setIsSuperAdmin(
        typeof localStorage === 'undefined' ? false : localStorage.getItem('isSuperAdmin') === 'true',
      );
    };

    window.addEventListener('storage', syncSession);
    window.addEventListener('profileUpdated', syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('profileUpdated', syncSession);
    };
  }, []);

  const publicEntry = resolvePublicWebsiteEntry({
    hasSession,
    userRole,
    isSuperAdmin,
  });

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-4">
      <div className="relative mx-auto max-w-[1360px] overflow-hidden rounded-[28px] border border-white/12 bg-black/35 shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/[0.03] via-transparent to-red-500/[0.05]" />
        <div className="pointer-events-none absolute -left-10 top-0 h-28 w-28 rounded-full bg-white/[0.05] blur-3xl" />
        <div className="pointer-events-none absolute right-12 top-[-2.5rem] h-28 w-28 rounded-full bg-red-500/15 blur-3xl" />

        <div className="relative flex min-h-[5.25rem] items-center justify-between gap-3 px-4 md:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img
              src={logo}
              alt="CollabLearn Logo"
              className="h-11 w-11 rounded-2xl border border-white/20 object-cover shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
            />
            <div className="min-w-0">
              <span className="block truncate text-xl font-black tracking-[-0.03em] text-white md:text-2xl">
                CollabLearn
              </span>
              <span className="hidden text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500 md:block">
                Learn with structure
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            {links.map((item) =>
              item.to ? (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-full border border-white/10 bg-white/[0.025] px-4 py-2 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-400/30 hover:bg-red-500/[0.08] hover:text-white"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-white/10 bg-white/[0.025] px-4 py-2 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-400/30 hover:bg-red-500/[0.08] hover:text-white"
                >
                  {item.label}
                </a>
              ),
            )}
          </div>

          <div className="hidden xl:flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-200">
            <Sparkles size={14} className="text-red-300" />
            Roadmaps, mentors, momentum
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="glass-icon-btn"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="hidden md:flex items-center gap-2">
              {hasSession ? (
                <Link to={publicEntry.path} className="glass-cta px-4 py-2.5 text-sm">
                  {publicEntry.label}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:border-red-400/50 hover:bg-red-500/15"
                  >
                    Sign in
                  </Link>
                  <Link to="/signup" className="glass-cta group px-4 py-2.5 text-sm">
                    Get started
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
                    />
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="glass-icon-btn md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <div className="relative border-t border-white/10 px-4 pb-4 pt-3 md:hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
            <div className="relative grid gap-2">
              {links.map((item) =>
                item.to ? (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-zinc-100"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-zinc-100"
                  >
                    {item.label}
                  </a>
                ),
              )}
            </div>

            <div className="relative mt-3 grid gap-2">
              {hasSession ? (
                <Link
                  to={publicEntry.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="glass-cta w-full"
                >
                  {publicEntry.label}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="glass-cta w-full"
                  >
                    Get started
                    <ArrowRight size={16} />
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
