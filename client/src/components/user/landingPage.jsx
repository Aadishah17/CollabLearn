import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Users,
  Rocket,
  Brain,
  Search,
  Target,
  Layout,
  MessageSquare,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import LandingNavbar from '../../navbar/landingNavbar';

export default function CollabLearnLanding() {
  const [goal, setGoal] = useState('');
  const navigate = useNavigate();

  const handleStartLearning = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen glass-page transition-colors duration-200 text-zinc-100">
      <LandingNavbar />

      <section className="relative px-6 pt-28 pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/30 rounded-full blur-[80px] -z-10"></div>

        <div className="max-w-6xl mx-auto text-center z-10">
          <div className="glass-chip mb-8 px-4 py-2 text-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI-guided skill learning</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white tracking-tight">
            Learn any skill with a <br className="hidden md:block" />
            <span className="text-gradient-red">personal AI roadmap</span>
          </h1>

          <p className="text-xl text-zinc-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            CollabLearn helps you go from confusion to clarity. Set your goal, get a structured plan, and
            practice with AI guidance, resources, and mentor support.
          </p>

          <div className="max-w-2xl mx-auto glass-panel p-2">
            <div className="relative">
              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="What do you want to learn? Example: 'I want to become confident in React interviews in 8 weeks.'"
                className="w-full px-6 py-4 bg-transparent text-zinc-100 placeholder-zinc-400 focus:outline-none resize-none min-h-[80px]"
              />
              <div className="flex justify-between items-center px-4 pb-2">
                <span className="glass-chip text-[11px]">
                  Personalized weekly study plan
                </span>
                <button
                  onClick={handleStartLearning}
                  className="glass-cta px-6 py-3"
                >
                  Start Learning <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-100 mb-6">How CollabLearn Works</h2>
            <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
              A practical system built for real learning outcomes, not generic content overload.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="relative z-10">
              <div className="glass-panel rounded-3xl p-8 h-full hover:border-red-500/35 transition-colors">
                <div className="w-16 h-16 bg-red-500/15 rounded-2xl flex items-center justify-center mb-8">
                  <Brain className="w-8 h-8 text-red-600 dark:text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-100 mb-4">1. Define your goal</h3>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-red-600 dark:text-red-500 mb-3">
                  Skill, Level, Timeline
                </h4>
                <p className="text-zinc-300 leading-relaxed">
                  Share what you want to learn, your current level, and available weekly time. The AI adapts the
                  roadmap to your constraints.
                </p>
              </div>
            </div>

            <div className="relative z-10">
              <div className="glass-panel rounded-3xl p-8 h-full hover:border-red-500/35 transition-colors">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
                  <Layout className="w-8 h-8 text-zinc-100" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-100 mb-4">2. Follow your roadmap</h3>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 mb-3">
                  Weekly Milestones
                </h4>
                <p className="text-zinc-300 leading-relaxed">
                  Get step-by-step modules, project tasks, and checkpoints. Track progress over time and stay focused
                  on what matters most.
                </p>
              </div>
            </div>

            <div className="relative z-10">
              <div className="glass-panel rounded-3xl p-8 h-full hover:border-red-500/35 transition-colors">
                <div className="w-16 h-16 bg-red-500/15 rounded-2xl flex items-center justify-center mb-8">
                  <Rocket className="w-8 h-8 text-red-600 dark:text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-100 mb-4">3. Practice and level up</h3>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-red-600 dark:text-red-500 mb-3">
                  Real Outcomes
                </h4>
                <p className="text-zinc-300 leading-relaxed">
                  Use curated resources, community support, and mentor sessions to build confidence and ship work that
                  proves your skill.
                </p>
              </div>
            </div>

            <div className="hidden md:block absolute top-[15%] left-0 w-full h-0.5 border-t-2 border-dashed border-white/20 z-0"></div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-100 mb-6">
              Built for serious learners
            </h2>
            <p className="text-xl text-zinc-300">
              Everything you need to learn faster with direction, structure, and accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Target className="w-6 h-6 text-red-600" />}
              title="Personalized Paths"
              desc="AI plans tailored to your level, schedule, and target outcome."
              color="bg-red-50 dark:bg-red-900/10"
            />
            <FeatureCard
              icon={<Layout className="w-6 h-6 text-red-600" />}
              title="Milestone Tracking"
              desc="Clear checkpoints and completion tracking for each learning module."
              color="bg-red-50 dark:bg-red-900/10"
            />
            <FeatureCard
              icon={<Search className="w-6 h-6 text-zinc-900 dark:text-white" />}
              title="Curated Resources"
              desc="High-quality docs, courses, and practice links for every stage."
              color="bg-zinc-100 dark:bg-zinc-800"
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6 text-zinc-900 dark:text-white" />}
              title="AI Mentor Chat"
              desc="Get study help, troubleshooting, and roadmap updates on demand."
              color="bg-zinc-100 dark:bg-zinc-800"
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-600/10 blur-[80px] rounded-full"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 glass-panel p-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
            Stop guessing what to learn. <br />
            <span className="text-gradient-red">Start improving every week.</span>
          </h2>
          <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
            Join CollabLearn and build the exact skills you want with an AI roadmap and focused execution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="glass-cta px-8 py-4 text-lg"
            >
              <Zap className="w-5 h-5 fill-white" />
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-white/7 text-white rounded-xl font-bold text-lg hover:bg-white/12 transition border border-white/15"
            >
              Continue Learning
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-6 py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-zinc-100">CollabLearn</span>
            </div>
            <div className="flex gap-8 text-sm text-zinc-400">
              <Link to="#" className="hover:text-white transition">
                Pricing
              </Link>
              <Link to="#" className="hover:text-white transition">
                Terms
              </Link>
              <Link to="#" className="hover:text-white transition">
                Privacy
              </Link>
            </div>
          </div>
          <div className="text-center text-sm text-zinc-500">(c) 2026 CollabLearn. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color }) {
  return (
    <div className="p-6 rounded-2xl glass-panel hover:border-red-500/35 transition-colors">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>{icon}</div>
      <h3 className="text-lg font-bold text-zinc-100 mb-2">{title}</h3>
      <p className="text-sm text-zinc-300 leading-relaxed">{desc}</p>
    </div>
  );
}
