import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import CollabLearnLogo from '../assets/react.svg';
import { API_URL } from '../config';


const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (confirmPassword) {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(true); // Don't show error when empty
    }
  }, [password, confirmPassword]);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Account created! Please log in.');
        navigate('/login');
      } else {
        toast.error(data.message || 'Signup failed.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('username', data.user.name);
          localStorage.setItem('userId', data.user.id);
          localStorage.setItem('email', data.user.email);
          localStorage.setItem('isPremium', String(Boolean(data.user.isPremium)));
        }

        toast.success('Account Created with Google!');
        window.dispatchEvent(new Event('storage'));
        navigate('/dashboard');
      } else {
        toast.error(data.message || 'Google signup failed.');
      }
    } catch (error) {
      console.error('Google signup error:', error);
      toast.error('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex glass-page transition-colors duration-300">
      {/* Left Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-24 relative">
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 group">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-900/20">
            <span className="font-bold text-xl">C</span>
          </div>
          <span className="font-bold text-white text-xl tracking-tight group-hover:text-red-300 transition-colors">CollabLearn</span>
        </Link>

        <div className="max-w-md w-full mx-auto glass-panel p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Create Account</h1>
            <p className="text-zinc-300">Join the learning community and start growing today.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input pl-5 pr-4 py-3.5"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-5 pr-4 py-3.5"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input pl-5 pr-10 py-3.5"
                    placeholder="Min 6 chars"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-2">Confirm</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-5 pr-10 py-3.5 bg-zinc-900/40 border rounded-2xl focus:outline-none focus:ring-2 transition-all text-zinc-100 ${!passwordsMatch && confirmPassword
                      ? 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-white/15 focus:ring-red-500/50 focus:border-red-500'
                      }`}
                    placeholder="Confirm"
                    required
                  />
                  {confirmPassword && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {passwordsMatch ? (
                        <CheckCircle size={18} className="text-emerald-500" />
                      ) : (
                        <XCircle size={18} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 mt-2">
              <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-zinc-700 text-red-600 focus:ring-red-500 bg-zinc-900" />
              <span className="text-sm text-zinc-300">
                I agree to the <a href="#" className="text-red-600 dark:text-red-500 hover:underline">Terms of Service</a> and <a href="#" className="text-red-600 dark:text-red-500 hover:underline">Privacy Policy</a>.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glass-cta py-3.5 font-bold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/15"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-zinc-400 font-medium">Or join with</span>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    toast.error('Google Signup Failed');
                  }}
                  useOneTap
                  theme="outline"
                  shape="pill"
                  text="signup_with"
                  width="100%"
                />
              </div>
            </div>
          </form>

          <p className="mt-8 text-center text-zinc-300 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-red-400 font-semibold hover:text-red-300 hover:underline decoration-2 underline-offset-4 transition-all">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Decoration */}
      <div className="hidden lg:block w-1/2 bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-black/50 to-black z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>

        {/* Subtle Background Accent */}
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[100px]"></div>


        <div className="absolute inset-0 z-20 flex flex-col justify-center px-16 text-white">
          <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 w-fit">
            <Sparkles size={14} className="text-red-400" />
            <span className="text-xs font-medium text-white/90">Join 10,000+ Learners</span>
          </div>
          <h2 className="text-5xl font-bold mb-6 leading-tight tracking-tight">Start your journey <br /> <span className="text-gradient-red">today.</span></h2>
          <p className="text-zinc-400 text-xl leading-relaxed max-w-lg mb-12">
            "CollabLearn gave me structure, focus, and momentum. I finally know what to learn next every week."
          </p>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[5, 6, 7, 8].map((i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-xs font-bold ring-2 ring-white/10`}>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} className="w-full h-full rounded-full" alt="avatar" />
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white">Top Rated</span>
              <span className="text-xs text-zinc-500">Learning Platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
