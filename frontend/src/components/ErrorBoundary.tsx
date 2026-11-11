import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-slate-800">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {this.props.fallbackTitle || 'Something went wrong'}
            </h2>
            <p className="text-xs text-slate-500">
              {this.state.error?.message || 'An unexpected rendering error occurred. Please refresh or return to dashboard.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-md shadow-teal-700/20"
              >
                <RefreshCw size={14} /> Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                <Home size={14} /> Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
