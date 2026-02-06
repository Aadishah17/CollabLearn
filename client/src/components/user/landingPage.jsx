import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap, Users, Rocket, Brain, Search, Target, Layout,
  MessageSquare, CheckCircle, ArrowRight, Sparkles
} from 'lucide-react';
import LandingNavbar from '../../navbar/landingNavbar';

export default function CollabLearnLanding() {
  const [idea, setIdea] = useState('');
  const navigate = useNavigate();

  const handleStartProject = () => {
    // In a real implementation, you might pass this idea to the signup/onboarding flow
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-200">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 overflow-hidden">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/30 rounded-full blur-[80px] -z-10"></div>

        <div className="max-w-6xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-300 text-sm font-medium border border-zinc-200 dark:border-zinc-700">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Turn Ideas into Reality, Together</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-zinc-900 dark:text-white tracking-tight">
            Go From idea to <br className="hidden md:block" />
            <span className="text-gradient-red">
              researched roadmap
            </span>{' '}
            in minutes
          </h1>

          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Your place to research, plan, visualize and build your idea all in one place.
            Connect with an AI co-pilot and a community of builders.
          </p>

          <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 p-2 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
            <div className="relative">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe your idea... e.g., 'An app connecting local farmers directly to restaurants using AI for demand forecasting.'"
                className="w-full px-6 py-4 bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none resize-none min-h-[80px]"
              />
              <div className="flex justify-between items-center px-4 pb-2">
                <span className="text-xs text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                  AI-Powered Analysis
                </span>
                <button
                  onClick={handleStartProject}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  Start Project <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-24 bg-zinc-50 dark:bg-zinc-950 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-6">
              How It Works
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Turn your idea into reality in three simple steps. Our platform makes collaboration seamless and intelligent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="relative z-10">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 h-full shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-8">
                  <Brain className="w-8 h-8 text-red-600 dark:text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                  1. Plan with AI
                </h3>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-red-600 dark:text-red-500 mb-3">
                  From Spark to Strategy
                </h4>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Describe your idea in plain English. Our AI co-pilot will research market trends,
                  visualize your architecture, and generate a structured, actionable roadmap.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative z-10">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 h-full shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-8">
                  <Users className="w-8 h-8 text-zinc-900 dark:text-white" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                  2. Find Your Crew
                </h3>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-3">
                  Build Your Team
                </h4>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Your AI-generated plan automatically identifies the skills you need.
                  Use our platform to discover and connect with skilled collaborators who are ready to build.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative z-10">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 h-full shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-8">
                  <Rocket className="w-8 h-8 text-red-600 dark:text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                  3. Build Together
                </h3>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-red-600 dark:text-red-500 mb-3">
                  Launch Your Workspace
                </h4>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Instantly convert your plan into a shared project with chat, tasks, and tools.
                  Your entire team, powered by an AI assistant, in one place.
                </p>
              </div>
            </div>

            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-[15%] left-0 w-full h-0.5 border-t-2 border-dashed border-zinc-300 dark:border-zinc-700 z-0"></div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-6">
              AI-Powered Features
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Go beyond generic chatbots. Our trained strategist helps you analyze, plan, and build.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Target className="w-6 h-6 text-red-600" />}
              title="Scope Analysis"
              desc="Define project boundaries clearly before you start."
              color="bg-red-50 dark:bg-red-900/10"
            />
            <FeatureCard
              icon={<Layout className="w-6 h-6 text-red-600" />}
              title="MVP Proposals"
              desc="Get feasible first-version plans automatically."
              color="bg-red-50 dark:bg-red-900/10"
            />
            <FeatureCard
              icon={<Search className="w-6 h-6 text-zinc-900 dark:text-white" />}
              title="Smart Matching"
              desc="AI recommends the perfect teammates for your tech stack."
              color="bg-zinc-100 dark:bg-zinc-800"
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6 text-zinc-900 dark:text-white" />}
              title="Contextual AI"
              desc="An assistant that knows your entire project history."
              color="bg-zinc-100 dark:bg-zinc-800"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-32 bg-zinc-900 dark:bg-black relative overflow-hidden">
        {/* Subtle Accent */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-600/10 blur-[80px] rounded-full"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
            Stop Procrastinating. <br />
            <span className="text-gradient-red">
              Start Building.
            </span>
          </h2>
          <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
            Your next great idea is one plan away. Join builders transforming ideas into reality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 fill-white" />
              Start Your Project
            </Link>
            <Link
              to="/community"
              className="px-8 py-4 bg-zinc-800 text-white rounded-xl font-bold text-lg hover:bg-zinc-700 transition border border-zinc-700"
            >
              Explore Collabs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-zinc-50 dark:bg-black border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">CollabLearn</span>
            </div>
            <div className="flex gap-8 text-sm text-zinc-600 dark:text-zinc-400">
              <Link to="#" className="hover:text-black dark:hover:text-white transition">Pricing</Link>
              <Link to="#" className="hover:text-black dark:hover:text-white transition">Terms</Link>
              <Link to="#" className="hover:text-black dark:hover:text-white transition">Privacy</Link>
            </div>
          </div>
          <div className="text-center text-sm text-zinc-500 dark:text-zinc-600">
            © 2024 CollabLearn. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color }) {
  return (
    <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
