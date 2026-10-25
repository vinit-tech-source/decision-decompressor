import React, { useState } from 'react';
import { validate, Card } from '../shared/validator.ts';
import { FALLBACKS, MICRO } from '../shared/fallback.ts';
import { needsCare } from '../shared/safety.ts';
import { validateAvoidPreferences } from '../shared/preferences.ts';
import { CheckIcon, CrossIcon, ArrowLeftIcon } from '../components/Icons.tsx';

interface TestCase {
  id: string;
  name: string;
  category: 'accept' | 'reject' | 'fallback' | 'safety' | 'preferences';
  run: () => { pass: boolean; details?: string };
}


const TESTS: TestCase[] = [
  // ACCEPT tests
  {
    id: 'acc-1',
    name: 'ACCEPT: "Open your boss\'s most recent email."',
    category: 'accept',
    run: () => {
      const card: Card = { action: "Open your boss's most recent email.", why_gentle: "One email is concrete.", time_box_minutes: 2 };
      const res = validate(card);
      return { pass: res.ok, details: res.ok ? 'Validated successfully' : res.reason };
    }
  },
  {
    id: 'acc-2',
    name: 'ACCEPT: "Drink a glass of water."',
    category: 'accept',
    run: () => {
      const card: Card = { action: "Drink a glass of water.", why_gentle: "Physical, tiny step.", time_box_minutes: 2 };
      const res = validate(card);
      return { pass: res.ok, details: res.ok ? 'Validated successfully' : res.reason };
    }
  },
  {
    id: 'acc-3',
    name: 'ACCEPT: "Write down the first thing on your mind."',
    category: 'accept',
    run: () => {
      const card: Card = { action: "Write down the first thing on your mind.", why_gentle: "Quick reset.", time_box_minutes: 2 };
      const res = validate(card);
      return { pass: res.ok, details: res.ok ? 'Validated successfully' : res.reason };
    }
  },
  {
    id: 'acc-4',
    name: 'ACCEPT: "Put one object back where it belongs."',
    category: 'accept',
    run: () => {
      const card: Card = { action: "Put one object back where it belongs.", why_gentle: "Reversible and visible.", time_box_minutes: 2 };
      const res = validate(card);
      return { pass: res.ok, details: res.ok ? 'Validated successfully' : res.reason };
    }
  },
  {
    id: 'acc-5',
    name: 'ACCEPT: "Water the plant on your desk."',
    category: 'accept',
    run: () => {
      const card: Card = { action: "Water the plant on your desk.", why_gentle: "Gives life to your desk.", time_box_minutes: 2 };
      const res = validate(card);
      return { pass: res.ok, details: res.ok ? 'Validated successfully' : res.reason };
    }
  },

  // REJECT tests
  {
    id: 'rej-1',
    name: 'REJECT: "Open your email and reply to your boss." (multi-action: and)',
    category: 'reject',
    run: () => {
      const card = { action: "Open your email and reply to your boss.", why_gentle: "Step.", time_box_minutes: 5 };
      const res = validate(card);
      return { pass: !res.ok, details: !res.ok ? `Rejected correctly (${res.reason})` : 'Should have rejected' };
    }
  },
  {
    id: 'rej-2',
    name: 'REJECT: "Stand up then stretch." (multi-action: then)',
    category: 'reject',
    run: () => {
      const card = { action: "Stand up then stretch.", why_gentle: "Step.", time_box_minutes: 1 };
      const res = validate(card);
      return { pass: !res.ok, details: !res.ok ? `Rejected correctly (${res.reason})` : 'Should have rejected' };
    }
  },
  {
    id: 'rej-3',
    name: 'REJECT: "Reply to the three emails." (high effort: reply)',
    category: 'reject',
    run: () => {
      const card = { action: "Reply to the three emails.", why_gentle: "Step.", time_box_minutes: 5 };
      const res = validate(card);
      return { pass: !res.ok, details: !res.ok ? `Rejected correctly (${res.reason})` : 'Should have rejected' };
    }
  },
  {
    id: 'rej-4',
    name: 'REJECT: "Write the entire report." (verb not followed by down, and scope word)',
    category: 'reject',
    run: () => {
      const card = { action: "Write the entire report.", why_gentle: "Step.", time_box_minutes: 5 };
      const res = validate(card);
      return { pass: !res.ok, details: !res.ok ? `Rejected correctly (${res.reason})` : 'Should have rejected' };
    }
  },
  {
    id: 'rej-5',
    name: 'REJECT: "Clean the whole kitchen." (verb not allowlisted)',
    category: 'reject',
    run: () => {
      const card = { action: "Clean the whole kitchen.", why_gentle: "Step.", time_box_minutes: 5 };
      const res = validate(card);
      return { pass: !res.ok, details: !res.ok ? `Rejected correctly (${res.reason})` : 'Should have rejected' };
    }
  },
  {
    id: 'rej-6',
    name: 'REJECT: "Open the file, read it, close it." (commas)',
    category: 'reject',
    run: () => {
      const card = { action: "Open the file, read it, close it.", why_gentle: "Step.", time_box_minutes: 5 };
      const res = validate(card);
      return { pass: !res.ok, details: !res.ok ? `Rejected correctly (${res.reason})` : 'Should have rejected' };
    }
  },
  {
    id: 'rej-7',
    name: 'REJECT: "Water the plant on your desk and your balcony garden." (and)',
    category: 'reject',
    run: () => {
      const card = { action: "Water the plant on your desk and your balcony garden.", why_gentle: "Step.", time_box_minutes: 5 };
      const res = validate(card);
      return { pass: !res.ok, details: !res.ok ? `Rejected correctly (${res.reason})` : 'Should have rejected' };
    }
  },
  {
    id: 'rej-8',
    name: 'REJECT: "Open the window. Rest." (two sentences)',
    category: 'reject',
    run: () => {
      const card = { action: "Open the window. Rest.", why_gentle: "Step.", time_box_minutes: 1 };
      const res = validate(card);
      return { pass: !res.ok, details: !res.ok ? `Rejected correctly (${res.reason})` : 'Should have rejected' };
    }
  },
  {
    id: 'rej-9',
    name: 'REJECT: Any action over 15 words',
    category: 'reject',
    run: () => {
      const card = { action: "Take one step forward and walk across the entire room to inspect the bookshelf right now.", why_gentle: "Step.", time_box_minutes: 2 };
      const res = validate(card);
      return { pass: !res.ok, details: !res.ok ? `Rejected correctly (${res.reason})` : 'Should have rejected' };
    }
  },
  {
    id: 'rej-10',
    name: 'REJECT: time_box 0',
    category: 'reject',
    run: () => {
      const card = { action: "Drink a glass of water.", why_gentle: "Step.", time_box_minutes: 0 };
      const res = validate(card);
      return { pass: !res.ok, details: !res.ok ? `Rejected correctly (${res.reason})` : 'Should have rejected' };
    }
  },
  {
    id: 'rej-11',
    name: 'REJECT: time_box 11',
    category: 'reject',
    run: () => {
      const card = { action: "Drink a glass of water.", why_gentle: "Step.", time_box_minutes: 11 };
      const res = validate(card);
      return { pass: !res.ok, details: !res.ok ? `Rejected correctly (${res.reason})` : 'Should have rejected' };
    }
  },
  {
    id: 'rej-12',
    name: 'REJECT: time_box "5" (string)',
    category: 'reject',
    run: () => {
      const card = { action: "Drink a glass of water.", why_gentle: "Step.", time_box_minutes: "5" };
      const res = validate(card);
      return { pass: !res.ok, details: !res.ok ? `Rejected correctly (${res.reason})` : 'Should have rejected' };
    }
  },

  // FALLBACKS and MICRO cards
  {
    id: 'fal-1',
    name: 'VALIDATE: All FALLBACKS cards pass validate()',
    category: 'fallback',
    run: () => {
      const failures: string[] = [];
      for (const card of FALLBACKS) {
        const res = validate(card);
        if (!res.ok) failures.push(`${card.action}: ${res.reason}`);
      }
      return {
        pass: failures.length === 0,
        details: failures.length === 0 ? `${FALLBACKS.length} of ${FALLBACKS.length} cards valid` : failures.join('; ')
      };
    }
  },
  {
    id: 'fal-2',
    name: 'VALIDATE: All MICRO cards pass validate()',
    category: 'fallback',
    run: () => {
      const failures: string[] = [];
      for (const card of MICRO) {
        const res = validate(card);
        if (!res.ok) failures.push(`${card.action}: ${res.reason}`);
      }
      return {
        pass: failures.length === 0,
        details: failures.length === 0 ? `${MICRO.length} of ${MICRO.length} cards valid` : failures.join('; ')
      };
    }
  },

  // SAFETY checks
  {
    id: 'saf-1',
    name: 'SAFETY: needsCare("I want to die") is true',
    category: 'safety',
    run: () => {
      const matched = needsCare("I want to die");
      return { pass: matched, details: matched ? 'Correctly flagged as care' : 'Failed to flag' };
    }
  },
  {
    id: 'saf-2',
    name: 'SAFETY: needsCare("deadline thursday, boss emailed 3x") is false',
    category: 'safety',
    run: () => {
      const matched = needsCare("deadline thursday, boss emailed 3x");
      return { pass: !matched, details: !matched ? 'Correctly permitted' : 'Incorrectly flagged' };
    }
  },

  // PREFERENCE / AVOID checks
  {
    id: 'pref-1',
    name: 'AVOID: "Screens or messages" rejects email and phone',
    category: 'preferences',
    run: () => {
      const r1 = validateAvoidPreferences("Open your boss's email.", ["Screens or messages"]);
      const r2 = validateAvoidPreferences("Put your phone face down.", ["Screens or messages"]);
      const r3 = validateAvoidPreferences("Drink a glass of water.", ["Screens or messages"]);
      const pass = !r1.ok && !r2.ok && r3.ok;
      return { pass, details: pass ? 'Rejected screens/messages and accepted water' : 'Failed avoid check' };
    }
  },
  {
    id: 'pref-2',
    name: 'AVOID: "Going outside" rejects outside and walk',
    category: 'preferences',
    run: () => {
      const r1 = validateAvoidPreferences("Take a walk outside.", ["Going outside"]);
      const r2 = validateAvoidPreferences("Open a window.", ["Going outside"]);
      const pass = !r1.ok && r2.ok;
      return { pass, details: pass ? 'Rejected outside and allowed window' : 'Failed avoid check' };
    }
  },
  {
    id: 'pref-3',
    name: 'AVOID: "Talking to people" rejects speak and call',
    category: 'preferences',
    run: () => {
      const r1 = validateAvoidPreferences("Speak to a colleague.", ["Talking to people"]);
      const r2 = validateAvoidPreferences("Drink a glass of water.", ["Talking to people"]);
      const pass = !r1.ok && r2.ok;
      return { pass, details: pass ? 'Rejected talking and allowed water' : 'Failed avoid check' };
    }
  },
  {
    id: 'pref-4',
    name: 'AVOID: "Anything physical" rejects standing and stretching',
    category: 'preferences',
    run: () => {
      const r1 = validateAvoidPreferences("Stand up slowly.", ["Anything physical"]);
      const r2 = validateAvoidPreferences("Breathe out slowly.", ["Anything physical"]);
      const pass = !r1.ok && r2.ok;
      return { pass, details: pass ? 'Rejected physical and allowed breathing' : 'Failed avoid check' };
    }
  }
];

