import React, { useState } from 'react';
import { LeafIcon } from './Icons.tsx';

interface ClosedStateProps {
  onStartFresh: () => void;
}

export function ClosedState({ onStartFresh }: ClosedStateProps) {
  const [satisfaction, setSatisfaction] = useState<'pending' | 'yes' | 'no'>('pending');

  return (
    <div
      className="animate-card-enter p-8 sm:p-12 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[0_4px_24px_-4px_rgba(43,43,43,0.06)] dark:shadow-none text-center space-y-6 transition-all duration-200"
      aria-live="polite"
    >
      {satisfaction === 'pending' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--subtle-ink)] font-normal">
            Did this help?
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setSatisfaction('yes')}
              className="px-4 py-2 rounded-md text-xs font-medium bg-[var(--accent-sage)] text-white hover:bg-[var(--accent-sage-hover)] cursor-pointer transition-colors shadow-xs min-h-[38px] min-w-[64px]"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setSatisfaction('no')}
              className="px-4 py-2 rounded-md text-xs font-medium bg-[var(--input-bg)] text-[var(--text-ink)] border border-[var(--card-border)] hover:border-[var(--dim-text)] cursor-pointer transition-colors shadow-xs min-h-[38px]"
            >
              Not really
            </button>
          </div>
        </div>
      )}

      {satisfaction === 'yes' && (
        <div className="space-y-2 animate-card-enter">
          <div className="flex items-center justify-center gap-2.5">
            <LeafIcon className="w-4 h-4 text-[var(--accent-sage)] shrink-0" />
            <h2 className="font-serif-card text-2xl sm:text-3xl text-[var(--text-ink)] font-normal leading-snug">
              Good. That's enough for now.
            </h2>
          </div>
          <p className="text-sm text-[var(--subtle-ink)]">
            Nothing to check off.
          </p>
        </div>
      )}

      {satisfaction === 'no' && (
        <div className="space-y-2 animate-card-enter">
          <h2 className="font-serif-card text-xl sm:text-2xl text-[var(--text-ink)] font-normal leading-snug max-w-md mx-auto">
            That is okay. You can try another brain-dump whenever you are ready.
          </h2>
        </div>
      )}

      <div className="pt-2">
        <button
          type="button"
          onClick={onStartFresh}
          className="px-5 py-2.5 rounded-md text-sm font-medium bg-[var(--input-bg)] text-[var(--text-ink)] border border-[var(--card-border)] hover:border-[var(--accent-sage)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] min-h-[44px] cursor-pointer transition-colors shadow-xs"
        >
          Start fresh
        </button>
      </div>
    </div>
  );
}
