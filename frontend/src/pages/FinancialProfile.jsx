import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { PageHeader, Card, Skeleton, Disclaimer } from "../components/common/UI";
import { formatINR } from "../lib/format";

const inputCls =
  "w-full rounded-lg border border-white/10 bg-[#0E1117] px-4 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-blue-500/60 font-mono-num";

const EMPLOYMENT = [
  "salaried_permanent", "government", "salaried_contract", "self_employed",
  "business_owner", "freelancer", "student", "retired", "unemployed",
];

function F({ label, children, hint }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-600">{hint}</p>}
    </div>
  );
}

export default function FinancialProfile() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [personal, setPersonal] = useState(null);
  const [financial, setFinancial] = useState(null);

  const { data: p, isLoading: lp } = useQuery({ queryKey: ["profile"], queryFn: async () => (await api.get("/profile")).data });
  const { data: f, isLoading: lf } = useQuery({ queryKey: ["financial-profile"], queryFn: async () => (await api.get("/financial-profile")).data });

  useEffect(() => { if (p) setPersonal({ age: 30, dependents: 0, occupation: "", employment_status: "salaried_permanent", financial_experience: "beginner", ...p }); }, [p]);
  useEffect(() => { if (f) setFinancial({ monthly_income: 0, monthly_expenses: 0, monthly_savings: 0, total_debt: 0, monthly_emi: 0, emergency_fund: 0, investment_capacity: 0, monthly_sip_capacity: 0, current_investments: 0, ...f }); }, [f]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/profile", personal);
      await api.put("/financial-profile", financial);
      qc.invalidateQueries();
      toast.success("Profile saved");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (lp || lf || !personal || !financial)
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>;

  const numF = (setter, obj, key) => (e) => setter({ ...obj, [key]: Number(e.target.value) });
  const savingsRatio = financial.monthly_income ? Math.round((financial.monthly_savings / financial.monthly_income) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Financial Profile"
        subtitle="Keep your details up to date — your risk profile, health score and recommendations all depend on this."
        actions={
          <button onClick={save} disabled={saving} data-testid="save-profile-button" className="flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="mb-5 font-manrope text-base font-semibold text-slate-100">Personal Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <F label="Age"><input type="number" data-testid="fp-age" className={inputCls} value={personal.age} onChange={numF(setPersonal, personal, "age")} /></F>
              <F label="Dependents"><input type="number" data-testid="fp-dependents" className={inputCls} value={personal.dependents} onChange={numF(setPersonal, personal, "dependents")} /></F>
              <F label="Occupation"><input data-testid="fp-occupation" className={inputCls.replace("font-mono-num", "")} value={personal.occupation || ""} onChange={(e) => setPersonal({ ...personal, occupation: e.target.value })} /></F>
              <F label="Employment status">
                <select data-testid="fp-employment" className={inputCls.replace("font-mono-num", "")} value={personal.employment_status} onChange={(e) => setPersonal({ ...personal, employment_status: e.target.value })}>
                  {EMPLOYMENT.map((x) => <option key={x} value={x} className="bg-[#0E1117]">{x.replace(/_/g, " ")}</option>)}
                </select>
              </F>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-5 font-manrope text-base font-semibold text-slate-100">Income, Expenses & Debt</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <F label="Monthly income (₹)"><input type="number" data-testid="fp-income" className={inputCls} value={financial.monthly_income} onChange={numF(setFinancial, financial, "monthly_income")} /></F>
              <F label="Monthly expenses (₹)"><input type="number" data-testid="fp-expenses" className={inputCls} value={financial.monthly_expenses} onChange={numF(setFinancial, financial, "monthly_expenses")} /></F>
              <F label="Monthly savings (₹)"><input type="number" data-testid="fp-savings" className={inputCls} value={financial.monthly_savings} onChange={numF(setFinancial, financial, "monthly_savings")} /></F>
              <F label="Monthly EMI (₹)"><input type="number" data-testid="fp-emi" className={inputCls} value={financial.monthly_emi} onChange={numF(setFinancial, financial, "monthly_emi")} /></F>
              <F label="Total debt (₹)"><input type="number" data-testid="fp-debt" className={inputCls} value={financial.total_debt} onChange={numF(setFinancial, financial, "total_debt")} /></F>
              <F label="Emergency fund (₹)"><input type="number" data-testid="fp-emergency" className={inputCls} value={financial.emergency_fund} onChange={numF(setFinancial, financial, "emergency_fund")} /></F>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-5 font-manrope text-base font-semibold text-slate-100">Investment Capacity</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <F label="Current investments (₹)"><input type="number" data-testid="fp-current-inv" className={inputCls} value={financial.current_investments} onChange={numF(setFinancial, financial, "current_investments")} /></F>
              <F label="Lump-sum capacity (₹)"><input type="number" data-testid="fp-inv-capacity" className={inputCls} value={financial.investment_capacity} onChange={numF(setFinancial, financial, "investment_capacity")} /></F>
              <F label="Monthly SIP capacity (₹)"><input type="number" data-testid="fp-sip" className={inputCls} value={financial.monthly_sip_capacity} onChange={numF(setFinancial, financial, "monthly_sip_capacity")} /></F>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 font-manrope text-base font-semibold text-slate-100">Snapshot</h3>
            <div className="space-y-4">
              {[
                ["Monthly income", formatINR(financial.monthly_income)],
                ["Monthly savings", formatINR(financial.monthly_savings)],
                ["Savings ratio", `${savingsRatio}%`],
                ["Emergency fund", formatINR(financial.emergency_fund)],
                ["Total debt", formatINR(financial.total_debt)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{k}</span>
                  <span className="font-mono-num text-sm font-semibold text-slate-100">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
