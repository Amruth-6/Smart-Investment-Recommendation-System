import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import api from "../lib/api";
import { PageHeader, Card, Disclaimer, SectionLabel } from "../components/common/UI";
import { formatINR } from "../lib/format";

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

export default function WhatIf() {
  const { data: goals } = useQuery({ queryKey: ["goals"], queryFn: async () => (await api.get("/goals")).data });
  const [goalId, setGoalId] = useState("");
  const [current, setCurrent] = useState(5000);
  const [next, setNext] = useState(8000);
  const [years, setYears] = useState(10);
  const [ret, setRet] = useState(10);
  const [result, setResult] = useState(null);

  const run = useCallback(async () => {
    const res = await api.post("/what-if", {
      goal_id: goalId || null, initial_amount: 0, current_monthly: current, new_monthly: next, duration_years: years, expected_return: ret,
    });
    setResult(res.data);
  }, [goalId, current, next, years, ret]);

  useEffect(() => { run(); }, [run]);

  return (
    <div>
      <PageHeader title="What-If Analysis" subtitle="Experiment with your contribution, duration and return assumptions to see the impact instantly." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <SectionLabel>Adjust Assumptions</SectionLabel>
          <div className="space-y-6">
            {goals?.length > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Link a goal (optional)</label>
                <select value={goalId} onChange={(e) => setGoalId(e.target.value)} data-testid="whatif-goal" className="w-full rounded-lg border border-white/10 bg-[#0E1117] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500/60">
                  <option value="" className="bg-[#0E1117]">None</option>
                  {goals.map((g) => <option key={g.id} value={g.id} className="bg-[#0E1117]">{g.name || g.goal_type}</option>)}
                </select>
              </div>
            )}
            <RangeInput label="Current monthly SIP" value={current} min={500} max={100000} step={500} onChange={setCurrent} format={(v) => formatINR(v, true)} />
            <RangeInput label="New monthly SIP" value={next} min={500} max={100000} step={500} onChange={setNext} format={(v) => formatINR(v, true)} />
            <RangeInput label="Duration" value={years} min={1} max={40} step={1} onChange={setYears} format={(v) => `${v} yrs`} />
            <RangeInput label="Expected annual return" value={ret} min={4} max={16} step={0.5} onChange={setRet} format={(v) => `${v}%`} />
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <SectionLabel>Impact</SectionLabel>
          {result && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/[0.06] bg-[#0E1117] p-4">
                  <div className="text-xs text-slate-500">Current plan value</div>
                  <div className="font-mono-num text-xl font-bold text-slate-200">{formatINR(result.base.estimated_value, true)}</div>
                </div>
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.05] p-4">
                  <div className="text-xs text-slate-500">New plan value</div>
                  <div className="font-mono-num text-xl font-bold text-blue-300">{formatINR(result.changed.estimated_value, true)}</div>
                </div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                  <div className="flex items-center gap-1 text-xs text-slate-500"><ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" /> Difference</div>
                  <div className="font-mono-num text-xl font-bold text-emerald-300">+{formatINR(result.difference, true)}</div>
                </div>
              </div>

              <div className="mt-6 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: "Current", value: result.base.estimated_value }, { name: "New", value: result.changed.estimated_value }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                    <Tooltip contentStyle={{ background: "#12151C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} formatter={(v) => formatINR(v)} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      <Cell fill="#64748B" />
                      <Cell fill="#3B82F6" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {result.goal_target != null && (
                <div className="mt-5 rounded-lg border border-white/[0.06] bg-[#0E1117] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200"><TrendingUp className="h-4 w-4 text-blue-400" /> Goal completion</div>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex justify-between text-xs"><span className="text-slate-500">Current plan</span><span className="font-mono-num text-slate-300">{result.base_goal_pct}%</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-slate-500" style={{ width: `${result.base_goal_pct}%` }} /></div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs"><span className="text-slate-500">New plan</span><span className="font-mono-num text-blue-300">{result.changed_goal_pct}%</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-blue-500" style={{ width: `${result.changed_goal_pct}%` }} /></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
      <Disclaimer />
    </div>
  );
}
