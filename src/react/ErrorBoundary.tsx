import React from "react";
import { captureException } from "../runtime/client";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode);
  onError?: (error: Error, info: React.ErrorInfo) => void;
  extra?: Record<string, unknown>;
};

type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, {
      extra: {
        type: "react.error_boundary",
        componentStack: info.componentStack,
        ...(this.props.extra ?? {})
      }
    });
    this.props.onError?.(error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { fallback } = this.props;
    if (!fallback) return <div>Something went wrong.</div>;
    return typeof fallback === "function" ? fallback(error) : fallback;
  }
}
