import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const STYLES = {
  success: 'bg-teal-900/90 border-teal-500/50 text-teal-100',
  error: 'bg-red-900/90 border-red-500/50 text-red-100',
  info: 'bg-slate-800/90 border-slate-500/50 text-slate-100',
};

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  const Icon = ICONS[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={cn(
        'fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md',
        STYLES[type]
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <p className="text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 rounded-full p-0.5 hover:bg-white/10"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-slate-700/60', className)}
      aria-hidden="true"
    />
  );
}

export function ResultSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading analysis results" role="status">
      <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6">
        <Skeleton className="mb-3 h-6 w-48" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-3/4" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-1.5 h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
