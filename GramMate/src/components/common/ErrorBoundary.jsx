import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Logo from '../brand/Logo';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught runtime error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--gm-bg)] text-[var(--gm-text)] flex flex-col items-center justify-center p-6 select-none">
          <div className="mb-6">
            <Logo size="md" layout="horizontal" />
          </div>

          <div className="w-full max-w-md gm-card p-8 text-center bg-[var(--gm-surface)] border border-[var(--gm-border-strong)] shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>

            <h2 className="text-lg font-bold text-[var(--gm-text)] mb-2">
              Something went wrong
            </h2>

            <p className="text-xs text-[var(--gm-text-secondary)] leading-relaxed mb-6">
              An unexpected error occurred while loading this section. You can try reloading or return to the main feed.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="gm-btn-secondary w-full sm:w-auto text-xs py-2.5 px-4 flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="gm-btn-primary w-full sm:w-auto text-xs py-2.5 px-4 flex items-center justify-center gap-2"
              >
                <Home size={14} />
                <span>Go to Feed</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
