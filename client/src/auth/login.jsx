import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import CollabLearnLogo from '../assets/Collablearn Logo.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.user.name);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userAvatar', data.user.avatar || '');
        localStorage.setItem('userRole', data.user.role);

        toast.success('Welcome back!');

        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(data.message || 'Login failed.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
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

        toast.success('Google Login Successful!');
        window.dispatchEvent(new Event('storage'));
        navigate('/dashboard');
      } else {
        toast.error(data.message || 'Google login failed.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-black transition-colors duration-300">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-24 relative">
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 group">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-200 dark:shadow-red-900/20">
            <span className="font-bold text-xl">C</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-xl tracking-tight group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">CollabLearn</span>
        </Link>

        <div className="max-w-md w-full mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 dark:text-zinc-400">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-5 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-gray-900 dark:text-white transition-all shadow-sm"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-5 pr-12 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-gray-900 dark:text-white transition-all shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-red-600 focus:ring-red-500 bg-gray-50 dark:bg-zinc-900" />
                <span className="text-sm text-gray-500 dark:text-zinc-400 group-hover:text-gray-700 dark:group-hover:text-zinc-300 transition-colors">Remember me</span>
              </label>
              <button type="button" className="text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-black text-gray-400 dark:text-zinc-500 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    toast.error('Google Login Failed');
                  }}
                  useOneTap
                  theme="outline"
                  shape="pill"
                  text="signin_with"
                  width="100%"
                />
              </div>
            </div>
          </form>

          <p className="mt-8 text-center text-gray-500 dark:text-zinc-400 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-red-600 dark:text-red-500 font-semibold hover:text-red-700 dark:hover:text-red-400 hover:underline decoration-2 underline-offset-4 transition-all">
              Create free account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Decoration */}
      <div className="hidden lg:block w-1/2 bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-black/50 to-black z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620912189865-1e8a33da4c5e?q=80&w=2669&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>

        {/* Subtle Background Accent */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[100px]"></div>

        <div className="absolute inset-0 z-20 flex flex-col justify-center px-16 text-white">
          <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 w-fit">
            <Sparkles size={14} className="text-red-400" />
            <span className="text-xs font-medium text-white/90">AI-Powered Collaboration</span>
          </div>
          <h2 className="text-5xl font-bold mb-6 leading-tight tracking-tight">Turn your ideas into <br /> <span className="text-gradient-red">reality.</span></h2>
          <p className="text-zinc-400 text-xl leading-relaxed max-w-lg mb-12">
            "The AI roadmap generator saved us weeks of planning. It felt like having a CTO in our pocket from day one."
          </p>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-xs font-bold ring-2 ring-white/10`}>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} className="w-full h-full rounded-full" alt="avatar" />
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white">500+ Projects</span>
              <span className="text-xs text-zinc-500">Built this month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
