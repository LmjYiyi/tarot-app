"use client";

import { useEffect, useRef } from "react";

export function MouseTrail() {
  const trailRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only render on desktop
    if (typeof window === "undefined" || window.matchMedia("(max-width: 768px)").matches) {
      return;
    }

    function onMove(e: MouseEvent) {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (trailRef.current) {
        trailRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        trailRef.current.style.opacity = "1";
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (trailRef.current) trailRef.current.style.opacity = "0";
      }, 200);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={trailRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-64 w-64 -translate-x-1/2 -translate-y-1/2"
      style={{
        background:
          "radial-gradient(circle, rgba(197,154,76,0.18) 0%, rgba(197,154,76,0.06) 40%, transparent 70%)",
        filter: "blur(8px)",
        opacity: 0,
        transition: "opacity 200ms ease",
      }}
    />
  );
}
