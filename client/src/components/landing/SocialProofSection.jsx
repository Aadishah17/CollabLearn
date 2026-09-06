import { MessageSquareHeart, ShieldCheck, Sparkles } from 'lucide-react';
import { learnerQuotes, trustHighlights } from './landingData.js';

export default function SocialProofSection() {
  return (
    <section className="px-6 py-20" aria-label="Learner outcomes and trust">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="eyebrow">
            <ShieldCheck size={14} className="text-emerald-300" aria-hidden="true" />
            Built for real consistency
          </div>
          <h2 className="section-title mt-6">
            Outcomes come from staying in motion, not from collecting more tools.
          </h2>
          <p className="section-copy mt-5 max-w-2xl">
            CollabLearn keeps planning, support, and feedback close enough that you can protect
            momentum across the full learning cycle.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {trustHighlights.map((item, index) => (
            <div
              key={item.label}
              className="metric-rail reveal-up"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                {item.label}
              </p>
              <p className="mt-3 text-4xl font-black text-white">{item.value}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {learnerQuotes.map((item, index) => (
            <article
              key={item.author}
              className="glow-frame interactive-tile reveal-up rounded-[28px] border border-white/10 bg-white/[0.035] p-6"
              style={{ animationDelay: `${120 + index * 80}ms` }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <MessageSquareHeart size={16} className="text-red-300" aria-hidden="true" />
                Learner story
              </div>
              <p className="mt-4 text-base leading-7 text-zinc-200">"{item.quote}"</p>
              <div className="luminous-divider mt-6" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-white">{item.author}</p>
              <p className="mt-1 text-sm text-zinc-400">{item.role}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[24px] border border-white/10 bg-black/25 p-5 text-sm leading-7 text-zinc-300 md:p-6">
          <p className="inline-flex items-center gap-2 font-semibold text-zinc-200">
            <Sparkles size={14} className="text-blue-300" aria-hidden="true" />
            Why this matters
          </p>
          <p className="mt-3">
            Most learners do not fail because they cannot understand content. They fail when next
            actions are unclear or support is too far away. The product design keeps both close.
          </p>
        </div>
      </div>
    </section>
  );
}
