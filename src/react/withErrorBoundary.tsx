import React from "react";
import { ErrorBoundary } from "./ErrorBoundary";

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  opts?: React.ComponentProps<typeof ErrorBoundary>,
) {
  return function Wrapped(props: P) {
    return (
      <ErrorBoundary {...opts}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
