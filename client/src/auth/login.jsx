import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Sparkles,
  Target,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import CollabLearnLogo from '../assets/Collablearn Logo.png';
import AuthShowcase from '../components/auth/AuthShowcase.jsx';
import { API_URL, GOOGLE_AUTH_ENABLED } from '../config';
import { emitProfileUpdated, persistSession } from '../utils/session.js';

const rememberedEmail = localStorage.getItem('rememberedEmail') || '';

function resolveNextRoute(fromPathname, userRole) {
  if (fromPathname && !['/login', '/signup'].includes(fromPathname)) {
    return fromPathname;
  }

  return userRole === 'admin' ? '/admin' : '/dashboard';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from?.pathname;

  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(Boolean(rememberedEmail));
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('userRole');

    if (token) {
      navigate(resolveNextRoute(redirectPath, storedRole), { replace: true });
    }
  }, [navigate, redirectPath]);

  const showcaseContent = useMemo(
    () => ({
      badge: {
        icon: <Sparkles size={14} className="text-red-300" />,
        label: 'Structured learning with mentor support',
      },
      highlights: [
        {
          icon: <Target size={20} />,
          title: 'Weekly goals that stay realistic',
          description:
            'Roadmaps are shaped around your level, schedule, and timeline so the plan stays usable.',
        },
        {
          icon: <Calendar size={20} />,
          title: 'Sessions and study blocks in one flow',
          description:
            'Move from roadmap to mentor sessions and calendar planning without jumping between tools.',
        },
        {
          icon: <MessageSquare size={20} />,
          title: 'Community and direct support',
          description:
            'Keep momentum with messaging, discussion, and progress sharing when you need a second push.',
        },
      ],
      stats: [
        { value: '68%', label: 'roadmap completion rate' },
        { value: '4x', label: 'weekly accountability loops' },
        { value: '1', label: 'workspace for learning' },
      ],
    }),
    [],
  );

  const completeLogin = (responseData) => {
    persistSession({ token: responseData.token, user: responseData.user });

    emitProfileUpdated({
      name: responseData.user?.name || 'Learner',
      email: responseData.user?.email || '',
      isPremium: Boolean(responseData.user?.isPremium),
    });

    if (rememberEmail) {
      localStorage.setItem('rememberedEmail', email.trim().toLowerCase());
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    toast.success('Welcome back.');
    navigate(resolveNextRoute(redirectPath, responseData.user?.role), { replace: true });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          role: 'user',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      completeLogin(data);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error('Google authentication did not return a token.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Google login failed.');
      }

      completeLogin(data);
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-page relative flex min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute left-[-10%] top-20 h-72 w-72 rounded-full bg-red-500/12 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-12%] right-[-8%] h-80 w-80 rounded-full bg-blue-500/12 blur-[140px]" />

      <div className="relative flex w-full lg:w-[46%]">
        <div className="mx-auto flex w-full max-w-xl flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
          <Link to="/" className="mb-10 inline-flex items-center gap-3 self-start">
            <img
              src={CollabLearnLogo}
              alt="CollabLearn Logo"
              className="h-10 w-10 rounded-xl border border-white/20 object-cover"
            />
            <span className="text-xl font-bold tracking-tight text-white">CollabLearn</span>
          </Link>

          <div className="surface-card p-7 sm:p-8">
            <div className="eyebrow">
              <BookOpen size={14} className="text-red-300" />
              Welcome back
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Resume your learning rhythm.
            </h1>
            <p className="mt-4 text-base leading-7 text-zinc-300">
              Sign in to reopen your roadmap, upcoming sessions, and the conversations
              keeping your progress moving.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-200">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="glass-input px-4 py-3.5"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-200">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="glass-input px-4 py-3.5 pr-12"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 transition-colors hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(event) => setRememberEmail(event.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-red-500"
                  />
                  Remember my email on this device
                </label>
                <p className="text-xs leading-6 text-zinc-400">
                  Password reset is not available in this build yet.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="glass-cta w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {GOOGLE_AUTH_ENABLED ? (
                <>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-transparent px-4 text-sm font-medium text-zinc-400">
                        Or continue with Google
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast.error('Google login failed.')}
                      theme="outline"
                      shape="pill"
                      text="continue_with"
                      width="100%"
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-zinc-300">
                  Google sign-in is hidden until `VITE_GOOGLE_CLIENT_ID` is configured for this
                  deployment.
                </div>
              )}
            </form>

            <p className="mt-8 text-center text-sm text-zinc-300">
              New here?{' '}
              <Link
                to="/signup"
                className="font-semibold text-red-300 transition-colors hover:text-red-200"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthShowcase
        badge={showcaseContent.badge}
        title="Turn daily effort into visible weekly progress."
        description="CollabLearn gives you one place to plan, practice, ask for help, and keep the next action obvious."
        highlights={showcaseContent.highlights}
        quote="The roadmap and mentor touchpoints stopped my learning from falling apart after the first week."
        quoteAttribution="Product learner feedback"
        stats={showcaseContent.stats}
      />
    </div>
  );
}
