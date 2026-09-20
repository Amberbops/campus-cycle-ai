import { motion, useMotionValue, useSpring } from 'framer-motion';
import type { PointerEvent } from 'react';
import { MapPin, Clock, Star } from 'lucide-react';
import type { AnalysisResult, MatchItem } from '../../lib/mockData';
import { RecommendationBadge, ConditionBadge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { GlitchText } from '../ui/GlitchText';

// ── ResultCard ───────────────────────────────────────────────────────────────

interface ResultCardProps {
  result: AnalysisResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const isHighRisk = result.recommendation === 'MANUAL_REVIEW' || result.condition === 'hazardous';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative rounded-2xl border bg-slate-800/80 p-5 shadow-xl backdrop-blur-sm',
        isHighRisk ? 'safety-risk-card border-red-500/70' : 'border-slate-700'
      )}
    >
      {isHighRisk && (
        <div className="mb-4 flex items-center justify-between border-b border-red-500/20 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">
          <GlitchText>Safety restriction</GlitchText>
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
            Human review required
          </span>
        </div>
      )}
      {/* Top row */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">{result.itemName}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <ConditionBadge condition={result.condition} />
            <RecommendationBadge type={result.recommendation} animate />
          </div>
        </div>
        {/* Confidence ring */}
        <div className="shrink-0 text-center" aria-label={`Confidence: ${Math.round(result.confidence * 100)}%`}>
          <div className="relative h-14 w-14">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgb(51,65,85)" strokeWidth="4" />
              <motion.circle
                cx="28" cy="28" r="22"
                fill="none"
                stroke={result.confidence >= 0.7 ? '#14b8a6' : result.confidence >= 0.5 ? '#f59e0b' : '#ef4444'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - result.confidence)}`}
                initial={{ strokeDashoffset: `${2 * Math.PI * 22}` }}
                animate={{ strokeDashoffset: `${2 * Math.PI * 22 * (1 - result.confidence)}` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{Math.round(result.confidence * 100)}%</span>
            </div>
          </div>
          <p className="mt-0.5 text-[9px] text-slate-500">confidence</p>
        </div>
      </div>

      {/* Description */}
      <p className="mb-3 text-sm text-slate-300 leading-relaxed">{result.description}</p>

      {/* Safety note */}
      {result.safetyNote && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <span className="text-amber-400 text-sm shrink-0" aria-hidden="true">⚠</span>
          <p className="text-xs text-amber-300 leading-relaxed">{result.safetyNote}</p>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5" role="list" aria-label="Item tags">
        {result.tags.map((tag) => (
          <span
            key={tag}
            role="listitem"
            className="rounded-full bg-slate-700/60 px-2.5 py-0.5 text-[11px] font-medium text-slate-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ── MatchCard ────────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: MatchItem;
  index: number;
}

const URGENCY_CONFIG = {
  high: { label: 'Urgent', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
  medium: { label: 'Moderate', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  low: { label: 'Flexible', className: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
};

export function MatchCard({ match, index }: MatchCardProps) {
  const urgency = URGENCY_CONFIG[match.urgency];
  const rotateX = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    rotateX.set(y * -8);
    rotateY.set(x * 8);
  };

  const resetTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.12,
        type: 'spring',
        stiffness: 280,
        damping: 24,
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/60 p-4 transition-colors duration-200 hover:border-teal-500/40 hover:bg-slate-800"
    >
      {/* Avatar */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-sm font-bold text-white shadow-lg shadow-teal-500/20"
        aria-hidden="true"
      >
        {match.avatar}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="truncate font-semibold text-white text-sm">{match.requestedBy}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{match.location}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-400 italic">"{match.itemRequested}"</p>
      </div>

      {/* Right: score + urgency + time */}
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-teal-400" aria-hidden="true" />
          <span className="text-sm font-bold text-teal-400">{match.compatibilityScore}%</span>
        </div>
        <span
          className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', urgency.className)}
          aria-label={`Urgency: ${urgency.label}`}
        >
          {urgency.label}
        </span>
        <div className="flex items-center gap-1 text-[10px] text-slate-600">
          <Clock className="h-2.5 w-2.5" aria-hidden="true" />
          {match.postedAt}
        </div>
      </div>
    </motion.div>
  );
}

// ── MatchList ────────────────────────────────────────────────────────────────

interface MatchListProps {
  matches: MatchItem[];
}

export function MatchList({ matches }: MatchListProps) {
  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-800/40 py-10 text-center">
        <p className="text-2xl mb-2" aria-hidden="true">🔍</p>
        <p className="text-sm font-medium text-slate-400">No matches found on campus</p>
        <p className="text-xs text-slate-600 mt-1">This item will be listed for future demand</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-400" aria-hidden="true">
          {matches.length}
        </span>
        Campus Matches
      </h3>
      <div className="space-y-2.5" role="list" aria-label="Match requests">
        {matches.map((m, i) => (
          <div key={m.id} role="listitem">
            <MatchCard match={m} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
