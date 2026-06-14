import React, { Component, type ReactNode } from 'react';
import { logClientError } from '../lib/errorLogger';
import GameIcon from './GameIcon';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryKey: number;
}

// DOM reconciliation errors caused by browser extensions (Google Translate
// rewrites text nodes into <font> tags) — recoverable by remounting the tree.
function isDomMangleError(error: Error): boolean {
  return /removeChild|insertBefore|appendChild/.test(error.message);
}

export class ErrorBoundary extends Component<Props, State> {
  private autoRetries = 0;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    logClientError(
      error.message,
      (error.stack ?? '') + '\n\nComponent stack:' + errorInfo.componentStack,
      'react',
    );
    // Auto-recover from extension-mangled DOM: remount the whole subtree
    // (retryKey change) instead of showing the crash screen. Max 3 attempts
    // per session so a genuinely broken render can't loop forever.
    if (isDomMangleError(error) && this.autoRetries < 3) {
      this.autoRetries++;
      this.setState(s => ({ hasError: false, error: null, retryKey: s.retryKey + 1 }));
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
          <div className="max-w-md w-full bg-slate-900 border-2 border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-400 text-xl mb-4"><GameIcon name="warning" size={16} color="#f87171" /> Coś poszło nie tak</p>
            <p className="text-slate-400 text-sm mb-4">
              {this.state.error?.message || 'Nieznany błąd'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            >
              Odśwież stronę
            </button>
          </div>
        </div>
      );
    }

    return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
  }
}
