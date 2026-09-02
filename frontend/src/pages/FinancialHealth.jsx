import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb, PiggyBank, CreditCard, Shield, TrendingUp, Target, Layers } from "lucide-react";
import api from "../lib/api";
import { PageHeader, Card, Skeleton, Disclaimer, SectionLabel } from "../components/common/UI";
import { ScoreRing } from "../components/common/ScoreRing";
import { scoreColor } from "../lib/format";

const CAT_ICONS = {
  Savings: PiggyBank,
  "Debt Management": CreditCard,
  "Emergency Fund": Shield,
  "Investment Discipline": TrendingUp,
  "Goal Readiness": Target,
  Diversification: Layers,
};

export default function FinancialHealth() {
  const { data, isLoading } = useQuery({ queryKey: ["financial-health"], queryFn: async () => (await api.get("/financial-health")).data });

  if (isLoading) return <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-56" />)}</div>;

  const d = data || {};
  const categories = Object.entries(d.categories || {});

  return (
    <div>
      <PageHeader title="Financial Health Score" subtitle="A holistic 0–100 measure of your financial readiness across six dimensions." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-8" data-testid="health-overall-card">
          <SectionLabel>Overall Score</SectionLabel>
          <ScoreRing score={d.overall_score || 0} size={190} label="/ 100" />
          <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
            <div><div className="text-[10px] uppercase text-slate-500">Savings</div><div className="font-mono-num text-sm text-slate-200">{d.metrics?.savings_ratio}%</div></div>
            <div><div className="text-[10px] uppercase text-slate-500">DTI</div><div className="font-mono-num text-sm text-slate-200">{d.metrics?.debt_to_income}%</div></div>
            <div><div className="text-[10px] uppercase text-slate-500">Emerg.</div><div className="font-mono-num text-sm text-slate-200">{d.metrics?.emergency_months}m</div></div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2" data-testid="health-breakdown-card">
          <SectionLabel>Score Breakdown</SectionLabel>
          <div className="grid gap-5 sm:grid-cols-2">
            {categories.map(([name, val]) => {
              const Icon = CAT_ICONS[name] || Layers;
              return (
                <div key={name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-300"><Icon className="h-4 w-4 text-slate-500" />{name}</span>
                    <span className="font-mono-num font-semibold" style={{ color: scoreColor(val) }}>{val}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val}%`, background: scoreColor(val) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6" data-testid="health-suggestions-card">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          <h3 className="font-manrope text-base font-semibold text-slate-100">Personalized Suggestions</h3>
        </div>
        <ul className="space-y-3">
          {(d.suggestions || []).map((s, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-[#0E1117] p-3.5 text-sm text-slate-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              {s}
            </li>
          ))}
        </ul>
      </Card>
      <Disclaimer />
    </div>
  );
}
