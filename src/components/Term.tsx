"use client";
import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { getGlossaryEntry } from "@/lib/glossary";

interface Props {
  termKey: string;
  children?: React.ReactNode;
}

interface PopoverPos {
  left: number;
  top: number;
  placement: "above" | "below";
}

const POPOVER_WIDTH = 288; // matches w-72

export function Term({ termKey, children }: Props) {
  const entry = getGlossaryEntry(termKey);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PopoverPos | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const id = `gloss-${termKey}`;

  const handleClose = useCallback(() => setOpen(false), []);

  // Position the popover relative to the trigger in viewport coordinates. The
  // popover is portaled to document.body and fixed-positioned, so it escapes
  // the panel clip-path that previously cut it off. Flip below the trigger when
  // there is not enough room above.
  const reposition = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    const estHeight = 130;
    const placeAbove = r.top > estHeight + margin;
    let left = r.left + r.width / 2 - POPOVER_WIDTH / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - POPOVER_WIDTH - 8));
    const top = placeAbove ? r.top - margin : r.bottom + margin;
    setPos({ left, top, placement: placeAbove ? "above" : "below" });
  }, []);

  useLayoutEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.focus();
      }
    };
    const onPointerDown = (e: MouseEvent) => {
      if (
        popoverRef.current?.contains(e.target as Node) ||
        ref.current?.contains(e.target as Node)
      ) {
        return;
      }
      handleClose();
    };
    const onReflow = () => reposition();
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open, handleClose, reposition]);

  if (!entry) return <>{children ?? termKey}</>;

  return (
    <span className="inline-block">
      <span
        ref={ref}
        role="button"
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        className="border-b border-dotted border-cp-cyan/50 cursor-help text-cp-cyan/90 hover:text-cp-cyan transition-colors"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!popoverRef.current?.contains(e.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        {children ?? entry.term}
      </span>
      {open && pos &&
        createPortal(
          <div
            ref={popoverRef}
            id={id}
            role="tooltip"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className="fixed z-[10000] p-3 text-sm text-cp-text bg-surface-2 border border-cp-cyan/30 shadow-[0_4px_24px_rgba(0,0,0,0.6)] leading-relaxed pointer-events-auto"
            style={{
              left: pos.left,
              top: pos.top,
              width: POPOVER_WIDTH,
              transform: pos.placement === "above" ? "translateY(-100%)" : "none",
              clipPath:
                "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
            }}
          >
            <div className="font-rajdhani font-semibold text-cp-cyan text-xs uppercase tracking-wider mb-1">
              {entry.term}
            </div>
            {entry.gloss}
          </div>,
          document.body,
        )}
    </span>
  );
}
