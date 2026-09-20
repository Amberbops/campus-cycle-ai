import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Camera, Cpu, Users } from 'lucide-react';
import { RecommendationBadge, ConditionBadge } from '../ui/Badge';

const STEPS = [
  {
    id: 0,
    icon: Camera,
    label: '01 · Capture',
    title: 'Point. Snap. Done.',
    description:
      'The camera image is the trigger for AI-assisted triage. No forms, no manual classification — just point your phone at the item.',
    accentColor: 'teal',
  },
  {
    id: 1,
    icon: Cpu,
    label: '02 · AI Triage',
    title: 'Multimodal Vision Reasoning',
    description:
      'Google Gemini 2.5 Flash analyzes condition, identifies item category, and determines the optimal circular path — with AWS Bedrock configured as a standby backup.',
    accentColor: 'violet',
  },
  {
    id: 2,
    icon: Users,
    label: '03 · Match',
    title: 'Local demand, found instantly',
    description:
      'The system searches campus demand records for compatible requests. Match cards pop in sorted by compatibility score and urgency.',
    accentColor: 'teal',
  },
];

function PhoneStep({ step }: { step: number }) {
  // Render different phone screen content per step
  if (step === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
        <div className="mb-2 h-28 w-28 rounded-2xl border-2 border-dashed border-teal-400/60 bg-teal-500/5 flex flex-col items-center justify-center">
          <Camera className="h-10 w-10 text-teal-400/60 mb-1" />
          <span className="text-[9px] text-teal-400/60">Fan detected</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-2">Analyzing…</p>
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400/70 to-transparent"
          animate={{ top: ['25%', '75%', '25%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <div className="h-7 w-7 rounded-full border-2 border-teal-400 bg-teal-500/20" />
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-slate-900">
        {/* Blurred image bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 opacity-50" />
        {/* AI card slides up */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-slate-800 border-t border-slate-700 p-3"
        >
          <p className="text-[9px] text-slate-500 mb-1.5 uppercase tracking-wider">AI Result</p>
          <p className="text-[12px] font-bold text-white mb-1">Table Fan (Oscillating)</p>
          <div className="flex flex-wrap gap-1 mb-2">
            <ConditionBadge condition="fair" className="text-[9px] px-1.5 py-0.5" />
            <RecommendationBadge type="REPAIR" className="text-[9px] px-1.5 py-0.5" />
          </div>
          <p className="text-[9px] text-amber-400/80">
            ⚠ Electrical function unverified from image
          </p>
          {/* Confidence bar */}
          <div className="mt-2">
            <div className="flex justify-between text-[8px] text-slate-500 mb-0.5">
              <span>Confidence</span><span>82%</span>
            </div>
            <div className="h-1 rounded-full bg-slate-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '82%' }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400"
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Step 2 — Match cards
  const matches = [
    { name: 'Priya S.', room: 'Block C · R214', score: 94, urgency: 'high' },
    { name: 'Rahul M.', room: 'Block A · R108', score: 87, urgency: 'medium' },
    { name: 'Hostel Maint.', room: 'Admin Block', score: 71, urgency: 'low' },
  ];

  const urgencyColor: Record<string, string> = {
    high: 'text-red-400',
    medium: 'text-amber-400',
    low: 'text-teal-400',
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-900 p-2 pt-3">
      <p className="text-[9px] text-slate-500 mb-2 uppercase tracking-wider text-center">
        {matches.length} Matches Found
      </p>
      <div className="space-y-1.5">
        {matches.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 + 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 p-1.5"
          >
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
              {m.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold text-white truncate">{m.name}</p>
              <p className="text-[8px] text-slate-500 truncate">{m.room}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] font-bold text-teal-400">{m.score}%</p>
              <p className={`text-[7px] capitalize ${urgencyColor[m.urgency]}`}>{m.urgency}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function StickyScrollJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Map scroll progress to step index
  const stepProgress = useTransform(scrollYProgress, [0, 0.33, 0.66, 1], [0, 1, 2, 2]);

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: '300vh' }}
      aria-label="Core user journey"
    >
      {/* Sticky container */}
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">

            {/* Left: Text steps */}
            <div className="flex-1 space-y-0 lg:max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
                  <span className="h-px w-8 bg-violet-400" aria-hidden="true" />
                  The Core Journey
                </span>
                <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                  Three steps to circular
                </h2>
              </div>

              {STEPS.map((step, i) => (
                <motion.div
                  key={step.id}
                  style={{
                    opacity: useTransform(
                      stepProgress,
                      [i - 0.5, i, i + 0.5],
                      [0.3, 1, 0.3]
                    ),
                  }}
                  className="relative flex gap-4 py-6"
                >
                  <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    step.accentColor === 'violet' ? 'bg-violet-500/20 text-violet-400' : 'bg-teal-500/20 text-teal-400'
                  }`}>
                    <step.icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className={`mb-1 text-xs font-bold uppercase tracking-widest ${
                      step.accentColor === 'violet' ? 'text-violet-400' : 'text-teal-400'
                    }`}>{step.label}</p>
                    <h3 className="mb-2 text-lg font-bold text-white">{step.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right: Phone frame */}
            <div className="relative flex-shrink-0" aria-hidden="true">
              <div className="relative h-[520px] w-[250px] rounded-[40px] border-2 border-slate-600 bg-slate-800 shadow-2xl shadow-black/60">
                {/* Notch */}
                <div className="absolute inset-x-0 top-0 flex justify-center pt-3">
                  <div className="h-1.5 w-20 rounded-full bg-slate-700" />
                </div>
                {/* Screen */}
                <div className="absolute inset-x-[3px] top-8 bottom-3 overflow-hidden rounded-[35px] bg-slate-900">
                  {STEPS.map((step) => (
                    <motion.div
                      key={step.id}
                      style={{
                        opacity: useTransform(
                          stepProgress,
                          [step.id - 0.3, step.id, step.id + 0.3],
                          [0, 1, 0]
                        ),
                      }}
                      className="absolute inset-0"
                    >
                      <PhoneStep step={step.id} />
                    </motion.div>
                  ))}
                </div>
                {/* Volume buttons */}
                <div className="absolute -left-1 top-20 h-6 w-1 rounded-l-full bg-slate-600" />
                <div className="absolute -left-1 top-28 h-6 w-1 rounded-l-full bg-slate-600" />
                {/* Power button */}
                <div className="absolute -right-1 top-24 h-8 w-1 rounded-r-full bg-slate-600" />
              </div>
              {/* Glow behind phone */}
              <div className="absolute -inset-6 -z-10 rounded-[60px] bg-teal-500/8 blur-3xl" />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
