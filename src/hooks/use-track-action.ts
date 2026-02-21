import { useCallback } from "react";
import { usePathname } from "next/navigation";

export function useTrackAction() {
  const pathname = usePathname();

  const trackAction = useCallback(
    (actionType: string, actionData?: Record<string, unknown>) => {
      // Fire and forget - don't block the UI
      fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType,
          actionData,
          pagePath: pathname,
        }),
      }).catch(() => {
        // Silently fail - tracking should never break the app
      });
    },
    [pathname]
  );

  return trackAction;
}
