import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-3xl">⚠️</p>
          <p className="text-[0.95rem] font-light text-[#2b2b2b]">
            Something went wrong
          </p>
          <p className="max-w-sm text-[0.8rem] text-[rgba(60,55,45,0.65)]">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 cursor-pointer rounded-full border border-[rgba(100,85,65,0.4)] bg-white/50 px-5 py-2 text-[0.65rem] uppercase tracking-[0.12em] text-[rgba(55,48,38,0.9)] transition-all hover:bg-white/80"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
