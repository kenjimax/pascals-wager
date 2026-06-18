"use client";

interface Props {
  onClick: () => void;
}

export function DisclaimerChip({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="cp-tag text-[10px] md:text-[11px] cursor-pointer hover:border-cp-cyan/30 transition-colors"
      aria-label="Open model limitations panel"
    >
      A model of one prudential argument, not advice on what to believe.
    </button>
  );
}
