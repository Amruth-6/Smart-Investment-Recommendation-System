import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Logo } from "../components/common/Logo";
import api, { formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const inputCls =
  "w-full rounded-lg border border-white/10 bg-[#12151C] px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors focus:border-blue-500/60 font-mono-num";

const EMPLOYMENT = [
  ["salaried_permanent", "Salaried (Permanent)"],
  ["government", "Government"],
  ["salaried_contract", "Salaried (Contract)"],
  ["self_employed", "Self-employed"],
  ["business_owner", "Business Owner"],
  ["freelancer", "Freelancer"],
  ["student", "Student"],
  ["retired", "Retired"],
  ["unemployed", "Unemployed"],
];
const EXPERIENCE = [["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]];
const GOAL_TYPES = ["Emergency Fund", "Higher Education", "Marriage", "House Purchase", "Vehicle Purchase", "Retirement", "Wealth Creation", "Custom Goal"];

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-600">{hint}</p>}
    </div>
  );
}

function Pills({ options, value, onChange, testid }) {
  return (
    <div className="flex flex-wrap gap-2" data-testid={testid}>
      {options.map((opt) => {
        const [val, lab] = Array.isArray(opt) ? opt : [opt, opt];
        const active = value === val;
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border-blue-500/50 bg-blue-500/15 text-blue-200"
                : "border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200"
            }`}
          >
            {lab}
          </button>
        );
      })}
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, suffix, options }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="font-mono-num rounded-md bg-white/[0.05] px-2 py-0.5 text-sm text-blue-300">
          {options ? options[value - 1] : `${value}${suffix || ""}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [personal, setPersonal] = useState({ age: 30, occupation: "", employment_status: "salaried_permanent", dependents: 0, financial_experience: "beginner" });
  const [financial, setFinancial] = useState({ monthly_income: 80000, monthly_expenses: 45000, monthly_savings: 25000, total_debt: 200000, monthly_emi: 8000, emergency_fund: 150000 });
  const [investment, setInvestment] = useState({ current_investments: 100000, investment_capacity: 20000, monthly_sip_capacity: 15000 });
  const [goal, setGoal] = useState({ goal_type: "Wealth Creation", target_amount: 2000000, current_amount: 200000, target_date: "2035-01-01", monthly_contribution: 15000, priority: 1 });
  const [risk, setRisk] = useState({ market_decline_reaction: 3, experience_level: 2, investment_horizon_years: 10, loss_tolerance_pct: 15, equity_exposure_willingness_pct: 50 });

  const steps = ["Personal", "Income & Expenses", "Investments", "Financial Goal", "Risk Assessment"];

  const num = (setter, obj) => (key) => (e) => setter({ ...obj, [key]: Number(e.target.value) });
  const txt = (setter, obj) => (key) => (e) => setter({ ...obj, [key]: e.target.value });

  const finish = async () => {
    setSaving(true);
    try {
      await api.put("/profile", personal);
      await api.put("/financial-profile", { ...financial, ...investment });
      await api.post("/goals", goal);
      await api.post("/risk/assess", risk);
      await api.post("/portfolio/generate");
      await api.post("/recommendations/generate");
      await api.post("/onboarding/complete");
      await refreshUser();
      toast.success("Your personalized plan is ready!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setSaving(false);
    }
  };

  const next = () => (step < 4 ? setStep(step + 1) : finish());
  const back = () => setStep(Math.max(0, step - 1));

  return (
    <div className="min-h-screen bg-[#0A0C10] px-5 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <span className="text-xs text-slate-500">Step {step + 1} of 5</span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${((step + 1) / 5) * 100}%` }} />
          </div>
          <div className="flex justify-between">
            {steps.map((s, i) => (
              <span key={s} className={`text-[10px] font-medium ${i <= step ? "text-blue-300" : "text-slate-600"}`}>
                {s}
              </span>
            ))}
          </div>
        </div>

        <div key={step} className="animate-fade-up rounded-2xl border border-white/[0.08] bg-[#12151C] p-6 sm:p-8" data-testid={`onboarding-step-${step}`}>
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="font-manrope text-xl font-bold text-slate-50">Tell us about yourself</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Age"><input type="number" data-testid="ob-age" className={inputCls} value={personal.age} onChange={num(setPersonal, personal)("age")} /></Field>
                <Field label="Number of dependents"><input type="number" data-testid="ob-dependents" className={inputCls} value={personal.dependents} onChange={num(setPersonal, personal)("dependents")} /></Field>
              </div>
              <Field label="Occupation"><input data-testid="ob-occupation" className={inputCls.replace("font-mono-num", "")} value={personal.occupation} onChange={txt(setPersonal, personal)("occupation")} placeholder="e.g. Software Engineer" /></Field>
              <Field label="Employment status"><Pills testid="ob-employment" options={EMPLOYMENT} value={personal.employment_status} onChange={(v) => setPersonal({ ...personal, employment_status: v })} /></Field>
              <Field label="Financial / investment experience"><Pills testid="ob-experience" options={EXPERIENCE} value={personal.financial_experience} onChange={(v) => setPersonal({ ...personal, financial_experience: v })} /></Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-manrope text-xl font-bold text-slate-50">Income & expenses</h2>
              <p className="text-sm text-slate-400">All amounts are monthly (in ₹) unless noted.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Monthly income"><input type="number" data-testid="ob-income" className={inputCls} value={financial.monthly_income} onChange={num(setFinancial, financial)("monthly_income")} /></Field>
                <Field label="Monthly expenses"><input type="number" data-testid="ob-expenses" className={inputCls} value={financial.monthly_expenses} onChange={num(setFinancial, financial)("monthly_expenses")} /></Field>
                <Field label="Monthly savings"><input type="number" data-testid="ob-savings" className={inputCls} value={financial.monthly_savings} onChange={num(setFinancial, financial)("monthly_savings")} /></Field>
                <Field label="Monthly EMI"><input type="number" data-testid="ob-emi" className={inputCls} value={financial.monthly_emi} onChange={num(setFinancial, financial)("monthly_emi")} /></Field>
                <Field label="Total outstanding debt"><input type="number" data-testid="ob-debt" className={inputCls} value={financial.total_debt} onChange={num(setFinancial, financial)("total_debt")} /></Field>
                <Field label="Emergency savings (total)"><input type="number" data-testid="ob-emergency" className={inputCls} value={financial.emergency_fund} onChange={num(setFinancial, financial)("emergency_fund")} /></Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-manrope text-xl font-bold text-slate-50">Investment information</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Current investments (total value)"><input type="number" data-testid="ob-current-inv" className={inputCls} value={investment.current_investments} onChange={num(setInvestment, investment)("current_investments")} /></Field>
                <Field label="Lump-sum amount to invest now"><input type="number" data-testid="ob-inv-capacity" className={inputCls} value={investment.investment_capacity} onChange={num(setInvestment, investment)("investment_capacity")} /></Field>
                <Field label="Monthly SIP capacity" hint="How much you can invest every month"><input type="number" data-testid="ob-sip" className={inputCls} value={investment.monthly_sip_capacity} onChange={num(setInvestment, investment)("monthly_sip_capacity")} /></Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-manrope text-xl font-bold text-slate-50">Your primary financial goal</h2>
              <Field label="Goal type"><Pills testid="ob-goal-type" options={GOAL_TYPES} value={goal.goal_type} onChange={(v) => setGoal({ ...goal, goal_type: v })} /></Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Target amount (₹)"><input type="number" data-testid="ob-goal-target" className={inputCls} value={goal.target_amount} onChange={num(setGoal, goal)("target_amount")} /></Field>
                <Field label="Current savings for this goal (₹)"><input type="number" data-testid="ob-goal-current" className={inputCls} value={goal.current_amount} onChange={num(setGoal, goal)("current_amount")} /></Field>
                <Field label="Target date"><input type="date" data-testid="ob-goal-date" className={inputCls} value={goal.target_date} onChange={txt(setGoal, goal)("target_date")} /></Field>
                <Field label="Planned monthly contribution (₹)"><input type="number" data-testid="ob-goal-contribution" className={inputCls} value={goal.monthly_contribution} onChange={num(setGoal, goal)("monthly_contribution")} /></Field>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="font-manrope text-xl font-bold text-slate-50">Risk assessment</h2>
              <p className="text-sm text-slate-400">Your risk profile is derived from several factors — not a single question.</p>
              <Slider label="If your portfolio dropped 20%, you would..." value={risk.market_decline_reaction} min={1} max={5} step={1} onChange={(v) => setRisk({ ...risk, market_decline_reaction: v })} options={["Sell everything", "Sell some", "Do nothing (anxious)", "Hold confidently", "Buy more"]} />
              <Slider label="Your investment experience" value={risk.experience_level} min={1} max={5} step={1} onChange={(v) => setRisk({ ...risk, experience_level: v })} options={["None", "Limited", "Moderate", "Experienced", "Expert"]} />
              <Slider label="How long can you stay invested?" value={risk.investment_horizon_years} min={1} max={25} step={1} onChange={(v) => setRisk({ ...risk, investment_horizon_years: v })} suffix=" yrs" />
              <Slider label="Maximum loss you can financially tolerate" value={risk.loss_tolerance_pct} min={2} max={40} step={1} onChange={(v) => setRisk({ ...risk, loss_tolerance_pct: v })} suffix="%" />
              <Slider label="% of savings you'd expose to market risk" value={risk.equity_exposure_willingness_pct} min={5} max={100} step={5} onChange={(v) => setRisk({ ...risk, equity_exposure_willingness_pct: v })} suffix="%" />
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button onClick={back} disabled={step === 0} data-testid="ob-back-button" className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white disabled:opacity-30">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={next} disabled={saving} data-testid="ob-next-button" className="flex items-center gap-2 rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 4 ? <>Generate My Plan <Check className="h-4 w-4" /></> : <>Continue <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
