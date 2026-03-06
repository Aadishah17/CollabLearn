import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import CollabLearnLogo from '../assets/Collablearn Logo.png';
import AuthShowcase from '../components/auth/AuthShowcase.jsx';
import { API_URL, GOOGLE_AUTH_ENABLED } from '../config';
import { emitProfileUpdated, persistSession } from '../utils/session.js';

export default function SignupPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('userRole');

    if (token) {
      navigate(storedRole === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    setPasswordsMatch(!confirmPassword || password === confirmPassword);
  }, [confirmPassword, password]);

  const showcaseContent = useMemo(
    () => ({
      badge: {
        icon: <Sparkles size={14} className="text-red-300" />,
        label: 'Plan, practice, and teach in one product',
      },
      highlights: [
        {
          icon: <Target size={20} />,
          title: 'Start with a usable roadmap',
          description:
            'Tell the platform what you want to learn and get weekly targets instead of a vague goal.',
        },
        {
          icon: <Calendar size={20} />,
          title: 'Make time visible early',
          description:
            'Connect your plan to actual study time, mentor sessions, and the progress markers that keep you honest.',
        },
        {
          icon: <Trophy size={20} />,
          title: 'Grow from learner to instructor',
          description:
            'Use the same platform to learn a skill now and teach one later when you have expertise to share.',
        },
      ],
      stats: [
        { value: '7d', label: 'session token window' },
        { value: '3', label: 'core workflows in one app' },
        { value: '0', label: 'extra tools required' },
      ],
    }),
    [],
  );

  const completeSignup = (responseData, successMessage) => {
    persistSession({ token: responseData.token, user: responseData.user });
    emitProfileUpdated({
      name: responseData.user?.name || username.trim(),
      email: responseData.user?.email || email.trim().toLowerCase(),
      isPremium: Boolean(responseData.user?.isPremium),
    });
    toast.success(successMessage);
    navigate('/dashboard', { replace: true });
  };

  const handleSignup = async (event) => {
    event.preventDefault();

    if (!acceptedTerms) {
      toast.error('Please confirm the terms note before creating your account.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed.');
      }

      completeSignup(data, 'Account created. Your workspace is ready.');
    } catch (error) {
      console.error('Signup error:', error);
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
        throw new Error(data.message || 'Google signup failed.');
      }

      completeSignup(data, 'Account created with Google.');
    } catch (error) {
      console.error('Google signup error:', error);
      toast.error(error.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-page relative flex min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute left-[-10%] top-24 h-72 w-72 rounded-full bg-red-500/12 blur-[120px]" />
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
              <Sparkles size={14} className="text-red-300" />
              Create your workspace
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Build a learning system that lasts.
            </h1>
            <p className="mt-4 text-base leading-7 text-zinc-300">
              Create an account to start with an AI roadmap, make time for mentor
              sessions, and keep progress visible from week one.
            </p>

            <form onSubmit={handleSignup} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-200">Full name</label>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="glass-input px-4 py-3.5"
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </div>

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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-200">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="glass-input px-4 py-3.5 pr-12"
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      minLength={6}
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-200">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className={`glass-input px-4 py-3.5 pr-12 ${
                        !passwordsMatch && confirmPassword ? 'border-red-500/50' : ''
                      }`}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      required
                    />
                    {confirmPassword ? (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        {passwordsMatch ? (
                          <CheckCircle size={18} className="text-emerald-300" />
                        ) : (
                          <XCircle size={18} className="text-red-300" />
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-300">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-red-500"
                  required
                />
                <span>
                  I understand this build stores my learning account and workspace data so I can
                  continue across sessions.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="glass-cta w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
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
                      onError={() => toast.error('Google signup failed.')}
                      theme="outline"
                      shape="pill"
                      text="signup_with"
                      width="100%"
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-zinc-300">
                  Google sign-up is hidden until `VITE_GOOGLE_CLIENT_ID` is configured for this
                  deployment.
                </div>
              )}
            </form>

            <p className="mt-8 text-center text-sm text-zinc-300">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-red-300 transition-colors hover:text-red-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthShowcase
        badge={showcaseContent.badge}
        title="Start with clarity instead of collecting random resources."
        description="CollabLearn gives new users a cleaner starting point: define the goal, map the work, and keep accountability nearby."
        highlights={showcaseContent.highlights}
        quote="I stopped restarting from scratch every Sunday because the next step was already planned."
        quoteAttribution="New learner feedback"
        stats={showcaseContent.stats}
      />
    </div>
  );
}
