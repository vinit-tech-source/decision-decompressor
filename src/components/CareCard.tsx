import React from 'react';
import { CARE_MESSAGE, getCrisisResources } from '../shared/safety.ts';
import { ExternalLinkIcon } from './Icons.tsx';

interface CareCardProps {
  onStartFresh: () => void;
  region?: string;
}

export function CareCard({ onStartFresh, region }: CareCardProps) {
  const resources = getCrisisResources(region);
  function getResourceAction(line: string) {
    if (line.includes('14416')) {
      return (
        <a
          href="tel:14416"
          className="text-[var(--text-ink)] hover:text-[var(--accent-sage)] underline underline-offset-2 transition-colors inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
        >
          {line}
        </a>
      );
    }
    if (line.includes('988')) {
      return (
        <a
          href="tel:988"
          className="text-[var(--text-ink)] hover:text-[var(--accent-sage)] underline underline-offset-2 transition-colors inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
        >
          {line}
        </a>
      );
    }
    if (line.includes('findahelpline.com')) {
      return (
        <a
          href="https://findahelpline.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--text-ink)] hover:text-[var(--accent-sage)] underline underline-offset-2 transition-colors inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
        >
          {line}
          <ExternalLinkIcon className="w-3 h-3 opacity-60" />
        </a>
      );
    }
    return <span>{line}</span>;
  }

  return (
    <div
      className="animate-card-enter p-7 sm:p-9 rounded-lg bg-[var(--card-bg)] border border-[var(--border-clay)] shadow-[0_4px_24px_-4px_rgba(43,43,43,0.06)] dark:shadow-none space-y-6 transition-all duration-200"
      aria-live="polite"
    >
      <div className="space-y-3">
        <h2 className="font-serif-card text-2xl sm:text-3xl text-[var(--text-ink)] font-normal leading-snug">
          {CARE_MESSAGE.title}
        </h2>
        <p className="text-sm sm:text-base text-[var(--subtle-ink)] leading-relaxed font-normal">
          {CARE_MESSAGE.body}
        </p>
      </div>

      <div className="space-y-3 pt-3 border-t border-[var(--card-border)]">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--dim-text)]">
          Free, confidential support
        </p>
        <ul className="space-y-2 text-sm text-[var(--text-ink)]">
          {resources.map((resLine, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-sage)] shrink-0"></span>
              {getResourceAction(resLine)}
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onStartFresh}
          className="px-5 py-2.5 rounded-md text-sm font-medium bg-[var(--input-bg)] text-[var(--text-ink)] border border-[var(--card-border)] hover:border-[var(--dim-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] min-h-[44px] cursor-pointer transition-colors shadow-xs"
        >
          Start fresh
        </button>
      </div>
    </div>
  );
}
