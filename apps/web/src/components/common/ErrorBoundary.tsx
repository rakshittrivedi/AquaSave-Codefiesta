import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught rendering exception:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-xl border border-rose-800/60 bg-rose-950/20 p-8 text-center max-w-xl mx-auto my-12 backdrop-blur"
        >
          <div className="w-12 h-12 rounded-full bg-rose-950 border border-rose-700/80 flex items-center justify-center mx-auto mb-4 text-rose-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-rose-200">Telemetry Dashboard Offline</h2>
          <p className="text-sm text-[#8B949E] mt-2 font-mono">
            {this.props.fallbackMessage ||
              this.state.error?.message ||
              'Unable to establish communication with telemetry service.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-md bg-[#21262D] text-white text-xs font-mono hover:bg-[#30363D] transition-colors border border-[#30363D]"
            >
              Retry Connection
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-md bg-sky-600 text-white text-xs font-mono hover:bg-sky-500 transition-colors"
            >
              Reload System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
