import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShieldAlert, UserCheck } from 'lucide-react';

export function SafetySection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-24 transition-colors duration-700"
      aria-labelledby="safety-heading"
    >
      {/* Amber background wash */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-slate-900 to-slate-900"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.2 }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-amber-500/3 blur-[60px]" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-20">

          {/* Left text */}
          <div className="flex-1 lg:max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-4">
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                Safety & Uncertainty
              </span>
              <h2
                id="safety-heading"
                className="mb-4 text-3xl font-black text-white sm:text-4xl"
              >
                Safe uncertainty over confident guesses
              </h2>
              <p className="mb-6 text-slate-400 leading-relaxed">
                When AI confidence is low or a potentially hazardous item is
                detected, CampusCycle AI doesn't guess — it escalates. The
                system explicitly marks low-confidence items and routes them
                to a human moderator for safe, authorized handling.
              </p>

              <ul className="space-y-3" role="list">
                {[
                  'Low confidence threshold: items below 50% confidence are always flagged',
                  'Hazardous keywords trigger immediate manual review routing',
                  'Safety notes are always shown when electrical verification is impossible',
                  'Authorized disposal team is notified for chemicals and e-waste',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <UserCheck className="h-3 w-3 text-amber-400" aria-hidden="true" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Right: Phone with hazard stamp */}
          <div className="relative flex-shrink-0" aria-hidden="true">
            <div className="relative h-[440px] w-[220px] rounded-[38px] border-2 border-amber-700/40 bg-slate-800 shadow-2xl shadow-black/60">
              <div className="absolute inset-x-0 top-0 flex justify-center pt-3">
                <div className="h-1.5 w-16 rounded-full bg-slate-700" />
              </div>
              {/* Screen */}
              <div className="absolute inset-x-[3px] top-8 bottom-3 overflow-hidden rounded-[32px] bg-slate-900">
                {/* Unknown item */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-amber-950/30 to-slate-900 p-4">
                  <div className="mb-3 h-20 w-20 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 flex items-center justify-center">
                    <ShieldAlert className="h-8 w-8 text-amber-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mb-1 text-center">Unknown Chemical Container</p>
                  <p className="text-[9px] text-amber-400/70 text-center">Confidence: 31%</p>
                </div>

                {/* MANUAL REVIEW stamp */}
                <motion.div
                  initial={{ scale: 0, rotate: -20, opacity: 0 }}
                  animate={inView ? { scale: 1, rotate: -10, opacity: 1 } : {}}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 20,
                    delay: 0.4,
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="rounded-lg border-4 border-amber-500 px-4 py-2 bg-amber-500/10">
                    <p className="text-center font-black tracking-widest text-amber-400 text-[11px] uppercase leading-tight">
                      Manual<br />Review
                    </p>
                  </div>
                </motion.div>

                {/* Authorized disposal badge */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={inView ? { y: 0, opacity: 1 } : {}}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="absolute bottom-3 left-2 right-2 rounded-lg bg-slate-800 border border-amber-700/40 p-2"
                >
                  <p className="text-[8px] text-amber-400/80 text-center">
                    🚨 Routed to authorized disposal team
                  </p>
                </motion.div>
              </div>
            </div>
            {/* Amber glow */}
            <div className="absolute -inset-6 -z-10 rounded-[60px] bg-amber-500/10 blur-3xl" />
          </div>

        </div>
      </div>
    </section>
  );
}
