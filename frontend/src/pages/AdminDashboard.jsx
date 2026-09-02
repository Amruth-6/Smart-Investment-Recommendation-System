import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Users, Sparkles, Target, Activity } from "lucide-react";
import api from "../lib/api";
import { PageHeader, Card, Skeleton, SectionLabel } from "../components/common/UI";
import { CHART_COLORS, RISK_COLORS } from "../lib/format";

function Stat({ icon: Icon, label, value, color }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
          <div className="mt-1 font-mono-num text-3xl font-bold text-slate-100">{value}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: `${color}22`, color }}><Icon className="h-5 w-5" /></div>
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: async () => (await api.get("/admin/statistics")).data });
  const { data: users } = useQuery({ queryKey: ["admin-users"], queryFn: async () => (await api.get("/admin/users")).data });

  if (isLoading) return <div className="grid gap-4 sm:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  const s = stats || {};

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="System overview, usage statistics and investment dataset management." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Total Users" value={s.total_users || 0} color="#3B82F6" />
        <Stat icon={Activity} label="Active Users" value={s.active_users || 0} color="#10B981" />
        <Stat icon={Sparkles} label="Recommendations" value={s.total_recommendations || 0} color="#F59E0B" />
        <Stat icon={Target} label="Goals" value={s.total_goals || 0} color="#8B5CF6" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <SectionLabel>Users by Risk Profile</SectionLabel>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={s.risk_distribution || []} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2} stroke="none">
                  {(s.risk_distribution || []).map((e, i) => <Cell key={i} fill={RISK_COLORS[e.name] || CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#12151C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <SectionLabel>Goals by Category</SectionLabel>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.goal_distribution || []} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ background: "#12151C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <SectionLabel>Recommendations by Asset Class</SectionLabel>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.category_distribution || []} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ background: "#12151C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="#10B981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <SectionLabel>Registered Users</SectionLabel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-left text-xs uppercase text-slate-500">
                <th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">Email</th><th className="pb-3 pr-4">Role</th><th className="pb-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map((u) => (
                <tr key={u.id} className="border-b border-white/[0.04]" data-testid={`admin-user-${u.id}`}>
                  <td className="py-3 pr-4 font-medium text-slate-200">{u.name}</td>
                  <td className="py-3 pr-4 text-slate-400">{u.email}</td>
                  <td className="py-3 pr-4"><span className={`rounded-full px-2 py-0.5 text-xs ${u.role === "admin" ? "bg-amber-500/15 text-amber-300" : "bg-white/[0.05] text-slate-300"}`}>{u.role}</span></td>
                  <td className="py-3 text-xs text-slate-500">{(u.created_at || "").slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
