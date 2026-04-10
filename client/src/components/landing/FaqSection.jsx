import { HelpCircle } from 'lucide-react';
import { landingFaqs } from './landingData.js';

export default function FaqSection() {
  return (
    <section className="border-y border-white/8 bg-black/20 px-6 py-20" aria-label="Frequently asked questions">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="eyebrow">
            <HelpCircle size={14} className="text-blue-300" aria-hidden="true" />
            FAQ
          </div>
          <h2 className="section-title mt-6">Questions people ask before they commit to a learning system.</h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {landingFaqs.map((item, index) => (
            <details
              key={item.question}
              className="surface-card glow-frame reveal-up group rounded-[24px] p-5 md:p-6"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <summary className="cursor-pointer list-none pr-6 text-lg font-semibold text-white marker:content-none">
                {item.question}
              </summary>
              <p className="mt-4 text-sm leading-7 text-zinc-300">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
