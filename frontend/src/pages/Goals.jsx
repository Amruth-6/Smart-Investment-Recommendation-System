import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Target, Trash2, X, Loader2, ArrowRight } from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { PageHeader, Card, Skeleton, EmptyState, Disclaimer } from "../components/common/UI";
import { formatINR } from "../lib/format";

const GOAL_TYPES = ["Emergency Fund", "Higher Education", "Marriage", "House Purchase", "Vehicle Purchase", "Retirement", "Wealth Creation", "Custom Goal"];
const inputCls = "w-full rounded-lg border border-white/10 bg-[#0E1117] px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500/60 font-mono-num";

const statusColor = (s) => (s === "On Track" ? "text-emerald-400" : s === "At Risk" ? "text-amber-400" : "text-red-400");

function GoalModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ goal_type: "Wealth Creation", name: "", target_amount: 1000000, current_amount: 100000, target_date: "2032-01-01", monthly_contribution: 10000, priority: 2 });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await api.post("/goals", form);
      onSaved();
      toast.success("Goal created");
      onClose();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-fade-up rounded-2xl border border-white/[0.1] bg-[#12151C] p-6" data-testid="goal-modal">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-manrope text-lg font-semibold text-slate-100">New Financial Goal</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Goal type</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_TYPES.map((g) => (
                <button key={g} onClick={() => setForm({ ...form, goal_type: g })} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${form.goal_type === g ? "border-blue-500/50 bg-blue-500/15 text-blue-200" : "border-white/10 text-slate-400 hover:text-slate-200"}`}>{g}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Goal name (optional)</label>
            <input data-testid="goal-name" className={inputCls.replace("font-mono-num", "")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dream Home" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1.5 block text-xs font-medium text-slate-400">Target (₹)</label><input type="number" data-testid="goal-target" className={inputCls} value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: Number(e.target.value) })} /></div>
            <div><label className="mb-1.5 block text-xs font-medium text-slate-400">Current (₹)</label><input type="number" data-testid="goal-current" className={inputCls} value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: Number(e.target.value) })} /></div>
            <div><label className="mb-1.5 block text-xs font-medium text-slate-400">Target date</label><input type="date" data-testid="goal-date" className={inputCls} value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} /></div>
            <div><label className="mb-1.5 block text-xs font-medium text-slate-400">Monthly (₹)</label><input type="number" data-testid="goal-monthly" className={inputCls} value={form.monthly_contribution} onChange={(e) => setForm({ ...form, monthly_contribution: Number(e.target.value) })} /></div>
          </div>
        </div>
        <button onClick={save} disabled={saving} data-testid="goal-save-button" className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-blue-500 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Goal"}
        </button>
      </div>
    </div>
  );
}

export default function Goals() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const { data: goals, isLoading } = useQuery({ queryKey: ["goals"], queryFn: async () => (await api.get("/goals")).data });

  const del = async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal deleted");
    } catch { toast.error("Could not delete goal"); }
  };

  return (
    <div>
      <PageHeader
        title="Financial Goals"
        subtitle="We plan investments around what you want to achieve — not around what's trending."
        actions={<button onClick={() => setModal(true)} data-testid="add-goal-button" className="flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"><Plus className="h-4 w-4" /> Add Goal</button>}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : goals?.length ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {goals.map((g) => {
            const m = g.metrics;
            return (
              <Card key={g.id} className="p-6" data-testid={`goal-card-${g.id}`}>
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/12 text-blue-400"><Target className="h-4 w-4" /></span>
                      <div>
                        <div className="font-manrope font-semibold text-slate-100">{g.name || g.goal_type}</div>
                        <div className="text-xs text-slate-500">{g.goal_type} · {m.years_remaining} yrs left</div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => del(g.id)} data-testid={`goal-delete-${g.id}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-mono-num text-slate-300">{formatINR(g.current_amount, true)} / {formatINR(g.target_amount, true)}</span>
                  <span className={`text-xs font-medium ${statusColor(m.status)}`}>{m.status}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(m.progress_pct, 100)}%` }} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
                  <div>
                    <div className="text-[11px] text-slate-500">Required monthly (moderate)</div>
                    <div className="font-mono-num text-sm font-semibold text-slate-100">{formatINR(m.required_monthly)}</div>
                  </div>
                  <Link to={`/goals/${g.id}`} data-testid={`goal-view-${g.id}`} className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">Details <ArrowRight className="h-3 w-3" /></Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Target} title="No goals yet" description="Add your first financial goal to start goal-based planning." action={<button onClick={() => setModal(true)} className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">Add a goal</button>} />
      )}

      {modal && <GoalModal onClose={() => setModal(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["goals"] })} />}
      <Disclaimer />
    </div>
  );
}
