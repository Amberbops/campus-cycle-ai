import { motion } from 'framer-motion';
import { IMPACT_TICKER_ITEMS } from '../../lib/mockData';

export function ImpactTicker() {
  // Duplicate for seamless loop
  const items = [...IMPACT_TICKER_ITEMS, ...IMPACT_TICKER_ITEMS];

  return (
    <div
      className="relative overflow-hidden border-y border-slate-700/40 bg-slate-800/30 py-2"
      role="marquee"
      aria-label="Real-time impact metrics"
    >
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-slate-900 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-slate-900 to-transparent" />

      <motion.div
        className="flex w-max gap-8 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          // Respect reduced motion
          ['--motion-duration' as string]: 'var(--reduce-motion, 30s)',
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs text-slate-400"
          >
            <span aria-hidden="true">{item.icon}</span>
            <span className="font-semibold text-teal-400">{item.value}</span>
            <span>{item.label}</span>
            <span className="text-slate-600" aria-hidden="true">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
