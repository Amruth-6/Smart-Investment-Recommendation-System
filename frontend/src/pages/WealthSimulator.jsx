import React, { useState, useEffect, useCallback } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, defs } from "recharts";
import { Loader2 } from "lucide-react";
import api from "../lib/api";
import { PageHeader, Card, Disclaimer, SectionLabel } from "../components/common/UI";
import { formatINR } from "../lib/format";

const SC = [
  { key: "conservative", label: "Conservative", color: "#10B981" },
  { key: "moderate", label: "Moderate", color: "#3B82F6" },
  { key: "optimistic", label: "Optimistic", color: "#F59E0B" },
];

function RangeInput({ label, value, min, max, step, onChange, format }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="font-mono-num rounded-md bg-white/[0.05] px-2 py-0.5 text-sm text-blue-300">{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-blue-500" />
    </div>
  );
}

export default function WealthSimulator() {
  const [initial, setInitial] = useState(100000);
  const [monthly, setMonthly] = useState(10000);
  const [years, setYears] = useState(15);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post("/simulation", { initial_amount: initial, monthly_contribution: monthly, duration_years: years });
      setData(res.data.scenarios);
    } finally { setLoading(false); }
  }, [initial, monthly, years]);

  useEffect(() => { run(); }, [run]);

  let chartData = [];
  if (data) {
    const years0 = data.moderate.series.map((p) => p.year);
    chartData = years0.map((yr, i) => ({
      year: yr,
      conservative: data.conservative.series[i]?.value,
      moderate: data.moderate.series[i]?.value,
      optimistic: data.optimistic.series[i]?.value,
      invested: data.moderate.series[i]?.invested,
    }));
  }

  return (
    <div>
      <PageHeader title="Future Wealth Simulator" subtitle="Project how your investments could grow under different return assumptions. Projections are estimates, not guarantees." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <SectionLabel>Inputs</SectionLabel>
          <div className="space-y-6">
            <RangeInput label="Initial investment" value={initial} min={0} max={2000000} step={10000} onChange={setInitial} format={(v) => formatINR(v, true)} />
            <RangeInput label="Monthly contribution" value={monthly} min={500} max={100000} step={500} onChange={setMonthly} format={(v) => formatINR(v, true)} />
            <RangeInput label="Duration" value={years} min={1} max={40} step={1} onChange={setYears} format={(v) => `${v} yrs`} />
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <SectionLabel>Projected Growth</SectionLabel>
          {loading || !data ? (
            <div className="flex h-72 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    {SC.map((s) => (
                      <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => `${v}y`} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip contentStyle={{ background: "#12151C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [formatINR(v), n]} />
                  {SC.map((s) => (
                    <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} fill={`url(#g-${s.key})`} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {data && (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {SC.map((s) => (
                <div key={s.key} className="rounded-lg border border-white/[0.06] bg-[#0E1117] p-4" style={{ borderColor: `${s.color}33` }}>
                  <div className="flex items-center gap-2 text-xs font-medium" style={{ color: s.color }}><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label} ({data[s.key].annual_return}%)</div>
                  <div className="mt-1 font-mono-num text-xl font-bold text-slate-100">{formatINR(data[s.key].estimated_value, true)}</div>
                  <div className="text-[11px] text-slate-500">Invested {formatINR(data[s.key].total_invested, true)} · Growth {formatINR(data[s.key].estimated_growth, true)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Disclaimer />
    </div>
  );
}
