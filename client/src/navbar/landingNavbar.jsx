import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../components/user/ThemeContext';
import logo from '../assets/react.svg';

export default function LandingNavbar() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-3 pt-3">
      <div className="mx-auto max-w-[1280px] liquid-glass rounded-2xl relative overflow-hidden">
        <div className="pointer-events-none absolute -top-10 right-10 h-28 w-28 rounded-full liquid-orb opacity-60"></div>
        <div className="flex h-20 items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="CollabLearn Logo" className="w-10 h-10 rounded-xl border border-white/20 object-cover" />
            <span className="text-xl md:text-2xl font-bold text-white tracking-tight">CollabLearn</span>
          </Link>

          <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-zinc-200">
            <Sparkles size={14} className="text-red-300" />
            AI roadmap learning platform
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
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-100 border border-white/20 hover:border-red-400/50 hover:bg-red-500/15 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-colors shadow-lg shadow-red-950/50"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
