export type { SentinelInit, SentinelUser, CaptureOptions } from "./runtime/types";
export { initSentinel, captureException, setUser } from "./runtime/client";

export { ErrorBoundary } from "./react/ErrorBoundary";
export { withErrorBoundary } from "./react/withErrorBoundary";
export { useSentinel } from "./react/useSentinel";
