import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { ArrowLeft, Target } from "lucide-react";
import api from "../lib/api";
import { PageHeader, Card, Skeleton, Disclaimer, SectionLabel } from "../components/common/UI";
import { formatINR } from "../lib/format";

const SC_COLORS = { conservative: "#10B981", moderate: "#3B82F6", optimistic: "#F59E0B" };

export default function GoalDetails() {
  const { id } = useParams();
  const { data: g, isLoading } = useQuery({ queryKey: ["goal", id], queryFn: async () => (await api.get(`/goals/${id}`)).data });

  if (isLoading) return <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>;
  const m = g.metrics;
  const scenarioData = Object.entries(m.scenarios).map(([k, v]) => ({ name: k[0].toUpperCase() + k.slice(1), required: v.required_monthly, projected: v.projected_value, key: k, return: v.annual_return }));

  return (
    <div>
      <Link to="/goals" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"><ArrowLeft className="h-4 w-4" /> Back to goals</Link>
      <PageHeader title={g.name || g.goal_type} subtitle={`${g.goal_type} · ${m.years_remaining} years remaining · ${m.status}`} />

      <div className="grid gap-6 lg:grid-cols-4">
        {[
          ["Target amount", formatINR(m.target_amount)],
          ["Current savings", formatINR(m.current_amount)],
          ["Remaining", formatINR(m.remaining_amount)],
          ["Progress", `${m.progress_pct}%`],
        ].map(([k, v]) => (
          <Card key={k} className="p-5">
            <div className="text-xs text-slate-500">{k}</div>
            <div className="mt-1 font-mono-num text-xl font-bold text-slate-100">{v}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <SectionLabel>Required Monthly Investment by Scenario</SectionLabel>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scenarioData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#12151C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} formatter={(v) => formatINR(v)} />
                <Bar dataKey="required" radius={[6, 6, 0, 0]}>
                  {scenarioData.map((d) => <Cell key={d.key} fill={SC_COLORS[d.key]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <SectionLabel>Projected Value (at current contribution)</SectionLabel>
          <div className="space-y-4">
            {scenarioData.map((s) => (
              <div key={s.key} className="rounded-lg border border-white/[0.06] bg-[#0E1117] p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium" style={{ color: SC_COLORS[s.key] }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: SC_COLORS[s.key] }} /> {s.name} ({s.return}% p.a.)
                  </span>
                  <span className="font-mono-num font-semibold text-slate-100">{formatINR(s.projected)}</span>
                </div>
                <div className="text-xs text-slate-500">Required monthly to reach target: <span className="font-mono-num text-slate-300">{formatINR(s.required)}</span></div>
              </div>
            ))}
          </div>
          <Link to="/what-if" className="mt-4 inline-block text-xs font-medium text-blue-400 hover:text-blue-300">Try What-If analysis for this goal →</Link>
        </Card>
      </div>
      <Disclaimer />
    </div>
  );
}
