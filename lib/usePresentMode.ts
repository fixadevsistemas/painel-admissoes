"use client";

import { useEffect, useRef, useState } from "react";

export function usePresentMode<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [presenting, setPresenting] = useState(false);

  useEffect(() => {
    function onChange() {
      setPresenting(document.fullscreenElement === ref.current);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggle() {
    if (document.fullscreenElement === ref.current) {
      document.exitFullscreen().catch(() => {});
    } else {
      ref.current?.requestFullscreen().catch(() => {});
    }
  }

  return { ref, presenting, toggle };
}
