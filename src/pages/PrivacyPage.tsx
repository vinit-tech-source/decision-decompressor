import React from 'react';
import { ArrowLeftIcon } from '../components/Icons.tsx';

export function PrivacyPage({ onNavigateHome }: { onNavigateHome: () => void }) {
  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-[var(--card-border)]">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-xs font-medium text-[var(--subtle-ink)] hover:text-[var(--text-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded p-1 cursor-pointer transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Still
        </button>
      </div>

      <div className="space-y-3">
        <h1 className="font-serif-card text-2xl sm:text-3xl text-[var(--text-ink)] font-normal">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--subtle-ink)]">
          Still is designed to forget you. Here is exactly what happens with your data.
        </p>
      </div>

      <div className="space-y-6 text-sm text-[var(--text-ink)] leading-relaxed">
        <section className="p-5 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] space-y-3">
          <h2 className="font-serif-card text-lg text-[var(--text-ink)]">
            Hosted Mode
          </h2>
          <p className="text-[var(--subtle-ink)]">
            Your text is sent to Google's Gemini API (Gemma 4) to get one answer. In Hosted mode, your chosen preference context (such as focus area, what helps you start, what you prefer to avoid, and energy level) is sent with the request to tailor the single gentle action. Still does not store or log your brain-dump or preference profile. Google's API terms apply.
          </p>
          <p className="text-[var(--subtle-ink)]">
            Still runs no database, no session cookies, no analytics trackers, and no telemetry. Server logs record only the HTTP method, request path, status code, and response latency. Request bodies and model outputs are never written to logs or disk.
          </p>
        </section>

        <section className="p-5 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] space-y-3">
          <h2 className="font-serif-card text-lg text-[var(--text-ink)]">
            Local Mode (Ollama)
          </h2>
          <p className="text-[var(--subtle-ink)]">
            Running on your machine. Nothing leaves this device.
          </p>
          <p className="text-[var(--subtle-ink)]">
            In Local Mode, your browser communicates directly with your local Ollama instance (typically http://localhost:11434). No network request is transmitted to any external server or API.
          </p>
        </section>

        <section className="p-5 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] space-y-3">
          <h2 className="font-serif-card text-lg text-[var(--text-ink)]">
            Safety and Crisis Detection
          </h2>
          <p className="text-[var(--subtle-ink)]">
            If your text contains indicators of self-harm or acute distress, Still halts immediately in memory. It does not call the model, does not log the request, and presents support resources directly.
          </p>
        </section>

        <section className="p-5 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] space-y-3">
          <h2 className="font-serif-card text-lg text-[var(--text-ink)]">
            Browser Storage
          </h2>
          <p className="text-[var(--subtle-ink)]">
            Your brain-dump is kept exclusively in temporary React component memory while the page remains open. Closing the tab, clicking "That's doable", or clicking "Forget this" erases it completely. Only non-sensitive settings (such as your chosen execution mode) and your onboarding preferences (only if you explicitly enable "Remember these on this device") are saved to your browser's local storage. You can clear them at any time with "Forget my preferences" in Settings.
          </p>
        </section>
      </div>
    </div>
  );
}
