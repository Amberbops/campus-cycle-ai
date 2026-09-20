import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, Clock,
  TrendingUp, Users, Recycle, Leaf, Package, Activity
} from 'lucide-react';
import {
  MOCK_ADMIN_METRICS,
  MOCK_MODERATION_QUEUE,
  DIVERSION_CHART_DATA,
  type ModerationItem,
  type AdminMetrics,
} from '../lib/mockData';
import { fetchAdminMetrics, fetchModerationQueue, updateModerationItem } from '../lib/api';
import { cn } from '../lib/utils';

// ── Metrics Grid ────────────────────────────────────────────────────────────

const METRIC_CARDS = [
  {
    label: 'Pending Items',
    key: 'totalPending' as const,
    icon: Clock,
    color: 'teal',
    description: 'Awaiting triage',
  },
  {
    label: 'Flagged Hazardous',
    key: 'flaggedHazardous' as const,
    icon: AlertTriangle,
    color: 'amber',
    description: 'Require manual review',
  },
  {
    label: 'Matched Today',
    key: 'matchedToday' as const,
    icon: Users,
    color: 'violet',
    description: 'Campus connections made',
  },
  {
    label: 'Diverted This Week',
    key: 'divertedThisWeek' as const,
    icon: Recycle,
    color: 'teal',
    description: 'Items kept from landfill',
  },
  {
    label: 'Total Diverted',
    key: 'totalDiverted' as const,
    icon: Package,
    color: 'teal',
    description: 'Since launch',
  },
  {
    label: 'CO₂ Saved',
    key: 'co2Saved' as const,
    icon: Leaf,
    color: 'teal',
    description: 'Kilograms avoided',
    suffix: ' kg',
  },
  {
    label: 'Items Reused',
    key: 'itemsReused' as const,
    icon: TrendingUp,
    color: 'violet',
    description: 'Directly matched & reused',
  },
  {
    label: 'Items Recycled',
    key: 'itemsRecycled' as const,
    icon: Recycle,
    color: 'blue',
    description: 'Routed to recycling',
  },
];

