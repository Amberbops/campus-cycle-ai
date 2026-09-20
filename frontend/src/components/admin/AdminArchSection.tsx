import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LayoutDashboard, ArrowRight, Layers, Zap, Database, Cloud } from 'lucide-react';
import { Button } from '../ui/Button';

const METRICS = [
  { label: 'Pending Items', value: '23', color: 'text-teal-400' },
  { label: 'Flagged Hazardous', value: '4', color: 'text-amber-400' },
  { label: 'Matched Today', value: '11', color: 'text-violet-400' },
  { label: 'Diverted This Week', value: '67', color: 'text-teal-400' },
];

const ARCH_NODES = [
  {
    id: 'ui',
    label: 'Student UI',
    sub: 'Amplify Hosting',
    icon: Layers,
    col: 0,
    color: 'teal',
  },
  {
    id: 'api',
    label: 'API Layer',
    sub: 'API Gateway + Lambda',
    icon: Zap,
    col: 1,
    color: 'violet',
  },
  {
    id: 'ai',
    label: 'Vision & Reasoning AI',
    sub: 'Gemini 2.5 (Bedrock Backup)',
    icon: Cloud,
    col: 2,
    color: 'teal',
  },
  {
    id: 'db',
    label: 'Campus Store',
    sub: 'DynamoDB + S3',
    icon: Database,
    col: 3,
    color: 'teal',
  },
];

export function AdminArchSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      className="py-24 overflow-hidden"
      aria-labelledby="admin-arch-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-400 mb-3">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Admin & Architecture
          </span>
          <h2
            id="admin-arch-heading"
            className="text-3xl font-black text-white sm:text-4xl"
          >
            Dual-Cloud Resilient Architecture
          </h2>
        </motion.div>

        {/* Desktop mockup sliding in */}
        <motion.div
          initial={{ x: 120, opacity: 0 }}
          animate={inView ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="mb-16 rounded-2xl border border-slate-700 bg-slate-800/60 overflow-hidden shadow-2xl"
          aria-label="Admin dashboard preview"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-3 bg-slate-900">
            <div className="flex gap-1.5" aria-hidden="true">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-amber-500/60" />
              <div className="h-3 w-3 rounded-full bg-teal-500/60" />
            </div>
            <div className="flex-1 mx-4 rounded-lg bg-slate-800 px-3 py-1 text-[10px] text-slate-500">
              campuscycle.aws.edu/admin
            </div>
          </div>

          {/* Dashboard content */}
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Impact Dashboard</h3>
              <Link to="/admin">
                <Button size="sm" variant="secondary" className="text-xs gap-1">
                  Open Dashboard <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
              {METRICS.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-3"
                >
                  <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Mini bar chart */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <p className="text-xs font-semibold text-slate-400 mb-3">Items Diverted — Last 8 Weeks</p>
              <div className="flex items-end gap-2 h-20">
                {[28, 45, 39, 67, 82, 91, 78, 112].map((v, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-teal-600 to-teal-400"
                    initial={{ height: 0 }}
                    animate={inView ? { height: `${(v / 112) * 100}%` } : { height: 0 }}
                    transition={{ delay: 0.6 + i * 0.07, duration: 0.5, ease: 'easeOut' }}
                    aria-label={`Week ${i + 1}: ${v} items`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'].map((w) => (
                  <span key={w} className="flex-1 text-center text-[9px] text-slate-600">{w}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* AWS Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
            System Reference Architecture (Gemini Vision AI + Cloud Store)
          </p>

          <div className="flex items-center justify-center gap-0 overflow-x-auto pb-2">
            {ARCH_NODES.map((node, i) => (
              <div key={node.id} className="flex items-center">
                {/* Node */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.7 + i * 0.15, type: 'spring', stiffness: 200 }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border min-w-[120px] ${
                    node.color === 'violet'
                      ? 'border-violet-500/30 bg-violet-500/10'
                      : 'border-teal-500/30 bg-teal-500/10'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    node.color === 'violet' ? 'bg-violet-500/20' : 'bg-teal-500/20'
                  }`}>
                    <node.icon className={`h-5 w-5 ${
                      node.color === 'violet' ? 'text-violet-400' : 'text-teal-400'
                    }`} aria-hidden="true" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-white">{node.label}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{node.sub}</p>
                  </div>
                </motion.div>

                {/* Arrow connector */}
                {i < ARCH_NODES.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={inView ? { scaleX: 1 } : {}}
                    transition={{ delay: 0.85 + i * 0.15, duration: 0.4 }}
                    style={{ originX: 0 }}
                    className="w-8 flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <div className="h-px w-full bg-gradient-to-r from-slate-600 to-slate-500 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-0.5 border-l-4 border-l-slate-500 border-y-2 border-y-transparent" />
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
