import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Users,
  Settings,
  LogOut,
  User,
  LayoutDashboard,
  Trash2,
  Home,
  ShieldCheck
} from 'lucide-react';
import CollabLearnLogo from '../assets/collablearn-logo.svg';
import { clearSession, emitProfileUpdated } from '../utils/session.js';

export default function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [username] = useState(localStorage.getItem('username') || 'Admin');
  const [email] = useState(localStorage.getItem('email') || '');
  const [isSuperAdmin] = useState(localStorage.getItem('isSuperAdmin') === 'true');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const websiteRoute = isSuperAdmin ? '/dashboard' : '/';

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const adminNavTabs = useMemo(
    () => [
      { path: '/admin', icon: LayoutDashboard, label: 'Overview' },
      { path: '/admin/manage-users', icon: Users, label: 'Users' },
      { path: '/admin/manage-posts', icon: Trash2, label: 'Posts' },
      { path: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
      { path: '/admin/settings', icon: Settings, label: 'Settings' }
    ],
    []
  );

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return isActive
      ? 'inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-950/40'
      : 'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white';
  };

  const handleLogout = () => {
    clearSession();
    emitProfileUpdated({ name: 'Guest', email: '', isPremium: false, role: 'user', isSuperAdmin: false });
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-6">
        <Link to="/admin" className="flex items-center gap-3 shrink-0">
          <img
            src={CollabLearnLogo}
            alt="CollabLearn Logo"
            className="h-11 w-11 rounded-xl border border-white/15 object-cover"
          />
          <div>
            <p className="text-lg font-bold tracking-tight text-white">CollabLearn</p>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
              {isSuperAdmin ? 'Super Access' : 'Admin Console'}
            </p>
          </div>
        </Link>

        <div className="hidden flex-1 items-center gap-2 overflow-x-auto lg:flex">
          {adminNavTabs.map((tab) => (
            <Link key={tab.path} to={tab.path} className={getLinkClass(tab.path)}>
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(websiteRoute)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-emerald-400/45 hover:bg-emerald-500/10 hover:text-white"
          >
            <Home size={16} />
            Website
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 transition-colors hover:border-red-400/45 hover:bg-red-500/10"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-rose-500 text-white">
                <User size={16} />
              </div>
              <span className="hidden md:block">{username}</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="font-semibold text-white">{username}</p>
                  <p className="mt-1 text-xs text-zinc-400">{email || 'No email connected'}</p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
                    <ShieldCheck size={12} />
                    {isSuperAdmin ? 'Protected Super Admin' : 'Admin Session'}
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate(websiteRoute);
                    }}
                    className="w-full inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-100 transition-colors hover:bg-white/10"
                  >
                    <Home size={16} />
                    Return to website
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-200 transition-colors hover:bg-red-500/20"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
