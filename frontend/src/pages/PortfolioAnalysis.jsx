import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, BarChart3 } from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { PageHeader, Card, Skeleton, EmptyState, Disclaimer, SectionLabel, Warning } from "../components/common/UI";
import { formatINR, CHART_COLORS } from "../lib/format";

const CATEGORIES = ["Equity", "Mutual Funds", "ETFs", "Bonds", "Fixed Deposits", "Gold", "Government Securities", "REITs"];
const inputCls = "rounded-lg border border-white/10 bg-[#0E1117] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500/60";

export default function PortfolioAnalysis() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", category: "Equity", amount: 50000 });
  const [adding, setAdding] = useState(false);

  const { data: holdings, isLoading: lh } = useQuery({ queryKey: ["holdings"], queryFn: async () => (await api.get("/holdings")).data });
  const { data: analysis, isLoading: la } = useQuery({ queryKey: ["portfolio-analysis", holdings], queryFn: async () => (await api.get("/portfolio/analysis")).data });

  const add = async () => {
    if (!form.name) return toast.error("Enter a holding name");
    setAdding(true);
    try {
      await api.post("/holdings", form);
      qc.invalidateQueries();
      setForm({ ...form, name: "", amount: 50000 });
      toast.success("Holding added");
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
    finally { setAdding(false); }
  };
  const del = async (id) => { await api.delete(`/holdings/${id}`); qc.invalidateQueries(); toast.success("Removed"); };

  return (
    <div>
      <PageHeader title="Portfolio Health Analysis" subtitle="Enter your existing investments and we'll diagnose concentration, risk and diversification gaps." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <SectionLabel>Add a Holding</SectionLabel>
          <div className="space-y-3">
            <input data-testid="holding-name" className={`${inputCls} w-full`} placeholder="Holding name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select data-testid="holding-category" className={`${inputCls} w-full`} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#0E1117]">{c}</option>)}
            </select>
            <input data-testid="holding-amount" type="number" className={`${inputCls} w-full font-mono-num`} placeholder="Amount (₹)" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            <button onClick={add} disabled={adding} data-testid="add-holding-button" className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-500 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Holding
            </button>
          </div>

          {lh ? <Skeleton className="mt-5 h-24" /> : holdings?.length ? (
            <div className="mt-5 space-y-2">
              {holdings.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0E1117] px-3 py-2 text-sm" data-testid={`holding-${h.id}`}>
                  <div><div className="font-medium text-slate-200">{h.name}</div><div className="text-xs text-slate-500">{h.category}</div></div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num text-slate-300">{formatINR(h.amount, true)}</span>
                    <button onClick={() => del(h.id)} className="rounded p-1 text-slate-500 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="p-6 lg:col-span-2">
          <SectionLabel>Diagnosis</SectionLabel>
          {la ? <Skeleton className="h-64" /> : analysis?.total_value ? (
            <>
              <div className="mb-5 flex flex-wrap items-end gap-6">
                <div><div className="text-xs text-slate-500">Total portfolio value</div><div className="font-mono-num text-2xl font-bold text-slate-100">{formatINR(analysis.total_value)}</div></div>
                <div><div className="text-xs text-slate-500">Equity exposure</div><div className="font-mono-num text-2xl font-bold text-blue-300">{analysis.equity_exposure}%</div></div>
              </div>
              <div className="mb-5 space-y-2.5">
                {analysis.allocation.map((a, i) => (
                  <div key={a.category}>
                    <div className="mb-1 flex justify-between text-xs"><span className="text-slate-400">{a.category}</span><span className="font-mono-num text-slate-300">{a.percentage}% · {formatINR(a.amount, true)}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full" style={{ width: `${a.percentage}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} /></div>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {analysis.issues.map((x, i) => <Warning key={i}>{x}</Warning>)}
              </div>
              <div className="mt-4 rounded-lg border border-white/[0.06] bg-[#0E1117] p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Suggestions</div>
                <ul className="space-y-2">
                  {analysis.suggestions.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-300"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />{s}</li>)}
                </ul>
              </div>
            </>
          ) : (
            <EmptyState icon={BarChart3} title="No holdings to analyse" description="Add your existing investments on the left to run a portfolio diagnosis." />
          )}
        </Card>
      </div>
      <Disclaimer />
    </div>
  );
}
