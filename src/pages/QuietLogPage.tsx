import React, { useState } from 'react';
import { ArrowLeftIcon } from '../components/Icons.tsx';
import {
  QuietLogEntry,
  getQuietLog,
  clearQuietLog,
  getQuietLogInsight,
} from '../services/quietLog.ts';

interface QuietLogPageProps {
  onNavigateHome: () => void;
}

export function QuietLogPage({ onNavigateHome }: QuietLogPageProps) {
  const [entries, setEntries] = useState<QuietLogEntry[]>(() => getQuietLog());

  const insight = getQuietLogInsight(entries);

  function handleClear() {
    clearQuietLog();
    setEntries([]);
  }

  function formatTime(timestamp: number) {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  return (
    <div className="space-y-8 animate-card-enter">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-xs font-medium text-[var(--subtle-ink)] hover:text-[var(--text-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded p-1 cursor-pointer transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Still
        </button>

        {entries.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-[var(--dim-text)] hover:text-[var(--text-ink)] underline cursor-pointer p-1 transition-colors"
          >
            Clear Log
          </button>
        )}
      </div>

      <div className="space-y-2">
        <h1 className="font-serif-card text-2xl sm:text-3xl text-[var(--text-ink)] font-normal">
          Quiet Log
        </h1>
        <p className="text-xs text-[var(--dim-text)]">
          Stored only in your browser. Never sent to a server.
        </p>
      </div>

      {/* Gentle Local Insight */}
      {insight && (
        <div className="p-4 sm:p-5 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xs space-y-1.5">
          <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--accent-sage)] select-none">
            Gentle Observation
          </span>
          <p className="font-serif-card text-base sm:text-lg text-[var(--text-ink)] leading-snug">
            {insight}
          </p>
        </div>
      )}

      {/* List of actions */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="p-8 text-center rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] space-y-2">
            <p className="text-sm text-[var(--subtle-ink)]">
              Your quiet log is empty.
            </p>
            <p className="text-xs text-[var(--dim-text)] max-w-sm mx-auto leading-relaxed">
              When 'Enable Local Quiet Log' is active in Settings, your last 5 gentle actions will be remembered here on this device.
            </p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.id || index}
              className="p-5 sm:p-6 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xs space-y-3 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] text-[var(--dim-text)]">
                <span className="px-2 py-0.5 rounded border border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--subtle-ink)]">
                  {entry.context || 'General'}
                </span>
                <span>{formatTime(entry.timestamp)}</span>
              </div>

              <h2 className="font-serif-card text-xl text-[var(--text-ink)] font-normal leading-snug">
                {entry.action}
              </h2>

              <p className="text-xs sm:text-sm text-[var(--subtle-ink)] leading-relaxed">
                {entry.why_gentle}
              </p>

              <div className="pt-1 text-[11px] text-[var(--dim-text)]">
                About {entry.time_box_minutes} {entry.time_box_minutes === 1 ? 'minute' : 'minutes'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
