import { Target } from 'lucide-react';
import { steps } from './landingData.js';

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-y border-white/8 bg-black/20 px-6 py-24"
      aria-label="How CollabLearn works"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="eyebrow">
            <Target size={14} className="text-red-300" aria-hidden="true" />
            How it works
          </div>
          <h2 className="section-title mt-6">
            From vague ambition to a plan you can actually follow.
          </h2>
          <p className="section-copy mt-5 max-w-xl">
            The value is not just the plan. The value is staying in motion after the first burst of
            motivation fades.
          </p>
        </div>

        <div className="space-y-5">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="surface-card glow-frame reveal-up p-6 md:p-7"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/12 text-lg font-black text-red-200"
                  aria-hidden="true"
                >
                  0{index + 1}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">{step.copy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
