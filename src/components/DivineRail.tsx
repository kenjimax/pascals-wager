"use client";
import { useState, useEffect } from "react";

interface DivineImage {
  src: string;
  position: string;
  artist: string;
  title: string;
  date: string;
}

// Only vertically composed images belong in the tall rail. Landscape works (the
// Sistine ceiling) crop to an unreadable dark center sliver here, so they are
// kept out. The Ancient of Days figure and Dore's Empyrean both fill the rail
// and read clearly wherever the gutter is visible.
const LEFT_IMAGES: DivineImage[] = [
  {
    src: "/divine/ancient-of-days.jpg",
    position: "top center",
    artist: "Blake",
    title: "The Ancient of Days",
    date: "1794",
  },
  {
    src: "/divine/dore-paradiso.jpg",
    position: "center",
    artist: "Dore",
    title: "Paradiso, the Empyrean",
    date: "1868",
  },
];

const RIGHT_IMAGE: DivineImage = {
  src: "/divine/creation-of-adam.jpg",
  position: "center",
  artist: "Michelangelo",
  title: "The Creation of Adam",
  date: "c. 1512",
};

const ROTATION_MS = 5 * 60 * 1000;

function getCurrentImageIndex(count: number): number {
  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  return Math.floor(minutesSinceMidnight / 5) % count;
}

function getBasePath(): string {
  if (typeof window === "undefined") return "";
  const meta = document.querySelector('meta[name="x-base-path"]');
  if (meta) return meta.getAttribute("content") || "";
  const path = window.location.pathname;
  if (path.startsWith("/pascals-wager")) return "/pascals-wager";
  return "";
}

function Rail({
  image,
  side,
  opacity = 1,
}: {
  image: DivineImage;
  side: "left" | "right";
  opacity?: number;
}) {
  const basePath = getBasePath();
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  return (
    <div
      className={`fixed top-0 bottom-0 ${side === "left" ? "left-0" : "right-0"} w-[200px] 2xl:w-[280px] z-10 hidden xl:flex flex-col`}
      aria-hidden="true"
      style={{ pointerEvents: "none", opacity }}
    >
      {/* Image container */}
      <div className="flex-1 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${basePath}${image.src}`}
          alt=""
          className={`w-full h-full object-cover ${!prefersReducedMotion ? "transition-opacity duration-1000" : ""}`}
          style={{ objectPosition: image.position }}
          loading="lazy"
        />
        {/* Scanline overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 6px)",
          }}
        />
        {/* Corner brackets */}
        <div className="absolute top-2 left-2 right-2 bottom-2 border border-[rgba(0,240,255,0.15)] pointer-events-none" />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            boxShadow: "inset 0 0 40px rgba(0,240,255,0.03), inset 0 -60px 40px rgba(6,6,15,0.7)",
          }}
        />
      </div>
      {/* Caption */}
      <div
        className="px-3 py-2 text-center border-t border-[rgba(0,240,255,0.1)]"
        style={{
          background: "linear-gradient(0deg, rgba(0,240,255,0.03), transparent)",
        }}
      >
        <span className="font-mono text-[9px] text-[rgba(0,240,255,0.35)] tracking-wider">
          {image.artist}, {image.title}, {image.date}
        </span>
      </div>
      {/* Edge glow */}
      <div
        className={`absolute top-0 bottom-0 ${side === "left" ? "right-0" : "left-0"} w-px`}
        style={{
          background: "linear-gradient(180deg, rgba(0,240,255,0.3), rgba(0,240,255,0.08) 30%, rgba(0,240,255,0.08) 70%, rgba(0,240,255,0.3))",
          boxShadow: "0 0 8px rgba(0,240,255,0.1)",
        }}
      />
    </div>
  );
}

export function DivineRail() {
  // Deterministic initial index so the static-export HTML and the first client
  // render agree (a time-based initial value would mismatch and trip a
  // hydration error). The real, time-rotated index is set immediately after
  // mount in the effect below.
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(getCurrentImageIndex(LEFT_IMAGES.length));
    const now = new Date();
    const minutesIntoSlot = now.getMinutes() % 5;
    const msUntilNext =
      (5 - minutesIntoSlot) * 60 * 1000 -
      now.getSeconds() * 1000 -
      now.getMilliseconds();

    const firstTimeout = setTimeout(() => {
      setImageIndex(getCurrentImageIndex(LEFT_IMAGES.length));
      const interval = setInterval(() => {
        setImageIndex(getCurrentImageIndex(LEFT_IMAGES.length));
      }, ROTATION_MS);
      return () => clearInterval(interval);
    }, msUntilNext);

    return () => clearTimeout(firstTimeout);
  }, []);

  return (
    <>
      <Rail image={LEFT_IMAGES[imageIndex]} side="left" />
      <Rail image={RIGHT_IMAGE} side="right" opacity={0.6} />
    </>
  );
}
