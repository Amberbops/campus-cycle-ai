import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Camera,
  Cpu,
  GitMerge,
  Recycle,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';

const STEPS = [
  {
    step: '01',
    label: 'Spot',
    tag: 'See what is left behind',
    desc: 'Point your phone camera at dormant dorm gear, study lamps, cables, or appliances to trigger instant scouting.',
    icon: Camera,
    color: 'teal',
    badge: 'Live Camera HUD',
    link: '/scan',
    linkLabel: 'Scan an Item',
  },
  {
    step: '02',
    label: 'Sort',
    tag: 'Read condition & path',
    desc: 'Multimodal vision classifies the item, evaluates wear, checks electrical safety, and selects reuse, repair, or recycle.',
    icon: Cpu,
    color: 'violet',
    badge: 'Gemini 2.5 Flash',
    backupNote: 'Bedrock failover backup',
    link: '/scan',
    linkLabel: 'Test Vision AI',
  },
  {
    step: '03',
    label: 'Route',
    tag: 'Find a nearby need',
    desc: 'Instantly cross-matches with real-time student demand wishlists across hostels to connect peers nearby.',
    icon: GitMerge,
    color: 'amber',
    badge: 'Wishlist Matching',
    link: '/demand',
    linkLabel: 'View Requests',
  },
  {
    step: '04',
    label: 'Return',
    tag: 'Keep value in motion',
    desc: 'Hand over to a campus peer or schedule certified e-waste bin dropoff, logging carbon diversion automatically.',
    icon: Recycle,
    color: 'emerald',
    badge: 'Zero-Waste Ledger',
    link: '/items',
    linkLabel: 'My Circular Items',
  },
];

export function FilmStrip() {
  return (
    <section className="relative overflow-hidden py-14 bg-slate-950/80 border-y border-slate-800/80" aria-label="CampusCycle circular process">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-300 mb-3">
            <Zap className="h-3.5 w-3.5" />
            The 4-Step Circular Loop
          </div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">
            From dorm clutter to campus resource
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
            A camera-first workflow transforming forgotten items into high-utility matches across residences.
          </p>
        </div>

        {/* 4 Cards Grid - Centered and Responsive */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isSort = step.label === 'Sort';

            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 backdrop-blur-md ${
                  isSort
                    ? 'border-teal-500/40 bg-gradient-to-b from-teal-950/20 via-slate-900/90 to-slate-950 shadow-[0_0_30px_rgba(45,212,191,0.12)]'
                    : 'border-slate-800/90 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90 shadow-lg'
                }`}
              >
                <div>
                  {/* Top Bar with Step ID and Glyph Icon */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    {/* Sci-fi Glyph Box */}
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-teal-500/30 bg-slate-950/80 shadow-inner group-hover:border-teal-400/60 transition-colors">
                      {/* Corner reticles */}
                      <span className="absolute -left-px -top-px h-2 w-2 border-l border-t border-teal-400" />
                      <span className="absolute -right-px -top-px h-2 w-2 border-r border-t border-teal-400" />
                      <span className="absolute -bottom-px -left-px h-2 w-2 border-b border-l border-teal-400" />
                      <span className="absolute -bottom-px -right-px h-2 w-2 border-b border-r border-teal-400" />
                      <Icon className="h-5 w-5 text-teal-300 group-hover:scale-110 transition-transform" />
                    </div>

                    <span className="text-xs font-mono font-bold tracking-widest text-slate-500 group-hover:text-teal-400 transition-colors">
                      {step.step}
                    </span>
                  </div>

                  {/* Title & Tag */}
                  <h3 className="text-lg font-black text-white group-hover:text-teal-300 transition-colors flex items-center gap-2">
                    {step.label}
                  </h3>
                  <p className="text-xs font-medium text-teal-400/90 mb-2">
                    {step.tag}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>

                  {/* Engine Tag for Sort */}
                  {isSort && (
                    <div className="mt-3 space-y-1 rounded-lg border border-teal-500/30 bg-teal-500/10 p-2 text-[11px]">
                      <div className="flex items-center gap-1.5 font-semibold text-teal-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
                        Google Gemini 2.5 Flash
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Primary scout AI · Bedrock standby backup
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Action Link */}
                <div className="mt-5 border-t border-slate-800/80 pt-3">
                  <Link
                    to={step.link}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-teal-300 transition-colors"
                  >
                    <span>{step.linkLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* AI Engine Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-teal-500/20 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-md"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Active Vision Engine: <span className="text-teal-400">Google Gemini 2.5 Flash</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time multimodal triage & safety scoring. AWS Bedrock is configured as a failover backup (model access unassigned by AWS).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.2)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal-400" />
              Gemini Vision Live
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-400">
              Bedrock Backup
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
