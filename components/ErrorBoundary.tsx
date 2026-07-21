"use client";

// React error boundary. Wraps each panel so a crash in one
// component doesn't take the whole page down. Forwards errors to
// Sentry in production; falls back to console.error if unavailable.

import { Component, type ReactNode } from "react";

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode; label?: string }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Forward to Sentry if available, always log to console.
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ""}]`, error);
    try {
      const Sentry = (globalThis as any).__SENTRY__;
      if (Sentry?.captureException) {
        Sentry.captureException(error);
      }
    } catch {
      // Sentry not available — already logged above.
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="panel p-4 text-sm">
          <p className="font-medium text-danger">
            {this.props.label ? `${this.props.label} failed to load` : "Something went wrong"}
          </p>
          <p className="text-fg-secondary mt-1 text-xs">{this.state.error.message}</p>
          <button onClick={this.reset} className="btn mt-3 text-xs">Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
