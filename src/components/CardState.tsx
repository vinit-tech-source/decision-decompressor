import React, { useState, useEffect } from 'react';
import { Card } from '../shared/validator.ts';
import type { UserProfile } from '../shared/preferences.ts';
import { buildChosenForLabel } from '../shared/preferences.ts';

interface CardStateProps {
  card: Card;
  isFallback: boolean;
  fallbackNote?: string;
  onDoable: () => void;
  onDone: () => void;
  isTimerActive: boolean;
  onTooMuch: () => void;
  onForget: () => void;
  isLoadingTooMuch?: boolean;
  profile?: UserProfile;
}

export function CardState({
  card,
  isFallback,
  fallbackNote,
  onDoable,
  onDone,
  isTimerActive,
  onTooMuch,
  onForget,
  isLoadingTooMuch,
  profile,
}: CardStateProps) {

  const totalSeconds = (card.time_box_minutes || 2) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds);

  useEffect(() => {
    setSecondsRemaining((card.time_box_minutes || 2) * 60);
  }, [card]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            onDone();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, secondsRemaining, onDone]);

  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = isTimerActive ? secondsRemaining / totalSeconds : 1;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const displayMinutes = Math.floor(secondsRemaining / 60);
  const displaySeconds = secondsRemaining % 60;
  const formattedTime = `${displayMinutes}:${displaySeconds < 10 ? '0' : ''}${displaySeconds}`;

  return (
    <div
      className="animate-card-enter p-7 sm:p-9 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[0_4px_24px_-4px_rgba(43,43,43,0.06)] dark:shadow-none space-y-7 transition-colors duration-200"
      aria-live="polite"
    >
      <div className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent-sage)] select-none">
            One small thing
          </span>
          {!isFallback && buildChosenForLabel(profile) && (
            <span className="text-xs text-[var(--subtle-ink)] italic">
              {buildChosenForLabel(profile)}
            </span>
          )}
        </div>
        <h2 className="font-serif-card text-3xl sm:text-4xl text-[var(--text-ink)] leading-[1.25] tracking-tight font-normal">
          {card.action}
        </h2>
        <p className="text-sm sm:text-base text-[var(--subtle-ink)] leading-relaxed font-normal">
          {card.why_gentle}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--dim-text)] pt-3 border-t border-[var(--card-border)]">
        <div className="inline-flex items-center gap-2 tracking-wide">
          {/* Subtle Circular Countdown Ring */}
          <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 -rotate-90 transform" viewBox="0 0 20 20">
              <circle
                cx="10"
                cy="10"
                r={radius}
                className="stroke-[var(--card-border)]"
                strokeWidth="1.5"
                fill="none"
              />
              <circle
                cx="10"
                cy="10"
                r={radius}
                className="stroke-[var(--accent-sage)] transition-all duration-1000 ease-linear"
                strokeWidth="1.8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          <span>
            {isTimerActive
              ? `${formattedTime} remaining`
              : `About ${card.time_box_minutes} ${card.time_box_minutes === 1 ? 'minute' : 'minutes'}`}
          </span>
        </div>

        {isFallback && (
          <span className="text-[var(--dim-text)] italic">
            {fallbackNote || 'Offered gently, without the model.'}
          </span>
        )}
      </div>

      <div className="pt-2 flex flex-wrap items-center gap-3">
        {isTimerActive ? (
          <button
            type="button"
            onClick={onDone}
            className="px-5 py-2.5 rounded-md text-sm font-medium bg-[var(--accent-sage)] text-white hover:bg-[var(--accent-sage-hover)] active:bg-[var(--accent-sage-active)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] min-h-[44px] cursor-pointer transition-colors shadow-xs"
          >
            Done
          </button>
        ) : (
          <button
            type="button"
            onClick={onDoable}
            className="px-4 py-2.5 rounded-md text-sm font-medium bg-[var(--accent-sage)] text-white hover:bg-[var(--accent-sage-hover)] active:bg-[var(--accent-sage-active)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] min-h-[44px] cursor-pointer transition-colors shadow-xs"
          >
            That's doable
          </button>
        )}

        <button
          type="button"
          onClick={onTooMuch}
          disabled={isLoadingTooMuch}
          className="px-4 py-2.5 rounded-md text-sm font-medium bg-[var(--input-bg)] text-[var(--text-ink)] border border-[var(--card-border)] hover:border-[var(--dim-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] min-h-[44px] cursor-pointer transition-colors disabled:opacity-50"
        >
          {isLoadingTooMuch ? (
            <span className="animate-breathe">Finding smaller...</span>
          ) : (
            'Too much'
          )}
        </button>

        <button
          type="button"
          onClick={onForget}
          className="px-4 py-2.5 rounded-md text-sm font-normal text-[var(--dim-text)] hover:text-[var(--text-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] min-h-[44px] cursor-pointer transition-colors ml-auto"
        >
          Forget this
        </button>
      </div>
    </div>
  );
}
