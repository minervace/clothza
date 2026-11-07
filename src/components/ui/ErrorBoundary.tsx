// ============================================================
// components/ui/ErrorBoundary.tsx — Clothza v4.0
// React class component error boundary wrapper
// Catches render errors, shows graceful fallback UI
// ============================================================

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children:  ReactNode;
  fallback?: ReactNode;          // Custom fallback UI
  onError?:  (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError:    boolean;
  error:       Error | null;
  errorInfo:   ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ errorInfo: info });
    this.props.onError?.(error, info);
    // In production, send to error monitoring (e.g., Sentry)
    if (import.meta.env.PROD) {
      console.error('[Clothza ErrorBoundary]', error, info);
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            textAlign:      'center',
            padding:        '64px 32px',
            gap:            16,
          }}
        >
          {/* Icon */}
          <div
            style={{
              width:          72,
              height:         72,
              borderRadius:   '50%',
              background:     'var(--danger-light)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle
              size={32}
              color="var(--danger)"
              strokeWidth={1.5}
            />
          </div>

          {/* Heading */}
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize:   'var(--text-heading)',
              fontWeight: 'var(--weight-semibold)',
              color:      'var(--text-primary)',
            }}
          >
            Something went wrong
          </h2>

          {/* Message */}
          <p
            style={{
              fontSize:  'var(--text-body)',
              color:     'var(--text-secondary)',
              maxWidth:  340,
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            An unexpected error occurred. Please try refreshing the page.
          </p>

          {/* Error detail — dev only */}
          {import.meta.env.DEV && this.state.error && (
            <details
              style={{
                marginTop:   8,
                maxWidth:    480,
                textAlign:   'left',
                background:  'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding:     '12px 16px',
                fontSize:    'var(--text-caption)',
                color:       'var(--danger)',
                fontFamily:  'monospace',
                cursor:      'pointer',
              }}
            >
              <summary style={{ cursor: 'pointer', marginBottom: 8 }}>
                Error details (dev only)
              </summary>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                {this.state.error.message}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              className="btn btn-outline"
              onClick={this.reset}
            >
              <RefreshCw size={14} />
              Try again
            </button>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── HOC wrapper for functional components ────────────────────

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
