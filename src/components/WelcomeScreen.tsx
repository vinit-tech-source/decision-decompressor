import React from 'react';
import { StillLogo } from './StillLogo.tsx';

interface WelcomeScreenProps {
  mode: 'hosted' | 'local';
  onGetStarted: () => void;
}

export function WelcomeScreen({ mode, onGetStarted }: WelcomeScreenProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[var(--bg-page)] text-[var(--text-ink)] animate-fade-in overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-heading"
    >
      <div className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[560px] lg:max-w-[640px] mx-auto flex flex-col justify-center my-auto space-y-3.5 sm:space-y-4 md:space-y-5 text-center">
        {/* Brand Logo Emblem */}
        <div className="flex flex-col items-center justify-center gap-1.5 pt-1">
          <StillLogo size="lg" showText={false} />
          <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-semibold text-[var(--accent-sage)] bg-[var(--accent-sage)]/10 border border-[var(--accent-sage)]/30 px-3 py-0.5 rounded-full select-none">
            Still
          </span>
        </div>

        {/* Headline & Subline */}
        <div className="space-y-1.5 md:space-y-2 text-center">
          <h1
            id="welcome-heading"
            className="font-serif-card text-2xl sm:text-3xl md:text-4xl text-[var(--text-ink)] font-normal leading-tight tracking-tight outline-none border-none ring-0 select-none"
          >
            One gentle thing, then it forgets you.
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-[var(--subtle-ink)] leading-relaxed font-normal max-w-xl mx-auto">
            For days when everything feels like too much. Tell Still what's on your mind, and it gives you one small thing to do. No lists. No plans.
          </p>
        </div>

        {/* Three short lines */}
        <div className="p-3 sm:p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-left space-y-2 md:space-y-2.5 text-xs sm:text-sm text-[var(--text-ink)] leading-relaxed shadow-2xs">
          <p className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-sage)] mt-1.5 shrink-0" aria-hidden="true" />
            <span>You type the mess, as messy as you like.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-sage)] mt-1.5 shrink-0" aria-hidden="true" />
            <span>You get exactly one small action, 10 minutes or less.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-sage)] mt-1.5 shrink-0" aria-hidden="true" />
            <span>Still forgets what you wrote. It remembers only what you choose.</span>
          </p>
        </div>

        {/* Privacy line that switches with the active mode */}
        <div className="p-2.5 sm:p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)]/60 text-left text-[11px] sm:text-xs leading-relaxed text-[var(--subtle-ink)]">
          {mode === 'hosted' ? (
            <span>
              Your text is sent to Google's Gemini API (Gemma 4) to get one answer. Want it fully on your device? Switch to Local mode in Settings.
            </span>
          ) : (
            <span>
              Running on your machine. Nothing leaves this device.
            </span>
          )}
        </div>

        {/* Actions & Disclaimer */}
        <div className="space-y-2 pt-1 text-center">
          <button
            type="button"
            onClick={onGetStarted}
            className="w-full sm:w-auto sm:min-w-[200px] min-h-[44px] px-8 py-2.5 sm:py-3 rounded-md bg-[var(--accent-sage)] text-white text-sm sm:text-base font-medium hover:bg-[var(--accent-sage-hover)] active:bg-[var(--accent-sage-active)] transition-colors shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] mx-auto inline-block"
          >
            Get started
          </button>

          <p className="text-[10.5px] sm:text-xs text-[var(--dim-text)] select-none text-center pt-0.5">
            Not medical advice or therapy.
          </p>
        </div>
      </div>
    </div>
  );
}
