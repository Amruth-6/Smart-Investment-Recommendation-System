import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Target,
  Sparkles,
  PieChart,
  TrendingUp,
  Brain,
  LineChart,
  Layers,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "../components/common/Logo";
import { useAuth } from "../context/AuthContext";

const WORKFLOW = [
  { label: "Profile", icon: TrendingUp },
  { label: "Risk", icon: ShieldCheck },
  { label: "Goals", icon: Target },
  { label: "AI Analysis", icon: Brain },
  { label: "Portfolio", icon: PieChart },
  { label: "Growth", icon: LineChart },
];

const FEATURES = [
  { icon: Target, title: "Goal-first investing", desc: "We start from what you want to achieve — a home, retirement, education — not from what's trending." },
  { icon: Brain, title: "AI-powered recommendations", desc: "A hybrid engine blends machine learning with financial rules to score every option for you." },
  { icon: ShieldCheck, title: "Risk-aware investing", desc: "We separate your willingness to take risk from your financial ability to absorb it." },
  { icon: Layers, title: "Portfolio diversification", desc: "Personalized asset allocation across equity, funds, bonds, gold and more." },
  { icon: Eye, title: "Explainable AI", desc: "Every recommendation comes with a clear 'why' — and an honest 'why not'." },
  { icon: PieChart, title: "Financial health analysis", desc: "A 0–100 score across savings, debt, emergency fund, discipline and diversification." },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "SmartInvest — Personalized Financial Planning";
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0C10] text-slate-100">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-blue-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-40 h-[360px] w-[360px] rounded-full bg-emerald-600/10 blur-[120px]" />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0C10]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Logo />
          <div className="flex items-center gap-3">
            <Link to="/login" data-testid="nav-login-link" className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white">
              Login
            </Link>
            <Link
              to={user ? "/dashboard" : "/register"}
              data-testid="nav-getstarted-link"
              className="group flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 pb-20 pt-16 lg:grid-cols-12 lg:px-8 lg:pt-24">
        <div className="animate-fade-up lg:col-span-7">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Explainable AI · Goal-based · Risk-aware
          </div>
          <h1 className="font-serif text-5xl font-light leading-[1.05] tracking-tight text-slate-50 sm:text-6xl lg:text-7xl">
            Smart Investment
            <br />
            <span className="italic text-blue-400">Recommendation</span> System
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            Your financial profile. Your goals. Your risk. Your personalized investment strategy.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to={user ? "/dashboard" : "/register"}
              data-testid="hero-getstarted-btn"
              className="group flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/login"
              data-testid="hero-login-btn"
              className="rounded-full border border-white/12 px-6 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/25 hover:bg-white/[0.03]"
            >
              Login
            </Link>
            <a
              href="#how-it-works"
              data-testid="hero-learn-btn"
              className="rounded-full px-4 py-3.5 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
            >
              Learn How It Works →
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-500">
            {["8 asset categories", "Hybrid ML engine", "Personalized portfolios"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual card */}
        <div className="animate-fade-up lg:col-span-5" style={{ animationDelay: "0.15s" }}>
          <div className="relative rounded-2xl border border-white/[0.08] bg-[#12151C] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Your Strategy</span>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">Live preview</span>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <div className="text-xs text-slate-500">Financial Health</div>
                <div className="font-mono-num text-4xl font-bold text-slate-50">78<span className="text-lg text-slate-500">/100</span></div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Risk Profile</div>
                <div className="font-manrope text-lg font-semibold text-amber-300">Moderate</div>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                { name: "Equity", pct: 45, color: "#3B82F6" },
                { name: "Mutual Funds", pct: 25, color: "#10B981" },
                { name: "Bonds", pct: 15, color: "#F59E0B" },
                { name: "Gold", pct: 10, color: "#8B5CF6" },
                { name: "Cash Reserve", pct: 5, color: "#64748B" },
              ].map((a) => (
                <div key={a.name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-400">{a.name}</span>
                    <span className="font-mono-num text-slate-300">{a.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="h-full rounded-full" style={{ width: `${a.pct}%`, backgroundColor: a.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg border border-blue-500/20 bg-blue-500/[0.06] p-3 text-xs leading-relaxed text-blue-200/80">
              <Sparkles className="mb-1 inline h-3.5 w-3.5" /> Recommended because your 8-year horizon supports moderate growth exposure with strong diversification.
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-10 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-400">How it works</div>
          <h2 className="mt-3 font-serif text-3xl font-light tracking-tight text-slate-50 sm:text-4xl">
            From who you are to how you grow
          </h2>
        </div>
        <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
          {WORKFLOW.map((step, i) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-1 flex-col items-center gap-3 rounded-xl border border-white/[0.08] bg-[#12151C] px-4 py-6 transition-colors hover:border-blue-500/30">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/12 text-blue-400">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-slate-200">{step.label}</span>
              </div>
              {i < WORKFLOW.length - 1 && (
                <ArrowRight className="mx-auto hidden h-5 w-5 shrink-0 text-slate-600 lg:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-400">Why this platform</div>
          <h2 className="mt-3 font-serif text-3xl font-light tracking-tight text-slate-50 sm:text-4xl">
            Not a stock tipster. A financial planning partner.
          </h2>
          <p className="mt-4 text-slate-400">
            We understand the person first, the goal second, and only then analyze suitable investments — producing a personalized, explainable plan.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-xl border border-white/[0.08] bg-[#12151C] p-6 transition-colors hover:border-white/[0.16]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] text-blue-400 transition-colors group-hover:bg-blue-500/12">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-manrope text-base font-semibold text-slate-100">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12151C] px-8 py-14 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-600/15 blur-[100px]" />
          <h2 className="relative font-serif text-3xl font-light tracking-tight text-slate-50 sm:text-4xl">
            Build your personalized investment plan
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-slate-400">
            Complete a short onboarding, discover your risk profile and financial health, and get an explainable, goal-based strategy.
          </p>
          <Link
            to={user ? "/dashboard" : "/register"}
            data-testid="cta-getstarted-btn"
            className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-blue-500 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="max-w-xl text-center text-xs leading-relaxed text-slate-600 sm:text-right">
            For educational and research purposes only. Provides analytical suggestions based on user-provided information. Does not guarantee returns or constitute professional financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
