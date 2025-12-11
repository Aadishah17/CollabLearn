import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
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
      const response = await fetch('http://localhost:5000/api/auth/login', {
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
        setLoading(false); // Only stop loading on error, otherwise we navigate
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
      const response = await fetch('http://localhost:5000/api/auth/google', {
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

        // Dispatch custom event to update Navbar immediately
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
    <div className="min-h-screen flex bg-white dark:bg-slate-900 transition-colors duration-300">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-24 relative">
        <div className="absolute top-8 left-8 flex items-center gap-2">
          <img src={CollabLearnLogo} alt="Logo" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-gray-900 dark:text-white text-lg">CollabLearn</span>
        </div>

        <div className="max-w-md w-full mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Please enter your details to sign in.</p>

          {/* Role Toggle */}
          <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl mb-8">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${role === 'user'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${role === 'admin'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-gray-900 dark:text-white transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-gray-900 dark:text-white transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-gray-500">Remember me</span>
              </label>
              <button type="button" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast.error('Google Login Failed');
                }}
                useOneTap
                theme="filled_blue"
                shape="pill"
                text="signin_with"
                width="100%"
              />
            </div>
          </form>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 font-semibold hover:text-indigo-700">
              Create free account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Decoration */}
      <div className="hidden lg:block w-1/2 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-purple-600/90 z-10" />
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop"
          alt="Students collaborating"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-16 text-white">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20">
            <h2 className="text-3xl font-bold mb-4">Learn together, grow faster.</h2>
            <p className="text-indigo-100 text-lg leading-relaxed">
              "CollabLearn has completely transformed how I learn new skills. The community-driven approach makes mastering complex topics feel effortless."
            </p>
            <div className="mt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">A</div>
              <div>
                <div className="font-semibold">Alex Johnson</div>
                <div className="text-sm text-indigo-200">Full Stack Developer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;