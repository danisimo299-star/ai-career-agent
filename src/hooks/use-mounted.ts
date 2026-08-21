import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/** True only once the component has mounted on the client — avoids SSR/client markup mismatches for client-only UI (e.g. reading `next-themes`). */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
