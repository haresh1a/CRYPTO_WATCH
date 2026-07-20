"use client";

// React error boundary. Wraps each panel so a crash in one
// component doesn't take the whole page down. Reports the error
// to the console; in production you'd forward to Sentry here.

import { Component, type ReactNode } from "react";

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode; label?: string }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Replace with a real error reporter in production.
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ""}]`, error);
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
