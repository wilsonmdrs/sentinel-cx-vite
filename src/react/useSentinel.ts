import { useMemo } from "react";
import { captureException, initSentinel, setUser } from "../runtime/client";

export function useSentinel() {
  return useMemo(
    () => ({
      initSentinel,
      captureException,
      setUser
    }),
    []
  );
}
