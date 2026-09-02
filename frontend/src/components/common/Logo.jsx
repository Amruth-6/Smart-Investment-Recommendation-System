import React from "react";
import { TrendingUp } from "lucide-react";

export function Logo({ className = "", showText = true }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} data-testid="app-logo">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/30">
        <TrendingUp className="h-5 w-5 text-blue-400" strokeWidth={2.2} />
      </div>
      {showText && (
        <div className="leading-tight">
          <div className="font-manrope text-[15px] font-bold tracking-tight text-slate-50">
            SmartInvest
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Financial Planning
          </div>
        </div>
      )}
    </div>
  );
}
