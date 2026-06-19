"use client";

interface Props {
  onClick: () => void;
}

export function DisclaimerChip({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="cp-tag text-[0.625rem] md:text-[0.6875rem] cursor-pointer hover:border-cp-cyan/30 transition-colors"
      aria-label="Open model limitations panel"
    >
      About this model and its limits
    </button>
  );
}
