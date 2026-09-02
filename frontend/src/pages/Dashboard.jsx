import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { ArrowRight, Sparkles, Target, ShieldCheck, HeartPulse, TrendingUp, ListChecks } from "lucide-react";
import api from "../lib/api";
import { formatINR, CHART_COLORS, RISK_COLORS, scoreColor } from "../lib/format";
import { ScoreRing } from "../components/common/ScoreRing";
import { Card, Disclaimer, Skeleton, EmptyState } from "../components/common/UI";
import { useAuth } from "../context/AuthContext";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/dashboard")).data,
  });

  if (isLoading)
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
    );

  const d = data || {};
  const pieData = d.portfolio?.allocations?.map((a) => ({ name: a.asset_class, value: a.percentage })) || [];

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-slate-500">{greeting()},</p>
        <h1 className="font-manrope text-3xl font-bold tracking-tight text-slate-50">{user?.name} 👋</h1>
        <p className="mt-1 text-sm text-slate-400">Here's your personalized financial overview.</p>
      </div>

      {!d.has_risk_profile && (
        <Card className="mb-6 border-blue-500/25 bg-blue-500/[0.05] p-5">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-manrope font-semibold text-blue-200">Complete your setup</h3>
              <p className="text-sm text-slate-400">Finish onboarding to unlock personalized recommendations.</p>
            </div>
            <Link to="/onboarding" className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">Complete now</Link>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Financial Health */}
        <Card className="flex flex-col items-center justify-center p-6" data-testid="dash-health-card">
          <div className="mb-2 flex items-center gap-2 self-start text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <HeartPulse className="h-4 w-4" /> Financial Health
          </div>
          <ScoreRing score={d.financial_health || 0} label="/ 100" />
          <Link to="/financial-health" className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">
            View breakdown <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>

        {/* Risk Profile */}
        <Card className="flex flex-col justify-between p-6" data-testid="dash-risk-card">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <ShieldCheck className="h-4 w-4" /> Risk Profile
          </div>
          <div className="my-4">
            <div className="font-mono-num text-4xl font-bold" style={{ color: RISK_COLORS[d.risk_profile] || "#F59E0B" }}>
              {d.risk_score ?? "—"}<span className="text-lg text-slate-600">/100</span>
            </div>
            <div className="mt-1 font-manrope text-lg font-semibold text-slate-200">{d.risk_profile || "Not assessed"}</div>
          </div>
          <Link to="/risk-assessment" className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">
            Reassess risk <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>

        {/* Portfolio */}
        <Card className="p-6" data-testid="dash-portfolio-card">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <TrendingUp className="h-4 w-4" /> Recommended Portfolio
          </div>
          {pieData.length ? (
            <div className="flex items-center gap-4">
              <div className="h-28 w-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={32} outerRadius={52} paddingAngle={2} stroke="none">
                      {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#12151C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {pieData.slice(0, 4).map((a, i) => (
                  <div key={a.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {a.name}
                    </span>
                    <span className="font-mono-num text-slate-300">{a.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-6 text-sm text-slate-500">Generate a portfolio to see your allocation.</p>
          )}
          <Link to="/portfolio" className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">
            View full portfolio <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>

        {/* Goals */}
        <Card className="p-6 lg:col-span-2" data-testid="dash-goals-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Target className="h-4 w-4" /> Active Goals
            </div>
            <Link to="/goals" className="text-xs font-medium text-blue-400 hover:text-blue-300">Manage</Link>
          </div>
          {d.goals?.length ? (
            <div className="space-y-4">
              {d.goals.map((g) => (
                <div key={g.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-200">{g.name || g.goal_type}</span>
                    <span className="text-xs text-slate-500">
                      {formatINR(g.current_amount, true)} / {formatINR(g.target_amount, true)} ·{" "}
                      <span className={g.status === "On Track" ? "text-emerald-400" : g.status === "At Risk" ? "text-amber-400" : "text-red-400"}>{g.status}</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(g.progress_pct, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Target} title="No goals yet" description="Create your first financial goal to start planning." action={<Link to="/goals" className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">Add a goal</Link>} />
          )}
        </Card>

        {/* Action items */}
        <Card className="p-6" data-testid="dash-actions-card">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <ListChecks className="h-4 w-4" /> Action Items
          </div>
          <ul className="space-y-3">
            {(d.action_items || []).map((a, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                {a}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Top recommendations */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-manrope text-lg font-semibold text-slate-100">
            <Sparkles className="h-5 w-5 text-blue-400" /> Top Investment Suggestions
          </h2>
          <Link to="/recommendations" className="text-sm font-medium text-blue-400 hover:text-blue-300">See all</Link>
        </div>
        {d.top_recommendations?.length ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {d.top_recommendations.map((r) => (
              <Link key={r.id} to={`/recommendations/${r.id}`} className="rounded-xl border border-white/[0.08] bg-[#12151C] p-5 transition-colors hover:border-blue-500/30">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">{r.category}</span>
                  <span className="font-mono-num text-lg font-bold" style={{ color: scoreColor(r.suitability_score) }}>{r.suitability_score}</span>
                </div>
                <div className="font-manrope font-semibold text-slate-100">{r.investment_name}</div>
                <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">{r.reasons?.[0]}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={Sparkles} title="No recommendations yet" description="Complete your profile and risk assessment to generate recommendations." action={<Link to="/recommendations" className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">Generate</Link>} />
        )}
      </div>

      <Disclaimer />
    </div>
  );
}
