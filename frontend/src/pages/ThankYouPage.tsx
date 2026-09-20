import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Heart,
  Home,
  Camera,
  ExternalLink,
  Award,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ConfettiBurst } from '../components/ui/ConfettiBurst';

export function ThankYouPage() {
  const [confettiKey, setConfettiKey] = useState(1);
  const [bananaBounces, setBananaBounces] = useState(0);

  useEffect(() => {
    // Trigger celebration confetti on mount
    setConfettiKey((k) => k + 1);
  }, []);

  const handleBananaClick = () => {
    setBananaBounces((b) => b + 1);
    setConfettiKey((k) => k + 1);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 pt-16 pb-20 text-slate-100 overflow-hidden flex flex-col items-center justify-center">
      <ConfettiBurst key={confettiKey} />

      {/* Cyberpunk ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[600px] rounded-full bg-gradient-to-tr from-teal-500/10 via-amber-500/10 to-purple-500/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Playful Nano Banana Mascot Pill */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-block mb-6"
        >
          <button
            onClick={handleBananaClick}
            title="Click the Nano Banana!"
            className="group inline-flex items-center gap-2.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/10 via-yellow-500/20 to-teal-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.25)] hover:border-amber-300 hover:shadow-[0_0_35px_rgba(251,191,36,0.45)] transition-all cursor-pointer"
          >
            <motion.span
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="text-xl inline-block"
            >
              🍌
            </motion.span>
            <span>Powered by Nano Banana</span>
            <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[10px] text-amber-200 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
              {bananaBounces > 0 ? `+${bananaBounces} Boost!` : 'Tap Me'}
            </span>
          </button>
        </motion.div>

        {/* Hero Thank You Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl font-black tracking-tight sm:text-6xl text-white"
        >
          Thank You for Watching!
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl mx-auto"
        >
          <span className="font-bold text-teal-300">CampusCycle AI</span> — Turning discarded dorm clutter into the starting point for reuse, repair, and campus community.
        </motion.p>

        {/* Team DrogonTech Showcase Card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 rounded-3xl border border-teal-500/30 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Corner Badge */}
          <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-1 text-[11px] font-semibold text-teal-300">
            <Award className="h-3.5 w-3.5" />
            WeMakeDevs Hackathon
          </div>

          <div className="mb-6 text-left">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
              Project Team
            </span>
            <h2 className="text-2xl font-black text-white flex items-center gap-2 mt-1">
              Team <span className="bg-gradient-to-r from-teal-300 to-amber-300 bg-clip-text text-transparent">DrogonTech</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Engineered with Gemini Vision AI, AWS Serverless Cloud, and Nano Banana energy 🍌
            </p>
          </div>

          {/* 2 Members Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Member 1: amber */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-left hover:border-teal-500/40 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-lg font-bold text-slate-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  A
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    amber
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <span className="text-amber-400 font-semibold">WeMakeDevs:</span> @amber
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cloud Architecture, Google Gemini 2.5 Flash Vision Pipeline, AWS DynamoDB & SES Email Dispatch integration.
              </p>
            </div>

            {/* Member 2: purplechiku25 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-left hover:border-teal-500/40 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-teal-400 text-lg font-bold text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                  P
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                    purplechiku25
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <span className="text-teal-400 font-semibold">WeMakeDevs:</span> @purplechiku25
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Frontend Engineering, Hyperspeed Three.js Road, Camera HUD Viewfinder & Cyberpunk UI/UX Experience.
              </p>
            </div>
          </div>

          {/* Technology Badges */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="rounded-md bg-teal-500/10 border border-teal-500/30 px-2.5 py-1 text-teal-300 font-medium">
              ⚡ Google Gemini 2.5 Flash
            </span>
            <span className="rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 font-medium">
              ☁️ AWS Lambda & DynamoDB
            </span>
            <span className="rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 font-medium">
              ✉️ Amazon SES Direct Mail
            </span>
            <span className="rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 font-medium">
              ⚛️ React 18 + Vite + Tailwind
            </span>
            <span className="rounded-md bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 text-amber-300 font-medium">
              🍌 Nano Banana
            </span>
          </div>
        </motion.div>

        {/* Quick Action Navigation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/">
            <Button variant="secondary" className="gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          <Link to="/scan">
            <Button variant="primary" className="gap-2 shadow-lg shadow-teal-500/20">
              <Camera className="h-4 w-4" />
              Try Live Scan
            </Button>
          </Link>

          <a
            href="https://github.com/purplechiku/campus-cycle-ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" className="gap-2 text-slate-300 hover:text-white">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub Repo
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        </motion.div>

        <p className="mt-8 text-xs text-slate-400 flex items-center justify-center gap-1">
          Built with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> by Team DrogonTech for WeMakeDevs
        </p>
      </div>
    </div>
  );
}
