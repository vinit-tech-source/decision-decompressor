import React, { useState } from 'react';
import { SmileIcon, RefreshIcon } from './Icons.tsx';

interface DailySmileProps {
  className?: string;
}

interface Joke {
  setup: string;
  punchline: string;
}

const GENTLE_JOKES: Joke[] = [
  {
    setup: 'Why do trees make the most peaceful friends?',
    punchline: 'Because they are always grounded and never leaf you hanging.',
  },
  {
    setup: 'Why did the tea bag stay calm during the storm?',
    punchline: 'Because it knew how to steep in the moment.',
  },
  {
    setup: 'Why did the computer take a gentle walk under the pines?',
    punchline: 'It needed to clear its cache and branch out.',
  },
  {
    setup: 'What did one calm ocean wave say to the other?',
    punchline: 'Nothing, they just waved.',
  },
  {
    setup: 'Why did the bicycle rest quietly against the garden fence?',
    punchline: 'Because it was two-tired.',
  },
  {
    setup: 'Why do clouds never panic in traffic?',
    punchline: 'They simply go with the drift.',
  },
  {
    setup: 'What did the zero say to the eight?',
    punchline: 'Nice belt.',
  },
  {
    setup: 'Why was the notebook feeling peaceful today?',
    punchline: 'It decided to turn over a new leaf.',
  },
  {
    setup: 'How does a quiet garden handle a busy afternoon?',
    punchline: 'One seed at a time.',
  },
  {
    setup: 'Why did the clock sit down for a quick break?',
    punchline: 'It needed a few minutes to unwind.',
  },
  {
    setup: 'What do you call a sleeping dinosaur?',
    punchline: 'A dino-snore.',
  },
  {
    setup: 'Why do hummingbirds hum instead of speaking?',
    punchline: 'Because they forgot the words, and humming feels calmer.',
  },
];

export function DailySmile({ className = '' }: DailySmileProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [jokeIndex, setJokeIndex] = useState<number>(() => {
    // Pick daily joke based on day of year
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return dayOfYear % GENTLE_JOKES.length;
  });

  const [revealed, setRevealed] = useState<boolean>(false);

  const currentJoke = GENTLE_JOKES[jokeIndex % GENTLE_JOKES.length];

  function handleNextJoke() {
    setJokeIndex((prev) => (prev + 1) % GENTLE_JOKES.length);
    setRevealed(false);
  }

  return (
    <div className={`rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden shadow-xs transition-all ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 px-4 sm:px-5 flex items-center justify-between text-left hover:bg-[var(--input-bg)]/40 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[var(--accent-sage)]">
            <SmileIcon className="w-4 h-4" />
          </span>
          <span className="text-xs font-medium text-[var(--text-ink)] tracking-wide">
            Daily Mind Freshener
          </span>
        </div>
        <span className="text-[11px] text-[var(--dim-text)] font-normal">
          {isOpen ? 'Close' : 'Read today\'s smile'}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 pt-1 border-t border-[var(--card-border)] bg-[var(--input-bg)]/30 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="font-serif-card text-sm sm:text-base text-[var(--text-ink)] font-normal leading-snug">
              {currentJoke.setup}
            </p>
            <button
              onClick={handleNextJoke}
              className="p-1 rounded text-[var(--dim-text)] hover:text-[var(--text-ink)] hover:bg-[var(--card-bg)] border border-transparent hover:border-[var(--card-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] cursor-pointer transition-colors shrink-0"
              title="Another smile"
              aria-label="Another smile"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            {!revealed ? (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="py-1.5 px-3 rounded text-xs text-[var(--subtle-ink)] hover:text-[var(--text-ink)] bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent-sage)] transition-colors cursor-pointer"
              >
                Reveal punchline
              </button>
            ) : (
              <p className="font-serif-card text-sm sm:text-base text-[var(--accent-sage)] italic leading-snug animate-card-enter">
                {currentJoke.punchline}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
