"use client";

export function GlitchTitle({ text }: { text: string }) {
  return (
    <h1
      className="glitch-title text-2xl md:text-3xl text-cp-text font-rajdhani uppercase"
      data-text={text}
      aria-label={text}
    >
      {text}
    </h1>
  );
}
