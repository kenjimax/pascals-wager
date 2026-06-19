"use client";
import { useState, useEffect } from "react";

interface DivineImage {
  src: string;
  position: string;
  artist: string;
  title: string;
  date: string;
}

// A pool of vertically composed public-domain depictions of God, the Trinity,
// and the heavenly vision. Landscape works are deliberately excluded: in the
// tall narrow rail they crop to an unreadable center sliver. Each entry reads
// clearly when object-cover fills the rail. objectPosition is tuned so the
// focal figure stays in frame for portraits where the face sits high.
const POOL: DivineImage[] = [
  { src: "/divine/ancient-of-days.jpg", position: "top center", artist: "Blake", title: "The Ancient of Days", date: "1794" },
  { src: "/divine/blake-job-whirlwind.jpg", position: "center", artist: "Blake", title: "The Lord Answers Job from the Whirlwind", date: "1805" },
  { src: "/divine/blake-mighty-angel.jpg", position: "center", artist: "Blake", title: "A Mighty Angel", date: "1805" },
  { src: "/divine/carracci-trinity-dead-christ.jpg", position: "top center", artist: "Carracci", title: "The Trinity with the Dead Christ", date: "1590" },
  { src: "/divine/degrebber-god-inviting-christ.jpg", position: "center", artist: "de Grebber", title: "God Inviting Christ to His Right Hand", date: "1645" },
  { src: "/divine/dore-creation-of-light.jpg", position: "center", artist: "Dore", title: "The Creation of Light", date: "1866" },
  { src: "/divine/dore-empyrean-light.jpg", position: "center", artist: "Dore", title: "The Empyrean", date: "1868" },
  { src: "/divine/dore-paradiso-canto31-plate.jpg", position: "center", artist: "Dore", title: "Paradiso, the Celestial Rose", date: "1868" },
  { src: "/divine/dore-paradiso.jpg", position: "center", artist: "Dore", title: "Paradiso, the Empyrean", date: "1868" },
  { src: "/divine/dore-zechariah-vision.jpg", position: "center", artist: "Dore", title: "Zechariah's Vision", date: "1866" },
  { src: "/divine/elgreco-holy-trinity.jpg", position: "top center", artist: "El Greco", title: "The Holy Trinity", date: "1577" },
  { src: "/divine/milton-paradise-lost-24.jpg", position: "center", artist: "Dore", title: "Paradise Lost, the Heavenly Host", date: "1866" },
  { src: "/divine/milton-paradise-lost-5.jpg", position: "center", artist: "Dore", title: "Paradise Lost", date: "1866" },
  { src: "/divine/pantocrator-hagia-sophia.jpg", position: "top center", artist: "Byzantine mosaic", title: "Christ Pantocrator, Hagia Sophia", date: "1261" },
  { src: "/divine/pantocrator-sinai.jpg", position: "top center", artist: "Byzantine icon", title: "Christ Pantocrator of Sinai", date: "550" },
  { src: "/divine/pantocrator-spas-sinai.jpg", position: "top center", artist: "Byzantine icon", title: "Christ Pantocrator", date: "1200" },
  { src: "/divine/rembrandt-god-the-father-head.jpg", position: "top center", artist: "Rembrandt", title: "Head of God the Father", date: "1655" },
  { src: "/divine/rublev-trinity.jpg", position: "center", artist: "Rublev", title: "The Holy Trinity", date: "1411" },
  { src: "/divine/velazquez-coronation.jpg", position: "top center", artist: "Velazquez", title: "The Coronation of the Virgin", date: "1644" },
];

const ROTATION_MS = 90 * 1000;

