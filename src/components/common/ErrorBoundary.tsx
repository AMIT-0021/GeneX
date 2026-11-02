import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Genex Uncaught Application Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.href = window.location.origin + window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
          <div className="max-w-md w-full bg-white rounded-2xl border-2 border-red-200 shadow-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center border border-red-200 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Application Error</h1>
                <p className="text-xs text-slate-500 font-mono">Genex Diagnostic Suite</p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-100 rounded-xl p-4 text-xs text-red-900 font-mono overflow-x-auto max-h-32">
              <p className="font-bold mb-1">
                {this.state.error?.name || 'Error'}: {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </p>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Genex encountered an unexpected state. You can reload the application or reset stored sessions to recover.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-[#5C8A6B] hover:bg-[#4E765B] active:scale-[0.99] text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>

              <button
                onClick={this.handleResetAndReload}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium flex items-center justify-center gap-2 transition-all text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                Clear Cached Storage & Reset
              </button>

              <a
                href="/"
                className="block text-center text-xs text-slate-400 hover:text-slate-600 py-1"
              >
                <Home className="w-3.5 h-3.5 inline mr-1" />
                Return to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
