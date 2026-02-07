import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Home,
  Calendar,
  MessageSquare,
  Users,
  Trophy,
  Bell,
  User,
  UserCircle,
  Settings,
  LogOut,
  Moon,
  Sun,
  Play,
  Sparkles,
  Book,
  Menu,
  X,
  GraduationCap
} from 'lucide-react';
import CollabLearnLogo from '../assets/react.svg';
import Notification from '../components/Notification';
import { useTheme } from '../components/user/ThemeContext';
import { API_URL } from '../config';

export default function MainNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [username, setUsername] = useState('Guest');
  const [email, setEmail] = useState('');
  const [isPremium, setIsPremium] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const isGuest = username === 'Guest';

  const navLinks = useMemo(() => {
    const links = [
      { path: '/dashboard', label: 'Dashboard', icon: Home },
      { path: '/ai-learning', label: 'AI Learning', icon: Sparkles, featured: true },
      { path: '/modules', label: 'Modules', icon: Book },
      { path: '/browse-skills', label: 'Skills', icon: Search },
      { path: '/courses', label: 'Courses', icon: Play },
      { path: '/community', label: 'Community', icon: Users },
      { path: '/calendar', label: 'Calendar', icon: Calendar },
      { path: '/messages', label: 'Messages', icon: MessageSquare },
      { path: '/teach', label: 'Teach', icon: GraduationCap }
    ];

    if (isPremium === false) {
      links.push({ path: '/get-premium', label: 'Get Premium', icon: Trophy, premium: true });
    }

    return links;
  }, [isPremium]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        const storedUsername = localStorage.getItem('username');
        const storedEmail = localStorage.getItem('email');
        const storedIsPremium = localStorage.getItem('isPremium');

        if (storedUsername) {
          setUsername(storedUsername);
          setEmail(storedEmail || '');
        }
        setIsPremium(storedIsPremium !== null ? storedIsPremium === 'true' : false);
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      if (data.success && data.user) {
        setUsername(data.user.name || 'Guest');
        setEmail(data.user.email || '');
        setIsPremium(Boolean(data.user.isPremium));

        localStorage.setItem('username', data.user.name || 'Guest');
        localStorage.setItem('email', data.user.email || '');
        localStorage.setItem('isPremium', String(Boolean(data.user.isPremium)));
      }
    } catch (error) {
      const storedUsername = localStorage.getItem('username');
      const storedEmail = localStorage.getItem('email');
      const storedIsPremium = localStorage.getItem('isPremium');

      if (storedUsername) {
        setUsername(storedUsername);
        setEmail(storedEmail || '');
      }
      if (storedIsPremium !== null) {
        setIsPremium(storedIsPremium === 'true');
      }
      console.error('MainNavbar: Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');
    if (storedUsername) {
      setUsername(storedUsername);
      setEmail(storedEmail || '');
    }

    fetchUserData();

    const fetchNotifications = async () => {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      if (!userId || !token) return;

      try {
        const [studentResponse, instructorResponse] = await Promise.all([
          fetch(`${API_URL}/api/booking/student/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/booking/instructor/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        let allNotifications = [];

        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          if (studentData.success) {
            allNotifications.push(
              ...studentData.bookings
                .filter((booking) => booking.status === 'confirmed' || booking.status === 'cancelled')
                .map((booking) => ({ ...booking, type: 'student' }))
            );
          }
        }

        if (instructorResponse.ok) {
          const instructorData = await instructorResponse.json();
          if (instructorData.success) {
            allNotifications.push(
              ...instructorData.bookings
                .filter((booking) => booking.status === 'pending')
                .map((booking) => ({ ...booking, type: 'instructor' }))
            );
          }
        }

        allNotifications.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setNotifications(allNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const notificationInterval = setInterval(fetchNotifications, 30000);

    const handleProfileUpdate = (event) => {
      if (event.detail.name) setUsername(event.detail.name);
      if (event.detail.email) setEmail(event.detail.email);
      if (typeof event.detail.isPremium !== 'undefined') {
        setIsPremium(Boolean(event.detail.isPremium));
        localStorage.setItem('isPremium', String(Boolean(event.detail.isPremium)));
      }
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      clearInterval(notificationInterval);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('email');
    localStorage.removeItem('isPremium');
    setUsername('Guest');
    setIsDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-3 pt-3">
      <div className="mx-auto max-w-[1500px] relative liquid-glass rounded-2xl" ref={mobileMenuRef}>
        <div className="pointer-events-none absolute -top-10 left-6 h-28 w-28 rounded-full liquid-orb opacity-70"></div>
        <div className="pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full liquid-orb opacity-45"></div>

        <div className="relative flex h-20 items-center gap-3 px-4 md:px-6">
          <Link to={isGuest ? '/' : '/dashboard'} className="flex items-center gap-3 shrink-0">
            <img
              src={CollabLearnLogo}
              alt="CollabLearn Logo"
              className="w-10 h-10 rounded-xl object-cover border border-white/20"
            />
            <span className="text-xl md:text-2xl font-bold text-white tracking-tight">CollabLearn</span>
          </Link>

          <div className="hidden lg:flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar px-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`${active ? 'glass-tab glass-tab-active' : 'glass-tab'} ${
                    link.premium && !active ? 'text-amber-200 hover:border-amber-400/40 hover:bg-amber-500/20' : ''
                  } ${link.featured && !active ? 'hover:bg-rose-500/18' : ''}`}
                >
                  <Icon size={16} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {isGuest ? (
              <div className="hidden md:flex items-center gap-2">
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
            ) : (
              <>
                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen((prev) => !prev)}
                    className="glass-icon-btn"
                    aria-label="Notifications"
                  >
                    <Bell size={18} />
                    {notifications.length > 0 && (
                      <span className="absolute -right-1 -top-1 min-w-5 h-5 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                  {isNotificationsOpen && (
                    <Notification notifications={notifications} onClose={() => setIsNotificationsOpen(false)} />
                  )}
                </div>

                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 hover:border-red-400/45 hover:bg-red-500/12 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-rose-500 text-white text-sm font-bold flex items-center justify-center">
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:block text-sm font-semibold text-zinc-100 max-w-24 truncate">
                      {loading ? 'Loading...' : username}
                    </span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 liquid-glass rounded-2xl p-2">
                      <div className="rounded-xl border border-white/15 bg-black/25 p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                            <User size={18} className="text-zinc-100" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-100 truncate">{loading ? 'Loading...' : username}</p>
                            <p className="text-xs text-zinc-300 truncate">{loading ? '' : email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            navigate('/profile');
                          }}
                          className="w-full inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-100 hover:bg-red-500/20 transition-colors"
                        >
                          <UserCircle size={16} />
                          Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            navigate('/settings');
                          }}
                          className="w-full inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-100 hover:bg-red-500/20 transition-colors"
                        >
                          <Settings size={16} />
                          Settings
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-200 hover:bg-red-500/25 transition-colors"
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={toggleDarkMode}
              className="glass-icon-btn"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden glass-icon-btn"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/15 px-3 pb-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`${active ? 'glass-tab glass-tab-active' : 'glass-tab'} justify-center`}
                  >
                    <Icon size={15} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {isGuest && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  className="rounded-xl border border-white/20 py-2 text-center text-sm font-semibold text-zinc-100"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-2 text-center text-sm font-semibold text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
