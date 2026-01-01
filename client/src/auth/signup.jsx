import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import CollabLearnLogo from '../assets/Collablearn Logo.png';

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
      const response = await fetch('http://localhost:5001/api/auth/register', {
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
      const response = await fetch('http://localhost:5001/api/auth/google', {
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
    <div className="min-h-screen flex bg-white dark:bg-black transition-colors duration-300">
      {/* Left Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-24 relative">
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
            <span className="font-bold text-xl">C</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-xl tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">CollabLearn</span>
        </Link>

        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">Create Account</h1>
            <p className="text-gray-500 dark:text-zinc-400">Join the community and start building today.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-5 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-gray-900 dark:text-white transition-all shadow-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-5 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-gray-900 dark:text-white transition-all shadow-sm"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-5 pr-10 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-gray-900 dark:text-white transition-all shadow-sm"
                    placeholder="Min 6 chars"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Confirm</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-5 pr-10 py-3.5 bg-gray-50 dark:bg-zinc-900 border rounded-2xl focus:outline-none focus:ring-2 transition-all shadow-sm ${!passwordsMatch && confirmPassword
                      ? 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-gray-200 dark:border-zinc-800 focus:ring-indigo-500/50 focus:border-indigo-500 text-gray-900 dark:text-white'
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
              <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 bg-gray-50 dark:bg-zinc-900" />
              <span className="text-sm text-gray-500 dark:text-zinc-400">
                I agree to the <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</a>.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
                <div className="w-full border-t border-gray-200 dark:border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-black text-gray-400 dark:text-zinc-500 font-medium">Or join with</span>
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

          <p className="mt-8 text-center text-gray-500 dark:text-zinc-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline decoration-2 underline-offset-4 transition-all">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Decoration */}
      <div className="hidden lg:block w-1/2 bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-black/50 to-indigo-600/20 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>

        {/* Animated Background Elements */}
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/30 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px] animate-pulse delay-1000"></div>


        <div className="absolute inset-0 z-20 flex flex-col justify-center px-16 text-white">
          <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 w-fit">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-xs font-medium text-white/90">Join 10,000+ Builders</span>
          </div>
          <h2 className="text-5xl font-bold mb-6 leading-tight tracking-tight">Start your journey <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">today.</span></h2>
          <p className="text-zinc-400 text-xl leading-relaxed max-w-lg mb-12">
            "Joining CollabLearn was the best career decision I ever made. The mentors are world-class and the platform is incredibly easy to use."
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
              <span className="text-xs text-zinc-500">Community Platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
