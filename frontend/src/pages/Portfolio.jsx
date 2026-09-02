import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { RefreshCw, Loader2, TrendingUp, Activity } from "lucide-react";
import api from "../lib/api";
import { PageHeader, Card, Skeleton, EmptyState, Disclaimer, SectionLabel } from "../components/common/UI";
import { CHART_COLORS } from "../lib/format";

export default function Portfolio() {
  const qc = useQueryClient();
  const [gen, setGen] = useState(false);
  const { data: p, isLoading } = useQuery({ queryKey: ["portfolio"], queryFn: async () => (await api.get("/portfolio")).data });

  const generate = async () => {
    setGen(true);
    try {
      await api.post("/portfolio/generate");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      toast.success("Portfolio generated");
    } catch { toast.error("Complete your risk assessment first"); }
    finally { setGen(false); }
  };

  if (isLoading) return <Skeleton className="h-96" />;

  const pieData = p?.allocations?.map((a) => ({ name: a.asset_class, value: a.percentage })) || [];

  return (
    <div>
      <PageHeader
        title="Recommended Portfolio"
        subtitle="A personalized asset allocation based on your risk profile, age, goals, horizon and financial health."
        actions={<button onClick={generate} disabled={gen} data-testid="generate-portfolio-button" className="flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60">{gen ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Regenerate</button>}
      />

      {p ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="flex flex-col items-center p-6" data-testid="portfolio-donut">
            <SectionLabel>Suggested Allocation</SectionLabel>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2} stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#12151C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <SectionLabel>Allocation Breakdown · {p.risk_profile} profile</SectionLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              {p.allocations.map((a, i) => (
                <div key={a.asset_class} className="rounded-lg border border-white/[0.06] bg-[#0E1117] p-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-slate-300"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />{a.asset_class}</span>
                    <span className="font-mono-num text-lg font-bold text-slate-100">{a.percentage}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="h-full rounded-full" style={{ width: `${a.percentage}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400"><TrendingUp className="h-4 w-4 text-emerald-400" /> Expected Return (p.a.)</div>
                <div className="mt-1 font-mono-num text-2xl font-bold text-emerald-300">{p.expected_return}%</div>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400"><Activity className="h-4 w-4 text-amber-400" /> Expected Volatility</div>
                <div className="mt-1 font-mono-num text-2xl font-bold text-amber-300">{p.expected_risk}%</div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <EmptyState icon={TrendingUp} title="No portfolio yet" description="Generate a personalized portfolio allocation." action={<button onClick={generate} className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">Generate</button>} />
      )}
      <Disclaimer />
    </div>
  );
}
