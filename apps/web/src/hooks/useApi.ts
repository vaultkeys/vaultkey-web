"use client";

import { useMemo } from "react";
import { useEnv } from "@/hooks/useEnv";
import { makeCloud, makeSDK } from "@/lib/api";

/**
 * Returns `cloud` and `sdk` API clients bound to the currently active
 * environment's base URL.  Use this instead of the legacy singletons
 * imported directly from `@/lib/api` so requests automatically go to
 * the right backend when the user switches environments.
 */
export function useApi() {
  const { baseUrl } = useEnv();

  return useMemo(
    () => ({ cloud: makeCloud(baseUrl), sdk: makeSDK(baseUrl) }),
    [baseUrl],
  );
}