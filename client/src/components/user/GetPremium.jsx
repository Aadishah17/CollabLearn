import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Video,
  ArrowRight,
  Star,
  Users,
  Calendar,
} from 'lucide-react';
import MainNavbar from '../../navbar/mainNavbar';

export default function GetPremium() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('annual'); // 'annual' or 'monthly'

  const pricing = {
    monthly: { price: '₹499', period: '/month', billingNote: 'Billed monthly, cancel anytime' },
    annual: { price: '₹399', period: '/month', billingNote: '₹4,788 billed annually (Save 20%)' },
  };

  const currentPrice = pricing[billingCycle];

  return (
    <div className="glass-page min-h-screen text-zinc-100 font-sans">
      <MainNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        {/* Top Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="eyebrow mx-auto justify-center mb-3">
            <Crown size={14} className="text-amber-400" />
            Membership Acceleration
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Accelerate Your Learning Velocity
          </h1>
          <p className="mt-4 text-zinc-300 text-sm sm:text-base leading-relaxed">
            Unlock priority mentor sessions, full-featured AI Learning Studio generation, in-browser
            video calls, and verified badges.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl mt-8">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white/15 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-black/40 text-amber-200">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto mb-14">
          {/* Free Tier */}
          <div className="surface-card card-spotlight p-8 rounded-3xl flex flex-col justify-between border-white/10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Basic Tier
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-zinc-300">
                  Default Plan
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Free Standard</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Core skill roadmaps, community discussions, and standard session bookings at your
                own pace.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-white">₹0</span>
                <span className="text-xs text-zinc-400">/forever</span>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10">
                {[
                  'Personalized basic roadmap generation',
                  'Standard skill marketplace browsing',
                  'Participate in community discussions',
                  'Standard asynchronous messaging',
                  'Access to public interactive modules',
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <CheckCircle2 size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mt-8 w-full py-3 rounded-2xl border border-white/15 bg-white/[0.04] text-sm font-semibold text-zinc-200 hover:bg-white/[0.08] transition-colors"
            >
              Continue Free
            </button>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="surface-card p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden border-2 border-amber-500/40 shadow-2xl shadow-amber-500/10">
            <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-amber-400/15 blur-[70px]" />
            <div className="pointer-events-none absolute -left-8 -bottom-8 h-44 w-44 rounded-full bg-red-500/15 blur-[70px]" />

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Crown size={14} />
                  Pro Accelerator
                </span>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 shadow-md shadow-amber-500/30">
                  RECOMMENDED
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">CollabLearn Pro</h3>
              <p className="text-xs text-zinc-300 leading-relaxed mb-6">
                For ambitious developers and creators demanding priority coaching, live calls, and
                AI accelerators.
              </p>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-black text-white">{currentPrice.price}</span>
                <span className="text-xs text-zinc-400">{currentPrice.period}</span>
              </div>
              <p className="text-[11px] text-amber-400/90 font-medium mb-6">
                {currentPrice.billingNote}
              </p>

              <div className="space-y-3 pt-6 border-t border-white/10">
                {[
                  'Priority booking with verified 5.0 instructors',
                  'In-browser WebRTC 1v1 video & audio rooms',
                  'Full AI Studio: quizzes, mind maps, and slides',
                  'Interactive AI Learning Mentor (unlimited)',
                  'Verified Pro Scholar badge across profile & forums',
                  'Private mentorship notes & shared code repository',
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-xs text-zinc-100 font-medium"
                  >
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/payment')}
              className="relative mt-8 w-full glass-cta justify-center py-3.5 text-sm font-bold shadow-xl shadow-red-950/50 flex items-center gap-2"
            >
              <span>Upgrade to Pro</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Feature Grid Spotlight */}
        <div className="surface-card card-spotlight p-8 rounded-3xl max-w-4xl mx-auto">
          <h3 className="text-lg font-bold text-white mb-6 text-center">
            Every Pro Membership Includes
          </h3>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 bg-red-500/10 border border-red-400/25 flex items-center justify-center text-red-300">
                <Video size={22} />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Integrated Video Calling</h4>
              <p className="text-xs text-zinc-400">
                High-definition WebRTC video conferencing built into mentorship sessions.
              </p>
            </div>

            <div className="p-4">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 bg-amber-500/10 border border-amber-400/25 flex items-center justify-center text-amber-300">
                <Sparkles size={22} />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">AI Studio Synthesis</h4>
              <p className="text-xs text-zinc-400">
                Automatically synthesize mind maps, quiz cards, and study flashcards.
              </p>
            </div>

            <div className="p-4">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 bg-blue-500/10 border border-blue-400/25 flex items-center justify-center text-blue-300">
                <ShieldCheck size={22} />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Guaranteed Priority</h4>
              <p className="text-xs text-zinc-400">
                Skip the queue when booking sessions with high-demand mentors.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
