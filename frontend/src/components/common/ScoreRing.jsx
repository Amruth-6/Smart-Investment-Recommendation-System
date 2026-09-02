import React from "react";

export function ScoreRing({ score = 0, size = 160, stroke = 12, label, sublabel, colorOverride }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circ - (pct / 100) * circ;
  const color =
    colorOverride || (pct >= 75 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444");

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono-num text-3xl font-bold text-slate-50">{Math.round(score)}</span>
        {label && <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>}
        {sublabel && <span className="mt-0.5 text-xs text-slate-400">{sublabel}</span>}
      </div>
    </div>
  );
}
