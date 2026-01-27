import { CoralogixRum } from "@coralogix/browser";
import type { SentinelInit, SentinelUser, CaptureOptions } from "./types";

let initialized = false;

export function initSentinel(init: SentinelInit) {
  if (initialized) return;
  initialized = true;

  CoralogixRum.init({
    public_key: init.publicKey,
    application: init.app,
    version: init.version,
    coralogixDomain: init.domain,
    labels: { env: init.env, ...(init.tags ?? {}) },
    stringifyCustomLogData: true,
  });
}

export function captureException(error: Error, _options?: CaptureOptions) {
  // Keep runtime resilient: never throw
  try {
    CoralogixRum.captureError(error);
  } catch {
    console.log("Coralogix: Error sending error");
    // no-op
  }
}

export function setUser(user: SentinelUser) {
  try {
    CoralogixRum.setUserContext?.({
      user_id: user.id,
      user_email: user?.email || "",
      user_name: user?.name || "",
    });
  } catch {
    console.log("Coralogix: Error setting user context");
    // no-op
  }
}
