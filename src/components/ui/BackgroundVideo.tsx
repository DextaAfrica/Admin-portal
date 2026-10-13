"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BackgroundVideoProps {
  className?: string;
  overlayOpacity?: string;
}

const BACKDROP_IMAGES = [
  "/images/team-dexta.jpg",
  "/images/olufemi-dexta.png",
];

export function BackgroundVideo({
  className,
  overlayOpacity = "bg-black/65 dark:bg-black/75",
}: BackgroundVideoProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [zoomedIn, setZoomedIn] = React.useState(false);

  React.useEffect(() => {
    // Trigger initial slow zoom-in right after mount
    const initialZoom = setTimeout(() => setZoomedIn(true), 100);

    // Alternate zoom-in and zoom-out while cycling between the 2 Dexta images every 9 seconds
    const interval = setInterval(() => {
      setZoomedIn((prev) => !prev);
      setActiveIndex((prev) => (prev + 1) % BACKDROP_IMAGES.length);
    }, 9000);

    return () => {
      clearTimeout(initialZoom);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#07080b]",
        className
      )}
    >
      {/* Dual-Image Cinematic Zoom-In / Zoom-Out Motion Layer */}
      {BACKDROP_IMAGES.map((src, idx) => {
        const isCurrent = idx === activeIndex;
        return (
          <div
            key={src}
            className={cn(
              "absolute inset-0 transition-opacity duration-[2500ms] ease-in-out",
              isCurrent ? "opacity-100" : "opacity-0"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Dexta Africa Backdrop"
              className={cn(
                "h-full w-full object-cover object-top transition-transform duration-[9500ms] ease-in-out will-change-transform",
                isCurrent && zoomedIn ? "scale-115" : "scale-100"
              )}
              style={{
                transform: isCurrent
                  ? zoomedIn
                    ? "scale(1.14)"
                    : "scale(1.0)"
                  : "scale(1.07)",
              }}
            />
          </div>
        );
      })}

      {/* Warm Ambient Crimson Glow */}
      <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-[#ED2618]/15 blur-3xl" />

      {/* Cinematic Vignette & Contrast Overlay */}
      <div className={cn("absolute inset-0 backdrop-blur-[2px]", overlayOpacity)} />

      {/* Deep Bottom Gradient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090c] via-transparent to-black/40" />
    </div>
  );
}