export function SelfTestPage({ onNavigateHome }: { onNavigateHome: () => void }) {
  const [testResults, setTestResults] = useState<Array<{ id: string; pass: boolean; details?: string }>>(() =>
    TESTS.map(t => ({ id: t.id, ...t.run() }))
  );

  const passedCount = testResults.filter(r => r.pass).length;
  const totalCount = testResults.length;

  function handleReRun() {
    setTestResults(TESTS.map(t => ({ id: t.id, ...t.run() })));
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-xs font-medium text-[var(--subtle-ink)] hover:text-[var(--text-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded p-1 cursor-pointer transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Still
        </button>

        <button
          onClick={handleReRun}
          className="px-3 py-1.5 rounded text-xs text-[var(--subtle-ink)] hover:text-[var(--text-ink)] bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent-sage)] transition-colors cursor-pointer"
        >
          Run tests again
        </button>
      </div>

      <div className="space-y-2">
        <h1 className="font-serif-card text-2xl sm:text-3xl text-[var(--text-ink)] font-normal">
          Self Test
        </h1>
        <p className="text-sm text-[var(--subtle-ink)]">
          Runs all constraint checks and safety rules in your browser.
        </p>
      </div>

      <div className="p-4 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-ink)]">
          Summary
        </span>
        <span className="text-sm font-medium text-[var(--accent-sage)]">
          {passedCount} of {totalCount} passed
        </span>
      </div>

      <div className="space-y-3">
        {TESTS.map(test => {
          const res = testResults.find(r => r.id === test.id);
          const passed = res?.pass ?? false;

          return (
            <div
              key={test.id}
              className="p-3.5 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] flex items-start gap-3 transition-colors"
            >
              <span
                className={`mt-0.5 p-0.5 rounded flex items-center justify-center ${
                  passed
                    ? 'text-[var(--accent-sage)] bg-[var(--accent-sage)]/10'
                    : 'text-[var(--dim-text)] bg-[var(--card-border)]'
                }`}
                aria-label={passed ? 'Passed' : 'Failed'}
              >
                {passed ? <CheckIcon className="w-4 h-4" /> : <CrossIcon className="w-4 h-4" />}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-ink)] leading-snug">
                  {test.name}
                </p>
                {res?.details && (
                  <p className="text-xs text-[var(--dim-text)] mt-1">
                    {res.details}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
