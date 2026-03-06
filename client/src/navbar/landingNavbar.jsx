import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Moon, Sparkles, Sun, X } from 'lucide-react';
import { useTheme } from '../components/user/useTheme.js';
import logo from '../assets/Collablearn Logo.png';
import { hasStoredSession } from '../utils/session.js';

export default function LandingNavbar() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasSession, setHasSession] = useState(hasStoredSession);
  const links = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#teach', label: 'Teach' },
  ];

  useEffect(() => {
    const syncSession = () => setHasSession(hasStoredSession());

    window.addEventListener('storage', syncSession);
    window.addEventListener('profileUpdated', syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('profileUpdated', syncSession);
    };
  }, []);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-3 pt-3">
      <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-2xl liquid-glass">
        <div className="pointer-events-none absolute -top-10 right-10 h-28 w-28 rounded-full liquid-orb opacity-60" />
        <div className="flex h-20 items-center justify-between gap-3 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="CollabLearn Logo" className="w-10 h-10 rounded-xl border border-white/20 object-cover" />
            <span className="text-xl md:text-2xl font-bold text-white tracking-tight">CollabLearn</span>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-zinc-300 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden xl:flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-zinc-200">
            <Sparkles size={14} className="text-red-300" />
            AI learning roadmaps + mentor sessions
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
                <Link
                  to="/dashboard"
                  className="glass-cta px-4 py-2.5 text-sm"
                >
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:border-red-400/50 hover:bg-red-500/15"
                  >
                    Sign In
                  </Link>
                  <Link to="/signup" className="neo-btn px-4 py-2 text-sm">
                    Get Started
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
          <div className="border-t border-white/10 px-4 pb-4 pt-3 md:hidden">
            <div className="grid gap-2">
              {links.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-zinc-100"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="mt-3 grid gap-2">
              {hasSession ? (
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="glass-cta w-full"
                >
                  Open dashboard
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
                    className="neo-btn w-full"
                  >
                    Get Started
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
