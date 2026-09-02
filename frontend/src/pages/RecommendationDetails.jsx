import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ArrowLeft, CheckCircle2, AlertTriangle, Brain } from "lucide-react";
import api from "../lib/api";
import { PageHeader, Card, Skeleton, Disclaimer, SectionLabel } from "../components/common/UI";
import { formatINR, scoreColor } from "../lib/format";

export default function RecommendationDetails() {
  const { id } = useParams();
  const { data: r, isLoading } = useQuery({ queryKey: ["rec", id], queryFn: async () => (await api.get(`/recommendations/${id}`)).data });

  if (isLoading) return <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>;
  const inv = r.investment || {};
  const perf = (inv.historical_performance || []).map((h) => ({ year: h.year, return: h.return }));

  return (
    <div>
      <Link to="/recommendations" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <PageHeader title={r.investment_name} subtitle={`${r.category} · ${inv.description || ""}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <SectionLabel>Investment Suitability Score</SectionLabel>
          <div className="mb-5 flex items-end gap-2">
            <span className="font-mono-num text-5xl font-bold" style={{ color: scoreColor(r.suitability_score) }}>{r.suitability_score}</span>
            <span className="mb-2 text-lg text-slate-600">/100</span>
          </div>
          <div className="space-y-3">
            {Object.entries(r.subscores).map(([k, v]) => (
              <div key={k}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-400">{k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                  <span className="font-mono-num text-slate-300">{v}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div className="h-full rounded-full" style={{ width: `${v}%`, background: scoreColor(v) }} />
                </div>
              </div>
            ))}
          </div>
          {r.ml_score != null && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/[0.06] p-2.5 text-xs text-blue-200/80">
              <Brain className="h-3.5 w-3.5" /> Hybrid score: {r.rule_score} rule-based + ML adjustment (ML {r.ml_score})
            </div>
          )}
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6" data-testid="rec-explain-card">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <h3 className="font-manrope text-base font-semibold text-slate-100">Why are we recommending this?</h3>
            </div>
            <ul className="space-y-2.5">
              {r.reasons?.map((x, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{x}</li>
              ))}
            </ul>
            <div className="mt-5 mb-3 flex items-center gap-2 border-t border-white/[0.06] pt-5">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h3 className="font-manrope text-base font-semibold text-slate-100">Why this may not be suitable</h3>
            </div>
            <ul className="space-y-2.5">
              {r.cautions?.map((x, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{x}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <SectionLabel>Instrument Characteristics</SectionLabel>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["Expected Return", `${inv.expected_return}%`],
                ["Volatility", `${inv.volatility}%`],
                ["Risk Level", `${inv.risk_level}/5`],
                ["Liquidity", `${inv.liquidity}/5`],
                ["Min Investment", formatINR(inv.minimum_investment)],
                ["Horizon", `${inv.horizon_min_years}-${inv.horizon_max_years} yrs`],
              ].map(([k, v]) => (
                <div key={k}><div className="text-[11px] text-slate-500">{k}</div><div className="font-mono-num text-sm font-semibold text-slate-100">{v}</div></div>
              ))}
            </div>
            {perf.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Historical Performance (demo data)</div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={perf}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="year" tick={{ fill: "#64748B", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ background: "#12151C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} formatter={(v) => `${v}%`} />
                      <Line type="monotone" dataKey="return" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
