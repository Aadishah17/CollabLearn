import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Users,
  Code,
  Box,
  FileText,
  Search,
  MessageSquare,
  ArrowRight,
  GitPullRequest,
  User
} from 'lucide-react';
import LandingNavbar from '../../navbar/landingNavbar';

export default function CollabLearnLanding() {
  const navigate = useNavigate();

  const handleStartLearning = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen glass-page transition-colors duration-200 text-slate-100 font-sans selection:bg-blue-500/30">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-24 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 z-10 relative">
          
          {/* Left Column - Copy */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-6xl md:text-8xl font-black mb-6 leading-[1.1] text-white tracking-tighter">
              Stop planning.<br />
              <span className="text-blue-500">Start building.</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Turn your project idea into a complete roadmap with AI. Get market research, architecture diagrams, and ready-to-use context files for AI coding agents.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start items-center">
              <button
                onClick={handleStartLearning}
                className="neo-btn text-lg"
              >
                Start Building Free <ArrowRight className="w-5 h-5 ml-1" />
              </button>
              <Link
                to="/login"
                className="px-8 py-3.5 text-slate-300 font-bold hover:text-white transition-colors"
              >
                Login to Workspace
              </Link>
            </div>
          </div>

          {/* Right Column - Visual Mockup */}
          <div className="flex-1 w-full max-w-2xl lg:max-w-none relative">
            <div className="glass-panel-strong rounded-2xl border border-slate-700/50 p-4 shadow-2xl shadow-blue-900/20 aspect-[4/3] flex flex-col overflow-hidden relative group">
                {/* Mockup Top Bar */}
                <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="mx-auto bg-black/40 px-6 py-1 rounded-md text-xs font-mono text-slate-500 border border-white/5">
                        CollabLearn / AI-Workspace
                    </div>
                </div>
                
                {/* Mockup Body */}
                <div className="flex-1 flex gap-4">
                    {/* Sidebar map */}
                    <div className="w-1/3 border-r border-white/5 pr-4 flex flex-col gap-3">
                        <div className="h-6 w-24 bg-blue-500/20 rounded animate-pulse"></div>
                        <div className="h-4 w-full bg-white/5 rounded"></div>
                        <div className="h-4 w-3/4 bg-white/5 rounded"></div>
                        <div className="h-4 w-5/6 bg-white/5 rounded"></div>
                    </div>
                    {/* Main area */}
                    <div className="flex-1 flex flex-col gap-4">
                         <div className="h-32 w-full bg-slate-900/80 rounded border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                             <div className="flex justify-between items-start">
                                 <div className="h-5 w-32 bg-slate-700/50 rounded"></div>
                                 <div className="h-5 w-16 bg-green-500/20 rounded"></div>
                             </div>
                             <div className="flex justify-between items-end">
                                 <div className="h-3 w-48 bg-slate-800 rounded"></div>
                                 <div className="flex -space-x-2">
                                     <div className="w-6 h-6 rounded-full bg-amber-500/50 border border-slate-900"></div>
                                     <div className="w-6 h-6 rounded-full bg-blue-500/50 border border-slate-900"></div>
                                 </div>
                             </div>
                         </div>

                         <div className="h-24 w-full bg-slate-900/50 rounded border border-white/5 p-4 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                             <div className="h-4 w-24 bg-slate-700/30 rounded mb-2"></div>
                             <div className="h-3 w-full bg-slate-800/50 rounded mb-1"></div>
                             <div className="h-3 w-2/3 bg-slate-800/50 rounded"></div>
                         </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Box Features */}
      <section className="px-6 py-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">One idea. <span className="text-blue-400">Everything you need.</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
            {/* Feature 1 */}
            <div className="glass-bento p-8 md:col-span-2 group">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Market Research & Validation</h3>
              <p className="text-slate-400 leading-relaxed max-w-lg">
                Let AI analyze your idea against current market trends. Get instant feedback on viability, target audience, and potential competitors before you write a single line of code.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-bento p-8 group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                <Box className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Architecture Diagrams</h3>
              <p className="text-slate-400 leading-relaxed">
                Automatically generate visual flowcharts and system architecture diagrams to map out your database and user flows.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-bento p-8 group">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                <FileText className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">AI Build Docs</h3>
              <p className="text-slate-400 leading-relaxed">
                Export comprehensive product requirements (PRDs) and task lists perfectly formatted for tools like Cursor, Windsurf, and Copilot.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-bento p-8 md:col-span-2 group relative overflow-hidden">
               <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-slate-900/80 to-transparent pointer-events-none z-10"></div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 border border-green-500/20 group-hover:bg-green-500/20 transition-colors relative z-20">
                <GitPullRequest className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 relative z-20">MCP Sync</h3>
              <p className="text-slate-400 leading-relaxed max-w-md relative z-20">
                Maintain a live connection between your project blueprint and your codebase. The Model Context Protocol ensures your AI agents always have the latest project context.
              </p>
              {/* Decorative Code Block */}
              <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 bg-black/50 border border-white/5 p-4 rounded-xl font-mono text-xs text-green-300 shadow-2xl z-0">
                  <pre>
                      <code>
                          {`// MCP Sync Active\nimport { sync } from '@mcp/core';\n\nsync.watch('./blueprint.md')\n  .on('update', (ctx) => {\n     agent.updateContext(ctx);\n  });`}
                      </code>
                  </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collaboration Section */}
      <section className="px-6 py-24 border-y border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Ideate with AI.<br /> Connect with teammates.<br /> Build together.
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              A shared workspace where humans design the architecture, and AI agents write the code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<User className="w-6 h-6 text-blue-400" />}
              title="Real-time Multiplayer"
              desc="Work on the same project blueprint concurrently with your team."
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6 text-purple-400" />}
              title="Collab AI Chat"
              desc="Brainstorm features and let AI draft the technical specifications."
            />
            <FeatureCard
              icon={<Code className="w-6 h-6 text-amber-400" />}
              title="Code Generation"
              desc="Export tasks directly into your IDE for rapid implementation."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-green-400" />}
              title="Role Management"
              desc="Assign tasks, review PRs, and manage project progress."
            />
          </div>
        </div>
      </section>

      {/* Call to Action Footer Area */}
      <section className="px-6 py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 glass-bento p-12 border-blue-500/20">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">
            Stop procrastinating. <br />
            <span className="text-blue-500">Start building.</span>
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Join the developers using CollabLearn to architect and launch products 10x faster with AI coding agents.
          </p>
          <div className="flex justify-center">
            <button
              onClick={handleStartLearning}
              className="neo-btn text-xl px-10 py-4"
            >
              <Zap className="w-6 h-6 fill-white" />
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white tracking-tight">CollabLearn</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-400 font-medium">
              <Link to="#" className="hover:text-blue-400 transition-colors">
                Product
              </Link>
              <Link to="#" className="hover:text-blue-400 transition-colors">
                Pricing
              </Link>
              <Link to="#" className="hover:text-blue-400 transition-colors">
                Docs
              </Link>
              <Link to="#" className="hover:text-blue-400 transition-colors">
                Privacy
              </Link>
            </div>
          </div>
          <div className="text-center text-sm text-slate-600 font-medium">© 2026 CollabLearn. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-colors group">
      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
