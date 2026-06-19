"use client";
import { useRef, type PointerEvent as ReactPointerEvent } from "react";

interface Props {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  className?: string;
  "aria-label"?: string;
  "aria-valuetext"?: string;
}

// A range input that drives dragging from explicit pointer math instead of the
// browser's native range-drag, which does not work in WebKit/Safari (the thumb
// cannot be dragged with the mouse there even though keyboard input does). On
// pointer down we snapshot the track geometry and attach window-level move/up
// listeners, then translate the pointer x into a value, so a press-and-drag
// updates continuously and identically in Chromium, Firefox, and Safari.
//
// The geometry is captured once at pointer down rather than read on every move:
// the element can briefly detach during the controlled re-render cascade (the
// ref reads null mid-drag), and the track does not move while being dragged, so
// a fixed snapshot is both correct and robust. The native <input> is kept for
// keyboard accessibility and the focus ring.
export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  className,
  ...aria
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const beginDrag = (e: ReactPointerEvent<HTMLInputElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    // Stop the native range control from claiming the pointer. In WebKit it
    // captures the drag and swallows the move events before our window
    // listeners see them, so the thumb never tracks the mouse. We drive the
    // value ourselves and focus manually so keyboard access is preserved.
    e.preventDefault();
    el.focus();
    const decimals = (String(step).split(".")[1] || "").length;
    const valueAt = (clientX: number) => {
      const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const snapped = Math.round((min + frac * (max - min)) / step) * step;
      const clamped = Math.min(max, Math.max(min, snapped));
      return decimals > 0 ? parseFloat(clamped.toFixed(decimals)) : clamped;
    };

    onChangeRef.current(valueAt(e.clientX));
    const move = (ev: PointerEvent) => onChangeRef.current(valueAt(ev.clientX));
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  return (
    <input
      ref={ref}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      onPointerDown={beginDrag}
      className={className}
      {...aria}
    />
  );
}
