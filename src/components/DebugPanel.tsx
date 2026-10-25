import React, { useState } from 'react';

export interface DebugInfo {
  model: string;
  attempts: number;
  failures: string[];
  latencyMs: number;
  source: 'model' | 'fallback';
  isBusy?: boolean;
  quota?: {
    dailyCount: number;
    dailyLimit: number;
    minuteCount: number;
    minuteLimit: number;
    isBusy?: boolean;
  };
  timestamp?: Date;
}

interface DebugPanelProps {
  debugInfo: DebugInfo | null;
}

export function DebugPanel({ debugInfo }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isBusy = Boolean(
    debugInfo?.isBusy ||
    (debugInfo?.failures && debugInfo.failures.includes('busy'))
  );

  return (
    <aside
      data-testid="debug-panel"
      aria-label="Development Debug Panel"
      className="fixed bottom-4 right-4 z-[9999] max-w-sm sm:max-w-md w-full bg-[var(--card-bg)] border-2 border-[var(--accent-sage)] rounded-xl shadow-2xl overflow-hidden font-mono text-xs text-[var(--text-ink)] animate-card-enter select-none"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--accent-sage)]/15 border-b border-[var(--accent-sage)]/30">
        <div className="flex items-center gap-2 font-sans font-semibold text-xs tracking-tight text-[var(--text-ink)]">
          <span
            className={`w-2 h-2 rounded-full ${
              isBusy ? 'bg-red-500 animate-ping' : 'bg-[var(--accent-sage)] animate-pulse'
            }`}
            aria-hidden="true"
          />
          <span>Debug Panel</span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--accent-sage)] bg-[var(--accent-sage)]/10 px-1.5 py-0.5 rounded border border-[var(--accent-sage)]/25">
            ?debug=1
          </span>
          {isBusy && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 dark:text-red-300 bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/30">
              Busy
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[11px] font-sans text-[var(--subtle-ink)] hover:text-[var(--text-ink)] px-2 py-0.5 rounded border border-[var(--card-border)] bg-[var(--bg-page)] cursor-pointer"
        >
          {isOpen ? 'Minimize' : 'Expand'}
        </button>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-3.5 space-y-2.5 max-h-84 overflow-y-auto">
          {!debugInfo ? (
            <p className="text-[var(--dim-text)] italic font-sans text-xs py-2">
              No requests recorded yet. Type a brain-dump and click "Give me one thing" to inspect.
            </p>
          ) : (
            <div className="space-y-2 text-left">
              {/* Model Name */}
              <div className="flex items-start justify-between gap-2 border-b border-[var(--card-border)]/60 pb-1.5">
                <span className="font-semibold text-[var(--subtle-ink)] font-sans">Model Name:</span>
                <span className="text-[var(--text-ink)] font-bold text-right break-all">
                  {debugInfo.model || 'unknown'}
                </span>
              </div>

              {/* Busy State Indicator */}
              <div className="flex items-center justify-between gap-2 border-b border-[var(--card-border)]/60 pb-1.5">
                <span className="font-semibold text-[var(--subtle-ink)] font-sans">Busy State:</span>
                <span
                  data-testid="debug-busy-state"
                  className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                    isBusy
                      ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                      : 'bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30'
                  }`}
                >
                  {isBusy ? 'Busy (Quota / 429)' : 'Idle / Normal'}
                </span>
              </div>

              {/* Quota Counter (if available) */}
              {debugInfo.quota && (
                <div className="flex items-center justify-between gap-2 border-b border-[var(--card-border)]/60 pb-1.5">
                  <span className="font-semibold text-[var(--subtle-ink)] font-sans">Quota Counters:</span>
                  <span className="text-[var(--text-ink)] font-bold text-[11px]">
                    {debugInfo.quota.minuteCount}/{debugInfo.quota.minuteLimit} min · {debugInfo.quota.dailyCount}/{debugInfo.quota.dailyLimit} day
                  </span>
                </div>
              )}

              {/* Number of Attempts */}
              <div className="flex items-center justify-between gap-2 border-b border-[var(--card-border)]/60 pb-1.5">
                <span className="font-semibold text-[var(--subtle-ink)] font-sans">Number of Attempts:</span>
                <span className="px-2 py-0.5 rounded font-bold bg-[var(--input-bg)] border border-[var(--card-border)]">
                  {debugInfo.attempts}
                </span>
              </div>

              {/* Latency */}
              <div className="flex items-center justify-between gap-2 border-b border-[var(--card-border)]/60 pb-1.5">
                <span className="font-semibold text-[var(--subtle-ink)] font-sans">Latency:</span>
                <span className="text-[var(--accent-sage)] font-bold">
                  {debugInfo.latencyMs} ms
                </span>
              </div>

              {/* Result Source */}
              <div className="flex items-center justify-between gap-2 border-b border-[var(--card-border)]/60 pb-1.5">
                <span className="font-semibold text-[var(--subtle-ink)] font-sans">Result Source:</span>
                <span
                  className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] ${
                    debugInfo.source === 'model'
                      ? 'bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30'
                      : isBusy
                      ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                      : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isBusy && debugInfo.source === 'fallback' ? 'fallback (busy)' : debugInfo.source}
                </span>
              </div>

              {/* Failure Reason Codes for each attempt */}
              <div className="pt-1 space-y-1.5">
                <span className="block font-semibold text-[var(--subtle-ink)] font-sans">
                  Failure Reason Code per Attempt:
                </span>
                {debugInfo.failures && debugInfo.failures.length > 0 ? (
                  <div className="space-y-1">
                    {debugInfo.failures.map((reason, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded bg-[var(--input-bg)] border border-red-500/25 text-red-700 dark:text-red-300 flex items-start gap-1.5 break-words"
                      >
                        <span className="font-bold shrink-0">
                          {debugInfo.attempts === 0 ? 'Pre-call' : `Attempt ${idx + 1}`}:
                        </span>
                        <span>
                          {reason === 'busy'
                            ? 'busy (Quota limit reached or 429 RESOURCE_EXHAUSTED)'
                            : reason}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-1.5 rounded bg-[var(--input-bg)] border border-green-500/25 text-green-700 dark:text-green-300">
                    None (succeeded on first attempt)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
