import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LandingNavbar from '../../navbar/landingNavbar';
import { resolvePublicWebsiteEntry } from '../../navbar/navLinks.js';
import { hasStoredSession } from '../../utils/session.js';
import HeroSection from '../landing/HeroSection';
import FeaturesSection from '../landing/FeaturesSection';
import HowItWorksSection from '../landing/HowItWorksSection';
import SocialProofSection from '../landing/SocialProofSection';
import FaqSection from '../landing/FaqSection';
import TeachSection from '../landing/TeachSection';
import { footerLinks } from '../landing/landingData.js';

export default function CollabLearnLanding() {
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState(hasStoredSession);
  const [userRole, setUserRole] = useState(
    typeof localStorage === 'undefined' ? 'user' : localStorage.getItem('userRole')
  );
  const [isSuperAdmin, setIsSuperAdmin] = useState(
    typeof localStorage === 'undefined' ? false : localStorage.getItem('isSuperAdmin') === 'true'
  );

  useEffect(() => {
    const syncSession = () => {
      setHasSession(hasStoredSession());
      setUserRole(typeof localStorage === 'undefined' ? 'user' : localStorage.getItem('userRole'));
      setIsSuperAdmin(
        typeof localStorage === 'undefined'
          ? false
          : localStorage.getItem('isSuperAdmin') === 'true'
      );
    };

    window.addEventListener('storage', syncSession);
    window.addEventListener('profileUpdated', syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('profileUpdated', syncSession);
    };
  }, []);

  const publicEntry = resolvePublicWebsiteEntry({
    hasSession,
    userRole,
    isSuperAdmin,
  });

  return (
    <div className="dashboard-shell glass-page min-h-screen overflow-x-hidden text-slate-100 selection:bg-red-500/30">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-red-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>
      <LandingNavbar />

      <main id="main-content">
        <HeroSection hasSession={hasSession} userRole={userRole} isSuperAdmin={isSuperAdmin} />
        <FeaturesSection />
        <HowItWorksSection />
        <SocialProofSection />
        <FaqSection />
        <TeachSection
          hasSession={hasSession}
          userRole={userRole}
          isSuperAdmin={isSuperAdmin}
          publicEntry={publicEntry}
          navigate={navigate}
        />
      </main>

      <footer className="border-t border-white/8 bg-black/35 px-6 py-10" role="contentinfo">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-bold text-white">CollabLearn</p>
            <p className="mt-2 text-sm text-zinc-400">
              Structured skill learning, mentor sessions, and community accountability in one
              product.
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm font-semibold text-zinc-300">
            {footerLinks.map((link) =>
              link.href ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="transition-colors hover:text-red-300"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  className="transition-colors hover:text-red-300"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
