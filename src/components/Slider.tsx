import type { CSSProperties } from "react";
import { cn } from "../lib/cn";

interface Props {
  value: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;
  label: string;
  valueText?: string;
  className?: string;
}

export function Slider({ value, max, step = 0.01, onChange, onCommit, label, valueText, className }: Props) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <input
      type="range"
      className={cn("range", className)}
      min={0}
      max={max || 1}
      step={step}
      value={value}
      aria-label={label}
      aria-valuetext={valueText}
      style={{ "--pct": `${pct}%` } as CSSProperties}
      onChange={(e) => onChange(Number(e.target.value))}
      onPointerUp={(e) => onCommit?.(Number(e.currentTarget.value))}
      onKeyUp={(e) => onCommit?.(Number(e.currentTarget.value))}
    />
  );
}
