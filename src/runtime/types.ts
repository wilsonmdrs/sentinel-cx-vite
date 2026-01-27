import { CoralogixDomain } from "@coralogix/browser/src/types";

export type SentinelUser = {
  id: string;
  email?: string;
  name?: string;
};

export type SentinelInit = {
  publicKey: string;
  domain: CoralogixDomain; // "EU1" | "EU2" | "US1" | ...
  app: string;
  env: string; // dev|qa|prod
  version: string; // MUST match sourcemap upload version
  tags?: Record<string, string>;
  // Reserved for future: ignoreErrors, sampling, etc.
};

export type CaptureOptions = {
  extra?: Record<string, unknown>;
};
