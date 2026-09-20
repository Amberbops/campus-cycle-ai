import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

type BadgeVariant = 'REUSE' | 'REPAIR' | 'RECYCLE' | 'DISPOSE' | 'MANUAL_REVIEW';
type ConditionVariant = 'excellent' | 'good' | 'fair' | 'poor' | 'hazardous' | 'unknown';

const RECOMMENDATION_CONFIG: Record<
  BadgeVariant,
  { label: string; className: string; dotClass: string }
> = {
  REUSE: {
    label: 'REUSE',
    className: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    dotClass: 'bg-teal-400',
  },
  REPAIR: {
    label: 'REPAIR / INSPECT',
    className: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    dotClass: 'bg-violet-400',
  },
  RECYCLE: {
    label: 'RECYCLE',
    className: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    dotClass: 'bg-blue-400',
  },
  DISPOSE: {
    label: 'DISPOSE',
    className: 'bg-red-500/20 text-red-300 border-red-500/40',
    dotClass: 'bg-red-400',
  },
  MANUAL_REVIEW: {
    label: 'MANUAL REVIEW',
    className: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    dotClass: 'bg-amber-400',
  },
};

const CONDITION_CONFIG: Record<ConditionVariant, { label: string; className: string }> = {
  excellent: { label: 'Excellent', className: 'bg-teal-500/20 text-teal-300' },
  good: { label: 'Good', className: 'bg-teal-400/20 text-teal-200' },
  fair: { label: 'Fair', className: 'bg-yellow-500/20 text-yellow-300' },
  poor: { label: 'Poor', className: 'bg-orange-500/20 text-orange-300' },
  hazardous: { label: 'Hazardous', className: 'bg-red-500/20 text-red-300' },
  unknown: { label: 'Unknown', className: 'bg-slate-500/20 text-slate-300' },
};

interface RecommendationBadgeProps {
  type: BadgeVariant;
  animate?: boolean;
  className?: string;
}

export function RecommendationBadge({ type, animate = false, className }: RecommendationBadgeProps) {
  const config = RECOMMENDATION_CONFIG[type];

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-widest uppercase',
        config.className,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </span>
  );

  if (!animate) return badge;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -15, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
    >
      {badge}
    </motion.div>
  );
}

interface ConditionBadgeProps {
  condition: ConditionVariant;
  className?: string;
}

export function ConditionBadge({ condition, className }: ConditionBadgeProps) {
  const config = CONDITION_CONFIG[condition];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
