import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Loader2, CheckCircle, XCircle } from 'lucide-react';
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
      const response = await fetch('http://localhost:5000/api/auth/register', {
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
    <div className="min-h-screen flex bg-white dark:bg-slate-900 transition-colors duration-300">
      {/* Left Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-24 relative">
        <div className="absolute top-8 left-8 flex items-center gap-2">
          <img src={CollabLearnLogo} alt="Logo" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-gray-900 dark:text-white text-lg">CollabLearn</span>
        </div>

        <div className="max-w-md w-full mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Join the community and start learning today.</p>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-gray-900 dark:text-white transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

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
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="Min 6 chars"
                    required
                    minLength={6}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:ring-2 transition-all ${!passwordsMatch && confirmPassword
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-gray-900 dark:text-white'
                      }`}
                    placeholder="Confirm"
                    required
                  />
                  {confirmPassword && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {passwordsMatch ? (
                        <CheckCircle size={18} className="text-green-500" />
                      ) : (
                        <XCircle size={18} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 mt-2">
              <input type="checkbox" required className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-500">
                I agree to the <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400">Or join with</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast.error('Google Signup Failed');
                }}
                useOneTap
                theme="filled_blue"
                shape="pill"
                text="signup_with"
                width="100%"
              />
            </div>
          </form>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Decoration */}
      <div className="hidden lg:block w-1/2 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-indigo-600/90 z-10" />
        <img
          src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2670&auto=format&fit=crop"
          alt="Team working"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-16 text-white">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20">
            <h2 className="text-3xl font-bold mb-4">Start your journey today.</h2>
            <p className="text-indigo-100 text-lg leading-relaxed">
              "Joining CollabLearn was the best career decision I ever made. The mentors are world-class and the platform is incredibly easy to use."
            </p>
            <div className="mt-6 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-white opacity-80" />
              ))}
              <span className="ml-2 text-sm text-indigo-200">Trusted by 10,000+ students</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;