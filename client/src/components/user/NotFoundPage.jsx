import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Home } from 'lucide-react';

export default function NotFoundPage() {
  const hasSession = Boolean(localStorage.getItem('token'));

  return (
    <div className="glass-page flex min-h-screen items-center justify-center px-6 py-20">
      <div className="surface-card max-w-2xl p-8 md:p-12">
        <div className="eyebrow">
          <Compass size={16} />
          Route Not Found
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
          This page wandered off the roadmap.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300 md:text-lg">
          The link may be outdated, or the page was moved while the product evolved. Use one of the routes below to get back into the app.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to={hasSession ? '/dashboard' : '/'} className="glass-cta">
            <Home size={18} />
            {hasSession ? 'Open Dashboard' : 'Go Home'}
          </Link>
          <Link
            to={hasSession ? '/browse-skills' : '/login'}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-red-400/45 hover:bg-red-500/12"
          >
            <ArrowLeft size={18} />
            {hasSession ? 'Browse Skills' : 'Sign In'}
          </Link>
        </div>
      </div>
    </div>
  );
}
