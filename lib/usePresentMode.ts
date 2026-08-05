"use client";

import { useEffect, useRef, useState } from "react";
import {
  PRESENTATION_ORDER,
  registerSection,
  stepSection,
  type SectionKey,
} from "./presentationRegistry";

export function usePresentMode<T extends HTMLElement>(sectionKey: SectionKey) {
  const ref = useRef<T>(null);
  const [presenting, setPresenting] = useState(false);

  useEffect(() => {
    registerSection(sectionKey, ref.current);
    return () => registerSection(sectionKey, null);
  }, [sectionKey]);

  useEffect(() => {
    function onChange() {
      setPresenting(document.fullscreenElement === ref.current);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!presenting) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        stepSection(sectionKey, 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        stepSection(sectionKey, -1);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [presenting, sectionKey]);

  function toggle() {
    if (document.fullscreenElement === ref.current) {
      document.exitFullscreen().catch(() => {});
    } else {
      ref.current?.requestFullscreen().catch(() => {});
    }
  }

  return {
    ref,
    presenting,
    toggle,
    next: () => stepSection(sectionKey, 1),
    prev: () => stepSection(sectionKey, -1),
    index: PRESENTATION_ORDER.indexOf(sectionKey),
    total: PRESENTATION_ORDER.length,
  };
}
