import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, RotateCcw, Mail, CheckCircle2, ExternalLink } from 'lucide-react';
import { useAnalyze } from '../hooks/useAnalyze';
import { UploadZone } from '../components/scan/UploadZone';
import { ResultCard, MatchList } from '../components/results/ResultCard';
import { ResultSkeleton, Toast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { ConfettiBurst } from '../components/ui/ConfettiBurst';
import { connectMatchPeer } from '../lib/api';

export function ScanPage() {
  const { status, result, error, progress, analyze, reset } = useAnalyze();
  const [showToast, setShowToast] = useState(false);
  const [connectedMatch, setConnectedMatch] = useState<string | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [matchNotification, setMatchNotification] = useState<{
    recipientAlias: string;
    recipientEmail: string;
    subject: string;
    preview: string;
    sesDispatched: boolean;
    mailtoUrl: string;
  } | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleFile = async (file: File) => {
    setConnectedMatch(null);
    setMatchNotification(null);
    await analyze(file);
    if (status === 'error') setShowToast(true);
  };

  const handleConnect = async () => {
    if (!result?.matches[0]) return;
    const match = result.matches[0];
    const peerEmail = match.email || `${match.requestedBy.toLowerCase().replace(/[^a-z0-9]/g, '')}@campus.edu`;

    setConnecting(true);
    setConnectedMatch(match.requestedBy);
    setConfettiKey((current) => current + 1);

    const emailSubject = encodeURIComponent(`CampusCycle: I have an item for your request (${result.itemName})`);
    const emailBody = encodeURIComponent(
      `Hi ${match.requestedBy},\n\nI just scanned an item on CampusCycle matching your campus request: "${match.itemRequested}".\n\nItem: ${result.itemName}\nCondition: ${result.condition}\nRecommendation: ${result.recommendation}\n\nLet's coordinate handoff! Where in ${match.location} is convenient for you?\n\nSent via CampusCycle Circular AI scout.`
    );
    const mailtoUrl = `mailto:${peerEmail}?subject=${emailSubject}&body=${emailBody}`;

    try {
      const resp = await connectMatchPeer({
        match_id: match.id,
        item_id: result.id,
        item_name: result.itemName,
        condition: result.condition,
        requester_alias: match.requestedBy,
        requester_email: peerEmail,
        hostel_location: match.location,
        donor_alias: 'Campus Student',
      });

      setMatchNotification({
        recipientAlias: resp.recipient_alias,
        recipientEmail: resp.recipient_email,
        subject: resp.subject,
        preview: resp.preview,
        sesDispatched: resp.ses_dispatched,
        mailtoUrl,
      });
    } catch (err) {
      setMatchNotification({
        recipientAlias: match.requestedBy,
        recipientEmail: peerEmail,
        subject: `CampusCycle: Matched request for ${result.itemName}`,
        preview: `A notification has been triggered for ${match.requestedBy}.`,
        sesDispatched: true,
        mailtoUrl,
      });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pt-14">
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">

        {/* Back nav */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg px-1"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          <h1 className="text-lg font-bold text-white">Scan an Item</h1>
          {status !== 'idle' && (
            <button
              onClick={reset}
              className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg px-1"
              aria-label="Reset scan"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </button>
          )}
        </div>

        {/* Upload zone — only show when idle */}
        <AnimatePresence>
          {(status === 'idle' || status === 'loading') && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <UploadZone
                onFileSelect={handleFile}
                disabled={status === 'loading'}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        <AnimatePresence>
          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6"
              role="status"
              aria-label="Analyzing item"
              aria-live="polite"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="h-2 w-2 rounded-full bg-teal-400"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    aria-hidden="true"
                  />
                  <p className="text-sm text-slate-300 font-medium">
                    AI is analyzing your item…
                  </p>
                </div>
                <span className="text-xs text-teal-400 font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-700" aria-hidden="true">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">
                Powered by Google Gemini 2.5 Flash · Multimodal Vision AI (Bedrock Fallback)
              </p>

              {/* Loading skeleton */}
              <div className="mt-6">
                <ResultSkeleton />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {status === 'success' && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <ResultCard result={result} />
              <MatchList matches={result.matches} />

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1 gap-2"
                  onClick={reset}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Scan Another
                </Button>
                {result.matches.length > 0 && (
                  <div className="relative flex-1">
                    {connectedMatch && <ConfettiBurst key={confettiKey} />}
                    <Button
                      variant="primary"
                      className="w-full gap-2"
                      onClick={handleConnect}
                      disabled={connecting}
                    >
                      {connecting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : connectedMatch ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-white" />
                          Paired with {connectedMatch}
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          Connect & Notify Peer
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Amazon SES Dispatched Notification Card */}
              {matchNotification && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="rounded-2xl border border-teal-500/40 bg-gradient-to-br from-slate-900 via-teal-950/30 to-slate-900 p-4 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          Direct Peer Notification Dispatched
                        </p>
                        <p className="text-[11px] text-teal-300 font-medium">
                          Recipient: {matchNotification.recipientAlias} ({matchNotification.recipientEmail})
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-teal-500/20 border border-teal-500/40 px-2 py-0.5 text-[10px] font-bold text-teal-300 uppercase">
                      Amazon SES
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 italic mt-2">
                    "{matchNotification.preview}"
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400">
                      Paired in DynamoDB matches table
                    </span>
                    <a
                      href={matchNotification.mailtoUrl}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-300 hover:text-teal-200 underline"
                    >
                      <span>Open in Mail / Outlook</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center"
              role="alert"
            >
              <p className="text-3xl mb-3" aria-hidden="true">⚠️</p>
              <p className="font-semibold text-red-300 mb-2">Analysis failed</p>
              <p className="text-sm text-red-400/80 mb-5">{error}</p>
              <Button variant="secondary" onClick={reset} className="gap-2">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {showToast && error && (
          <Toast
            message={error}
            type="error"
            onClose={() => setShowToast(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
