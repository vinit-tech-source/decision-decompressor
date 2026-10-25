import React from 'react';

interface FooterProps {
  mode: 'hosted' | 'local';
  onNavigate: (route: string) => void;
}

export function Footer({ mode, onNavigate }: FooterProps) {
  const privacyText =
    mode === 'hosted'
      ? "In Hosted mode, your brain-dump and optional preference context are sent to Google's Gemini API (Gemma 4) to get one answer. Still doesn't store them. Google's API terms apply."
      : "Running on your machine. Nothing leaves this device.";

  return (
    <footer className="mt-16 sm:mt-20 pt-8 pb-12 border-t border-[var(--card-border)] space-y-3.5 select-none">
      <p className="text-[11px] leading-relaxed text-[var(--dim-text)] tracking-normal max-w-xl">
        {privacyText}
      </p>

      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 pt-0.5 text-[11px] text-[var(--dim-text)]">
        <button
          onClick={() => onNavigate('/privacy')}
          className="hover:text-[var(--text-ink)] underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded py-1 min-h-[44px] inline-flex items-center cursor-pointer transition-colors"
        >
          Privacy
        </button>
        <span aria-hidden="true" className="select-none text-[var(--card-border)]">·</span>
        <button
          onClick={() => onNavigate('/selftest')}
          className="hover:text-[var(--text-ink)] underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded py-1 min-h-[44px] inline-flex items-center cursor-pointer transition-colors"
        >
          Self Test (For developers)
        </button>
        <span aria-hidden="true" className="select-none text-[var(--card-border)]">·</span>
        <button
          onClick={() => onNavigate('/lab')}
          className="hover:text-[var(--text-ink)] underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded py-1 min-h-[44px] inline-flex items-center cursor-pointer transition-colors"
        >
          Lab (For developers)
        </button>
      </div>

      <p className="text-[10.5px] text-[var(--dim-text)]/75 pt-0.5">
        Still isn't medical advice or therapy.
      </p>
    </footer>
  );
}
