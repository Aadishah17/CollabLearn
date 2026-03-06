import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-page flex min-h-screen items-center justify-center px-6 py-16 text-white">
          <div className="surface-card w-full max-w-3xl p-8 md:p-10">
            <p className="eyebrow text-red-200">Application error</p>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-5xl">
              The interface hit an unexpected problem.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
              Reload the page to retry. If the issue keeps happening, the details below
              will help track it down quickly.
            </p>

            <div className="mt-8 space-y-4 rounded-[26px] border border-white/10 bg-black/25 p-5 text-left">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  Error
                </p>
                <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-sm text-red-200">
                  {this.state.error ? this.state.error.toString() : 'Unknown error'}
                </pre>
              </div>

              {this.state.errorInfo?.componentStack ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
                    Component stack
                  </p>
                  <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs text-zinc-400">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => window.location.reload()} className="glass-cta">
                Reload page
              </button>
              <button
                type="button"
                onClick={() => window.location.assign('/')}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-blue-400/45 hover:bg-blue-500/12"
              >
                Go to homepage
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