// Baked in at build time by next.config (env.NEXT_PUBLIC_BASE_PATH), so the
// static-export HTML and the hydrated client always agree on the asset prefix.
// Raw <img> src values are not rewritten by Next's basePath, so we prefix them
// here.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Choose two distinct indices into the pool, avoiding the pair currently shown
// where possible so the rotation visibly changes. The two are always different
// from each other, so the same artwork never appears on both rails at once.
function pickPair(count: number, prevLeft: number, prevRight: number): [number, number] {
  if (count < 2) return [0, 0];
  let left = Math.floor(Math.random() * count);
  let right = Math.floor(Math.random() * count);
  let guard = 0;
  while (
    guard++ < 100 &&
    (right === left || left === prevLeft || right === prevRight)
  ) {
    left = Math.floor(Math.random() * count);
    right = Math.floor(Math.random() * count);
  }
  if (right === left) right = (left + 1) % count;
  return [left, right];
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
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  // The rails are fixed to the viewport edges while the content is a centered
  // max-w-7xl column. With this project's 125% root font size, 80rem renders at
  // 1600px, which is the content box width (verified at runtime). The empty
  // gutter beside the content is therefore (100vw - 1600px) / 2 per side. The
  // old fixed widths (200px/280px), shown from the xl breakpoint, were wider
  // than that gutter at every realistic viewport, so the rails sat on top of
  // the content edges (the "weird" behavior). We instead make each rail exactly
  // as wide as its gutter, so the rail's inner edge meets the content box and
  // never overlaps it, capped at 280px so it does not sprawl on ultrawide
  // displays. Below ~130px of gutter (viewport < 1860px) there is too little
  // room to show the imagery legibly, so the rail is hidden.
  //
  // Both numbers are intentionally in px, not rem: a `rem` inside a @media
  // query resolves against the browser default (16px), not the document's
  // root, so a rem breakpoint would disagree with the rem in the width calc
  // (which uses the 20px root). px keeps the breakpoint and the calc keyed to
  // the same rendered 1600px. If max-w-7xl or the 125% root font size changes,
  // update both 1600 and 1860 here.
  return (
    <div
      className={`fixed top-0 bottom-0 ${side === "left" ? "left-0" : "right-0"} z-10 hidden min-[1860px]:flex flex-col`}
      aria-hidden="true"
      style={{ pointerEvents: "none", opacity, width: "min(280px, calc((100vw - 1600px) / 2))" }}
    >
      <div className="flex-1 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={image.src}
          src={`${BASE_PATH}${image.src}`}
          alt=""
          className={`w-full h-full object-cover ${!prefersReducedMotion ? "transition-opacity duration-1000" : ""}`}
          style={{ objectPosition: image.position }}
          loading="lazy"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 6px)",
          }}
        />
        <div className="absolute top-2 left-2 right-2 bottom-2 border border-[rgba(0,240,255,0.15)] pointer-events-none" />
        <div
          className="absolute inset-0"
          style={{
            boxShadow: "inset 0 0 40px rgba(0,240,255,0.03), inset 0 -60px 40px rgba(6,6,15,0.7)",
          }}
        />
      </div>
      <div
        className="px-3 py-2 text-center border-t border-[rgba(0,240,255,0.1)]"
        style={{
          background: "linear-gradient(0deg, rgba(0,240,255,0.03), transparent)",
        }}
      >
        <span className="font-mono text-[0.5625rem] text-[rgba(0,240,255,0.35)] tracking-wider">
          {image.artist}, {image.title}, {image.date}
        </span>
      </div>
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
  // Deterministic initial pair so the static-export HTML and the first client
  // render agree (a random initial value would trip a hydration mismatch). The
  // real randomized pair is set immediately after mount. Left and right start
  // on different images so they are never the same artwork.
  const [pair, setPair] = useState<[number, number]>([0, 1]);

  useEffect(() => {
    setPair(prev => pickPair(POOL.length, prev[0], prev[1]));
    const interval = setInterval(() => {
      setPair(prev => pickPair(POOL.length, prev[0], prev[1]));
    }, ROTATION_MS);
    return () => clearInterval(interval);
  }, []);

  const left = POOL[pair[0]] ?? POOL[0];
  const right = POOL[pair[1]] ?? POOL[1];

  return (
    <>
      <Rail image={left} side="left" />
      <Rail image={right} side="right" opacity={0.6} />
    </>
  );
}
