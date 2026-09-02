import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from "recharts";
import { ArrowLeft } from "lucide-react";
import api from "../lib/api";
import { PageHeader, Card, Skeleton, Disclaimer } from "../components/common/UI";
import { formatINR } from "../lib/format";

const RISK_LABEL = ["", "Very Low", "Low", "Moderate", "High", "Very High"];

export default function InvestmentComparison() {
  const location = useLocation();
  const { data: all, isLoading } = useQuery({ queryKey: ["market-investments", "all"], queryFn: async () => (await api.get("/market/investments?category=all")).data });
  const preset = location.state?.selected || [];
  const [aId, setAId] = useState(preset[0]?.id || "");
  const [bId, setBId] = useState(preset[1]?.id || "");

  if (isLoading) return <Skeleton className="h-96" />;

  const list = all || [];
  const A = list.find((x) => x.id === aId) || list[0];
  const B = list.find((x) => x.id === bId) || list[1];

  const rows = [
    ["Category", A?.category, B?.category],
    ["Expected Return", `${A?.expected_return}%`, `${B?.expected_return}%`],
    ["Volatility", `${A?.volatility}%`, `${B?.volatility}%`],
    ["Risk Level", RISK_LABEL[A?.risk_level], RISK_LABEL[B?.risk_level]],
    ["Liquidity", `${A?.liquidity}/5`, `${B?.liquidity}/5`],
    ["Min Investment", formatINR(A?.minimum_investment), formatINR(B?.minimum_investment)],
    ["Horizon", `${A?.horizon_min_years}-${A?.horizon_max_years} yrs`, `${B?.horizon_min_years}-${B?.horizon_max_years} yrs`],
  ];

  const radarData = A && B ? [
    { metric: "Return", A: A.expected_return, B: B.expected_return },
    { metric: "Liquidity", A: A.liquidity * 3, B: B.liquidity * 3 },
    { metric: "Stability", A: 25 - A.volatility, B: 25 - B.volatility },
    { metric: "Low Risk", A: (6 - A.risk_level) * 4, B: (6 - B.risk_level) * 4 },
  ] : [];

  const selCls = "rounded-lg border border-white/10 bg-[#0E1117] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500/60";

  return (
    <div>
      <Link to="/investments" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"><ArrowLeft className="h-4 w-4" /> Back to explorer</Link>
      <PageHeader title="Investment Comparison" subtitle="Compare two instruments side by side across return, risk, liquidity and horizon." />

      <div className="mb-6 grid grid-cols-2 gap-4">
        <select value={A?.id} onChange={(e) => setAId(e.target.value)} data-testid="compare-select-a" className={selCls}>
          {list.map((x) => <option key={x.id} value={x.id} className="bg-[#0E1117]">{x.name}</option>)}
        </select>
        <select value={B?.id} onChange={(e) => setBId(e.target.value)} data-testid="compare-select-b" className={selCls}>
          {list.map((x) => <option key={x.id} value={x.id} className="bg-[#0E1117]">{x.name}</option>)}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-left">
                <th className="pb-3 text-xs uppercase text-slate-500">Metric</th>
                <th className="pb-3 font-manrope text-blue-300">{A?.name}</th>
                <th className="pb-3 font-manrope text-emerald-300">{B?.name}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r[0]} className="border-b border-white/[0.04]">
                  <td className="py-3 text-slate-500">{r[0]}</td>
                  <td className="py-3 font-mono-num text-slate-200">{r[1]}</td>
                  <td className="py-3 font-mono-num text-slate-200">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-6">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Profile Comparison</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#94A3B8", fontSize: 12 }} />
                <Radar name={A?.name} dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.35} />
                <Radar name={B?.name} dataKey="B" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Disclaimer />
    </div>
  );
}
