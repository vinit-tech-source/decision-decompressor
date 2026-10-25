import React, { useState, useEffect } from 'react';
import { RefreshIcon } from './Icons.tsx';

export type TimeFormatPreference = 'auto' | '12h' | '24h';
export type DateFormatPreference = 'auto' | 'long' | 'medium' | 'short' | 'iso';

interface AmbientClockProps {
  className?: string;
  locale?: string;
  timeFormat?: TimeFormatPreference;
  dateFormat?: DateFormatPreference;
  timeZone?: string;
}

const MORNING_LINES = [
  'A fresh morning. You do not have to carry everything at once. Start with just one gentle step.',
  'The early quiet is yours. Soften your shoulders and focus only on the very next moment.',
  'Morning brings a clean slate. Leave yesterday\'s unfinished weights behind.',
  'A calm morning breath. You have time to move slowly and clearly.',
];

const AFTERNOON_LINES = [
  'The day is in motion. You do not need to rush. Take it gently, one small step at a time.',
  'Midday pause. Unclench your hands and remember that doing one simple thing is plenty.',
  'A steady afternoon rhythm. Protect your energy and honor your own pace.',
  'Take a moment to exhale. Step away for sixty seconds and let your thoughts settle.',
];

const EVENING_LINES = [
  'The evening light softens. Whatever remains undone can wait until tomorrow.',
  'Dusk brings ease. Let go of the need to solve everything today.',
  'Evening is for winding down. Give your mind permission to release the day.',
  'The sun is resting. You carried a lot today, and that is enough.',
];

const NIGHT_LINES = [
  'The quiet night is here. You have done enough today. Let your thoughts rest.',
  'Night brings silence. Rest is not something you must earn, it is what you need.',
  'Stillness in the dark. Close the mental tabs and let today gently close.',
  'Soft darkness. Safe to let go of tomorrow\'s problems until morning.',
];

export function AmbientClock({
  className = '',
  locale = 'auto',
  timeFormat = 'auto',
  dateFormat = 'auto',
  timeZone = 'auto',
}: AmbientClockProps) {
  const [time, setTime] = useState<Date>(() => new Date());
  const [lineIndex, setLineIndex] = useState<number>(0);

  useEffect(() => {
    // Updating every 15 seconds is more than enough when seconds are not displayed
    const timer = setInterval(() => {
      setTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const effectiveLocale = (!locale || locale === 'auto') ? undefined : locale;
  const effectiveTimeZone = (!timeZone || timeZone === 'auto') ? undefined : timeZone;

  // Determine local hours (accounting for selected timezone if any)
  let hours = time.getHours();
  if (effectiveTimeZone) {
    try {
      const tzHourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: effectiveTimeZone,
        hour: 'numeric',
        hourCycle: 'h23',
      }).format(time);
      hours = parseInt(tzHourStr, 10);
    } catch {
      hours = time.getHours();
    }
  }

  let periodTag = 'Morning Freshness';
  let linesList = MORNING_LINES;

  if (hours >= 5 && hours < 12) {
    periodTag = 'Morning Freshness';
    linesList = MORNING_LINES;
  } else if (hours >= 12 && hours < 17) {
    periodTag = 'Afternoon Ease';
    linesList = AFTERNOON_LINES;
  } else if (hours >= 17 && hours < 21) {
    periodTag = 'Evening Transition';
    linesList = EVENING_LINES;
  } else {
    periodTag = 'Night Stillness';
    linesList = NIGHT_LINES;
  }

  const currentLine = linesList[lineIndex % linesList.length];

  // Internationalized Time formatting (without ticking seconds)
  let timeString = '';
  try {
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
    };
    if (timeFormat === '12h') {
      timeOptions.hour12 = true;
    } else if (timeFormat === '24h') {
      timeOptions.hour12 = false;
    }
    if (effectiveTimeZone) {
      timeOptions.timeZone = effectiveTimeZone;
    }
    timeString = new Intl.DateTimeFormat(effectiveLocale, timeOptions).format(time);
  } catch {
    timeString = time.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  // Internationalized Date formatting
  let dateString = '';
  try {
    if (dateFormat === 'iso') {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: effectiveTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(time);
      dateString = parts;
    } else {
      const dateOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
      };
      if (dateFormat === 'short') {
        dateOptions.month = 'numeric';
        dateOptions.day = 'numeric';
      } else if (dateFormat === 'medium') {
        dateOptions.month = 'short';
        dateOptions.day = 'numeric';
        dateOptions.weekday = 'short';
      } else {
        // 'long' or 'auto'
        dateOptions.month = 'long';
        dateOptions.day = 'numeric';
        dateOptions.weekday = 'long';
      }
      if (effectiveTimeZone) {
        dateOptions.timeZone = effectiveTimeZone;
      }
      dateString = new Intl.DateTimeFormat(effectiveLocale, dateOptions).format(time);
    }
  } catch {
    dateString = time.toLocaleDateString();
  }

  function handleNextLine() {
    setLineIndex((prev) => (prev + 1) % linesList.length);
  }

  return (
    <div className={`mb-8 p-5 sm:p-6 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-[var(--card-border)]">
        <div>
          <span className="block text-3xl sm:text-4xl font-serif-card font-medium tracking-tight text-[var(--text-ink)] tabular-nums">
            {timeString}
          </span>
          <span className="text-xs sm:text-sm font-medium text-[var(--subtle-ink)] tracking-wide">
            {dateString}
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded border border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--accent-sage)]">
            {periodTag}
          </span>
        </div>
      </div>

      <div className="pt-3.5 flex items-start justify-between gap-3">
        <p className="font-serif-card text-sm sm:text-base text-[var(--text-ink)] leading-relaxed italic">
          "{currentLine}"
        </p>
        <button
          onClick={handleNextLine}
          className="shrink-0 p-1.5 rounded text-[var(--dim-text)] hover:text-[var(--text-ink)] hover:bg-[var(--input-bg)] border border-transparent hover:border-[var(--card-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] cursor-pointer transition-colors"
          aria-label="Read another calming thought"
          title="Another thought"
        >
          <RefreshIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
