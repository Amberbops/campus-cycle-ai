import { HeroSection } from '../components/hero/HeroSection';
import { StickyScrollJourney } from '../components/journey/StickyScrollJourney';
import { SafetySection } from '../components/safety/SafetySection';
import { AdminArchSection } from '../components/admin/AdminArchSection';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { FilmStrip } from '../components/hero/FilmStrip';

export function LandingPage() {
  return (
    <main>
      {/* 1. Hero */}
      <HeroSection />

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" aria-hidden="true" />

      <FilmStrip />

      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" aria-hidden="true" />

      {/* 2. Core Journey (sticky scroll) */}
      <ScrollReveal>
        <StickyScrollJourney />
      </ScrollReveal>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" aria-hidden="true" />

      {/* 3. Safety section */}
      <ScrollReveal>
        <SafetySection />
      </ScrollReveal>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" aria-hidden="true" />

      {/* 4. Admin + Architecture */}
      <ScrollReveal>
        <AdminArchSection />
      </ScrollReveal>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center">
        <p className="text-xs text-slate-500">
          CampusCycle AI · Powered by{' '}
          <span className="text-teal-400 font-semibold">Google Gemini 2.5 Flash</span> · Bedrock Standby Backup
        </p>
      </footer>
    </main>
  );
}
