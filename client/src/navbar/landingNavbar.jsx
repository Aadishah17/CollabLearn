import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../components/user/ThemeContext';
import logo from '../assets/react.svg'; // Ensure you have a logo image in the specified path

export default function LandingNavbar() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <nav className="bg-black border-b border-white h-20 transition-colors duration-200">
      <div className="flex justify-between items-center h-full px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          {/* 🔽 Replace src with your custom logo image */}
          <img
            src={logo}
            alt="CollabLearn Logo"
            className="w-12 h-12 rounded-xl object-cover"
          />
          <span className="text-2xl font-bold text-red-600 dark:text-red-500">CollabLearn</span>
        </div>



        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-600 dark:text-gray-300"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 transition font-medium">
            Sign In
          </Link>
          <Link to="/signup" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
