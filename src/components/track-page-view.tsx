"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTrackAction } from "@/hooks/use-track-action";

export function TrackPageView() {
  const pathname = usePathname();
  const trackAction = useTrackAction();
  const lastPath = useRef("");

  useEffect(() => {
    if (pathname !== lastPath.current) {
      lastPath.current = pathname;
      trackAction("page_view", { path: pathname });
    }
  }, [pathname, trackAction]);

  return null;
}
