import React, { Component, ErrorInfo, ReactNode } from 'react';
import { LeafIcon, RefreshIcon } from './Icons.tsx';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      showDetails: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In keeping with Still's privacy-by-design, we do not log or send user text to telemetry
    console.warn('[Still ErrorBoundary caught an unexpected error]:', error.message, errorInfo.componentStack);
  }

  handleStartFresh = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-[640px] my-auto p-6 sm:p-8 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm animate-card-enter space-y-5">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-full bg-[var(--input-bg)] text-[var(--accent-sage)]">
              <LeafIcon className="w-6 h-6" />
            </span>
            <div>
              <h2 className="font-serif-card text-xl sm:text-2xl font-normal text-[var(--text-ink)]">
                {this.props.fallbackTitle || 'Still remains with you.'}
              </h2>
              <p className="text-xs text-[var(--dim-text)]">
                A temporary glitch occurred, but your thoughts remain completely safe and unrecorded.
              </p>
            </div>
          </div>

          <p className="text-sm text-[var(--subtle-ink)] leading-relaxed font-serif-card">
            You don't have to carry anything extra right now. Take a deep breath, and let's begin quietly again.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleStartFresh}
              className="px-4 py-2.5 rounded-md text-xs font-medium bg-[var(--accent-sage)] text-white hover:bg-[var(--accent-sage-hover)] transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
              <span>Start fresh</span>
            </button>

            <button
              type="button"
              onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
              className="text-xs text-[var(--dim-text)] hover:text-[var(--text-ink)] underline cursor-pointer"
            >
              {this.state.showDetails ? 'Hide details' : 'Show details'}
            </button>
          </div>

          {this.state.showDetails && this.state.error && (
            <div className="p-3 rounded bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-mono text-[var(--subtle-ink)] overflow-x-auto">
              <p className="font-bold text-red-400 mb-1">{this.state.error.name}: {this.state.error.message}</p>
              {this.state.error.stack && (
                <pre className="text-[10px] opacity-80 whitespace-pre-wrap">{this.state.error.stack.slice(0, 500)}</pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
