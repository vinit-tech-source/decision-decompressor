import React from 'react';
import { REST_MESSAGE } from '../shared/fallback.ts';

interface RestCardProps {
  onStartFresh: () => void;
}

export function RestCard({ onStartFresh }: RestCardProps) {
  return (
    <div
      className="animate-card-enter p-8 sm:p-12 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[0_4px_24px_-4px_rgba(43,43,43,0.06)] dark:shadow-none text-center space-y-6 transition-all duration-200"
      aria-live="polite"
    >
      <div className="space-y-2.5">
        <h2 className="font-serif-card text-2xl sm:text-3xl text-[var(--text-ink)] font-normal leading-snug">
          {REST_MESSAGE.title}
        </h2>
        <p className="text-sm sm:text-base text-[var(--subtle-ink)]">
          {REST_MESSAGE.body}
        </p>
      </div>

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
