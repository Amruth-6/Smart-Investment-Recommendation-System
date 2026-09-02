import React from "react";
import { AlertTriangle, Info } from "lucide-react";

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-manrope text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`rounded-xl border border-white/[0.08] bg-[#12151C] transition-colors duration-200 hover:border-white/[0.14] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
      {children}
    </div>
  );
}

export function Disclaimer({ text }) {
  return (
    <div
      className="mt-8 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-4"
      data-testid="disclaimer-banner"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <p className="text-xs leading-relaxed text-amber-200/80">
        {text ||
          "This application is developed for educational and research purposes. It provides analytical investment suggestions based on user-provided information and available datasets. It does not guarantee returns and should not be considered a substitute for professional financial advice."}
      </p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#12151C]/50 px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
          <Icon className="h-6 w-6 text-slate-500" />
        </div>
      )}
      <h3 className="font-manrope text-lg font-semibold text-slate-200">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Warning({ children }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3 text-sm text-red-200/90">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
      <span>{children}</span>
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}
