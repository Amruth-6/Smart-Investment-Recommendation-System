import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Loader2, Brain, Scale, Wallet } from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { PageHeader, Card, Skeleton, Disclaimer, SectionLabel } from "../components/common/UI";
import { RISK_COLORS } from "../lib/format";

function Slider({ label, value, min, max, onChange, options, suffix }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="font-mono-num rounded-md bg-white/[0.05] px-2 py-0.5 text-xs text-blue-300">
          {options ? options[value - 1] : `${value}${suffix || ""}`}
        </span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-blue-500" />
    </div>
  );
}

function MeterBar({ label, value, color, icon: Icon }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-slate-300"><Icon className="h-4 w-4 text-slate-500" />{label}</span>
        <span className="font-mono-num font-semibold text-slate-100">{value}/100</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export default function RiskAssessment() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const { data: risk, isLoading } = useQuery({ queryKey: ["risk"], queryFn: async () => (await api.get("/risk/profile")).data });

  const [form, setForm] = useState({ market_decline_reaction: 3, experience_level: 2, investment_horizon_years: 10, loss_tolerance_pct: 15, equity_exposure_willingness_pct: 50 });

  React.useEffect(() => {
    if (risk?.questionnaire) setForm(risk.questionnaire);
  }, [risk]);

  const assess = async () => {
    setSaving(true);
    try {
      await api.post("/risk/assess", form);
      await api.post("/portfolio/generate");
      qc.invalidateQueries();
      toast.success("Risk profile updated");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-56" />)}</div>;

  const color = RISK_COLORS[risk?.risk_category] || "#F59E0B";

  return (
    <div>
      <PageHeader title="Risk Assessment" subtitle="We separate your psychological willingness to take risk from your financial ability to absorb it." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <SectionLabel>Your Risk Profile</SectionLabel>
          {risk?.risk_category ? (
            <>
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <div className="font-mono-num text-5xl font-bold" style={{ color }}>{risk.risk_score}<span className="text-xl text-slate-600">/100</span></div>
                  <div className="mt-1 font-manrope text-xl font-semibold" style={{ color }}>{risk.risk_category}</div>
                </div>
                <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
                  <div><div className="text-xs text-slate-500">Investment Horizon</div><div className="font-mono-num text-lg font-semibold text-slate-100">{risk.investment_horizon} yrs</div></div>
                  <div><div className="text-xs text-slate-500">Max Equity Exposure</div><div className="font-mono-num text-lg font-semibold text-slate-100">{risk.max_equity_exposure}%</div></div>
                  <div><div className="text-xs text-slate-500">Model</div><div className="text-sm font-medium text-emerald-300">{risk.model_source || "hybrid"}</div></div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-white/[0.06] bg-[#0E1117] p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-300"><Brain className="h-4 w-4 text-blue-400" /> Risk Tolerance</div>
                  <p className="mb-3 text-xs text-slate-500">Psychological willingness to take risk</p>
                  <MeterBar label="Tolerance" value={Math.round(risk.risk_tolerance)} color="#3B82F6" icon={Brain} />
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-[#0E1117] p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-300"><Wallet className="h-4 w-4 text-emerald-400" /> Risk Capacity</div>
                  <p className="mb-3 text-xs text-slate-500">Financial ability to withstand loss</p>
                  <MeterBar label="Capacity" value={Math.round(risk.risk_capacity)} color="#10B981" icon={Wallet} />
                </div>
              </div>
              {Math.abs((risk.risk_capacity || 0) - (risk.risk_tolerance || 0)) > 20 && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-200/80">
                  <Scale className="mt-0.5 h-4 w-4 shrink-0" />
                  Your risk tolerance and capacity differ notably. We use the more prudent of the two to cap your equity exposure.
                </div>
              )}
            </>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">Complete the questionnaire to generate your risk profile.</p>
          )}
        </Card>

        <Card className="p-6">
          <SectionLabel>Reassess</SectionLabel>
          <div className="space-y-5">
            <Slider label="Reaction to a 20% decline" value={form.market_decline_reaction} min={1} max={5} onChange={(v) => setForm({ ...form, market_decline_reaction: v })} options={["Sell all", "Sell some", "Hold anxiously", "Hold", "Buy more"]} />
            <Slider label="Experience level" value={form.experience_level} min={1} max={5} onChange={(v) => setForm({ ...form, experience_level: v })} options={["None", "Limited", "Moderate", "Experienced", "Expert"]} />
            <Slider label="Investment horizon" value={form.investment_horizon_years} min={1} max={25} onChange={(v) => setForm({ ...form, investment_horizon_years: v })} suffix=" yrs" />
            <Slider label="Loss tolerance" value={form.loss_tolerance_pct} min={2} max={40} onChange={(v) => setForm({ ...form, loss_tolerance_pct: v })} suffix="%" />
            <Slider label="Equity exposure willingness" value={form.equity_exposure_willingness_pct} min={5} max={100} onChange={(v) => setForm({ ...form, equity_exposure_willingness_pct: v })} suffix="%" />
          </div>
          <button onClick={assess} disabled={saving} data-testid="reassess-button" className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-blue-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Recalculate Profile
          </button>
        </Card>
      </div>
      <Disclaimer />
    </div>
  );
}
