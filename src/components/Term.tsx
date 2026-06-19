"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { getGlossaryEntry } from "@/lib/glossary";

interface Props {
  termKey: string;
  children?: React.ReactNode;
}

export function Term({ termKey, children }: Props) {
  const entry = getGlossaryEntry(termKey);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const id = `gloss-${termKey}`;

  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.focus();
      }
    };
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open, handleClose]);

  if (!entry) return <>{children ?? termKey}</>;

  return (
    <span className="relative inline-block">
      <span
        ref={ref}
        role="button"
        tabIndex={0}
        title={entry.gloss}
        aria-describedby={open ? id : undefined}
        className="border-b border-dotted border-cp-cyan/40 cursor-help text-cp-text hover:text-cp-cyan transition-colors"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!popoverRef.current?.contains(e.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
      >
        {children ?? entry.term}
      </span>
      {open && (
        <div
          ref={popoverRef}
          id={id}
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 text-xs text-cp-text bg-surface-2 border border-cp-cyan/20 shadow-lg leading-relaxed"
          style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}
        >
          <div className="font-rajdhani font-semibold text-cp-cyan text-[11px] uppercase tracking-wider mb-1">
            {entry.term}
          </div>
          {entry.gloss}
        </div>
      )}
    </span>
  );
}