const COLOR_MAP: Record<string, string> = {
  teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

const ICON_COLOR_MAP: Record<string, string> = {
  teal: 'text-teal-400',
  amber: 'text-amber-400',
  violet: 'text-violet-400',
  blue: 'text-blue-400',
};

function MetricsGrid() {
  const [metrics, setMetrics] = useState<AdminMetrics>(MOCK_ADMIN_METRICS);

  useEffect(() => {
    fetchAdminMetrics().then(setMetrics).catch(() => {});
  }, []);

  return (
    <section aria-labelledby="metrics-heading">
      <h2 id="metrics-heading" className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">
        Impact Metrics
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {METRIC_CARDS.map((card, i) => {
          const value = metrics[card.key];
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={cn(
                'rounded-2xl border p-4',
                COLOR_MAP[card.color]
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <card.icon
                  className={cn('h-5 w-5', ICON_COLOR_MAP[card.color])}
                  aria-hidden="true"
                />
                <span className="text-[10px] text-slate-500">{card.description}</span>
              </div>
              <p className={cn('text-2xl font-black', ICON_COLOR_MAP[card.color])}>
                {value.toLocaleString()}{card.suffix ?? ''}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-300">{card.label}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ── Diversion Chart ─────────────────────────────────────────────────────────

function DiversionChart() {
  const maxVal = Math.max(...DIVERSION_CHART_DATA.map((d) => d.items));

  return (
    <section
      aria-labelledby="chart-heading"
      className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 id="chart-heading" className="text-sm font-bold text-white">
            Items Diverted Over Time
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Last 8 weeks</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-teal-400">
          <Activity className="h-3.5 w-3.5" aria-hidden="true" />
          <span>↑ 44% this week</span>
        </div>
      </div>
      <div className="flex items-end gap-2 h-32" role="img" aria-label="Bar chart showing items diverted over 8 weeks">
        {DIVERSION_CHART_DATA.map((d, i) => (
          <div key={d.week} className="flex flex-1 flex-col items-center gap-1">
            <motion.div
              className="w-full rounded-t bg-gradient-to-t from-teal-600 to-teal-400"
              initial={{ height: 0 }}
              animate={{ height: `${(d.items / maxVal) * 100}%` }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}
              aria-label={`${d.week}: ${d.items} items`}
            />
            <span className="text-[9px] text-slate-600">{d.week}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Moderation Queue ─────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  approved: { label: 'Approved', className: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  rejected: { label: 'Rejected', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

function ModerationQueue() {
  const [queue, setQueue] = useState<ModerationItem[]>(MOCK_MODERATION_QUEUE);

  useEffect(() => {
    fetchModerationQueue().then(setQueue).catch(() => {});
  }, []);

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    updateModerationItem(id, action).catch(() => {});
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    );
  };

  return (
    <section aria-labelledby="moderation-heading">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="moderation-heading" className="text-sm font-bold text-white">
          Moderation Queue
          <span
            className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400"
            aria-label={`${queue.filter((i) => i.status === 'pending').length} pending items`}
          >
            {queue.filter((i) => i.status === 'pending').length}
          </span>
        </h2>
        <p className="text-xs text-slate-500">Flagged for manual review</p>
      </div>

      <div className="space-y-2" role="list" aria-label="Items requiring moderation">
        <AnimatePresence initial={false}>
          {queue.map((item, i) => {
            const statusCfg = STATUS_CONFIG[item.status];
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.06 }}
                role="listitem"
                className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Flag icon */}
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                    <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-white text-sm">{item.itemName}</p>
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                          statusCfg.className
                        )}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-amber-400/80 mb-1">{item.flagReason}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                      <span>By {item.submittedBy}</span>
                      <span>·</span>
                      <span>{item.submittedAt}</span>
                      <span>·</span>
                      <span>Confidence: {Math.round(item.confidence * 100)}%</span>
                    </div>
                  </div>

                  {/* Actions — only for pending */}
                  {item.status === 'pending' && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => handleAction(item.id, 'approved')}
                        className="flex items-center gap-1 rounded-lg border border-teal-500/40 bg-teal-500/10 px-2.5 py-1.5 text-xs font-semibold text-teal-400 hover:bg-teal-500/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                        aria-label={`Approve ${item.itemName}`}
                      >
                        <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(item.id, 'rejected')}
                        className="flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        aria-label={`Reject ${item.itemName}`}
                      >
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ── Live Feed ────────────────────────────────────────────────────────────────

const LIVE_ITEMS = [
  { name: 'Desk Lamp', action: 'scanned', by: 'Student · Block E', time: 'just now', dot: 'bg-teal-400' },
  { name: 'Laptop Charger', action: 'matched', by: 'CS Lab', time: '1m ago', dot: 'bg-violet-400' },
  { name: 'Water Bottle', action: 'recycled', by: 'Student · Block B', time: '3m ago', dot: 'bg-blue-400' },
  { name: 'Study Chair', action: 'flagged', by: 'Automated flag', time: '5m ago', dot: 'bg-amber-400' },
  { name: 'USB Hub', action: 'matched', by: 'Library', time: '8m ago', dot: 'bg-violet-400' },
];

function LiveFeed() {
  return (
    <section
      aria-labelledby="live-feed-heading"
      className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="mb-4 flex items-center gap-2">
        <motion.div
          className="h-2 w-2 rounded-full bg-teal-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          aria-hidden="true"
        />
        <h2 id="live-feed-heading" className="text-sm font-bold text-white">Live Feed</h2>
      </div>
      <div className="space-y-2.5">
        {LIVE_ITEMS.map((item, i) => (
          <motion.div
            key={`${item.name}-${i}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className={cn('h-2 w-2 shrink-0 rounded-full', item.dot)} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-white font-medium">{item.name}</span>
              <span className="text-xs text-slate-500"> · {item.action} by {item.by}</span>
            </div>
            <span className="text-[10px] text-slate-600 shrink-0">{item.time}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── AdminPage (main export) ──────────────────────────────────────────────────

export function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-900 pt-14">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-sm text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg px-1"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-white">Admin Dashboard</h1>
              <p className="text-xs text-slate-500 mt-0.5">Campus Sustainability Operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              className="h-2 w-2 rounded-full bg-teal-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              aria-hidden="true"
            />
            <span className="text-xs text-teal-400 font-medium">Live · Auto-refresh</span>
          </div>
        </motion.div>

        {/* Layout: two-column on large screens */}
        <div className="space-y-6">
          {/* Metrics */}
          <MetricsGrid />

          {/* Chart + Live Feed side by side */}
          <div className="grid gap-6 lg:grid-cols-2">
            <DiversionChart />
            <LiveFeed />
          </div>

          {/* Moderation queue — full width */}
          <ModerationQueue />
        </div>
      </div>
    </div>
  );
}
