import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('[FLINT ErrorBoundary] Uncaught runtime exception:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    this.handleReset();
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      const isDev = Boolean(import.meta.env.DEV);

      return (
        <div className="min-h-[60vh] flex items-center justify-center py-20 px-6 bg-[#FAF9F6]">
          <div className="max-w-lg w-full bg-[#FAF9F6] border border-[#0A0A0A]/15 p-8 sm:p-12 text-center space-y-6 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#0A0A0A]/5 flex items-center justify-center text-[#0A0A0A]">
              <AlertCircle className="w-6 h-6 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <span className="text-[0.65rem] tracking-[0.3em] uppercase text-[#736E65] block font-medium">
                MAISON NOTICE
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl tracking-wide uppercase text-[#0A0A0A]">
                {this.props.fallbackTitle || 'EXPERIENCE INTERRUPTED'}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#736E65] leading-relaxed font-light">
              {this.props.fallbackMessage ||
                'An unexpected error interrupted this view. Please try reloading or return to the main archive.'}
            </p>

            {isDev && this.state.error && (
              <details className="text-left text-[0.7rem] bg-[#0A0A0A]/5 p-3 rounded text-red-700 overflow-x-auto font-mono">
                <summary className="cursor-pointer font-bold mb-1">
                  Debug Details ({this.state.error.name})
                </summary>
                <div className="mt-1 whitespace-pre-wrap">
                  {this.state.error.message}
                </div>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-[0.65rem] text-[#0A0A0A]/70 overflow-x-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-[#0A0A0A] text-[#FAF9F6] text-xs font-medium tracking-[0.2em] uppercase hover:bg-black transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RELOAD VIEW</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 border border-[#0A0A0A]/30 text-[#0A0A0A] text-xs font-medium tracking-[0.2em] uppercase hover:border-[#0A0A0A] hover:bg-[#0A0A0A]/5 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>RETURN HOME</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
