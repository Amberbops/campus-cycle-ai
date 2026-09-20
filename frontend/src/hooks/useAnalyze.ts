import { useState, useCallback } from 'react';
import { analyzeItem } from '../lib/api';
import type { AnalysisResult } from '../lib/mockData';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface UseAnalyzeReturn {
  status: Status;
  result: AnalysisResult | null;
  error: string | null;
  progress: number;
  analyze: (file: File) => Promise<void>;
  reset: () => void;
}

export function useAnalyze(): UseAnalyzeReturn {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const analyze = useCallback(async (file: File) => {
    setStatus('loading');
    setResult(null);
    setError(null);
    setProgress(0);

    // Animate progress bar during loading
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 400);

    try {
      const data = await analyzeItem(file);
      clearInterval(progressInterval);
      setProgress(100);
      setResult(data);
      setStatus('success');
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return { status, result, error, progress, analyze, reset };
}
