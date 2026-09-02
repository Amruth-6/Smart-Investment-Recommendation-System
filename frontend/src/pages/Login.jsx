import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Logo } from "../components/common/Logo";
import { useAuth } from "../context/AuthContext";
import { formatApiErrorDetail } from "../lib/api";

function AuthShell({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen bg-[#0A0C10]">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-[#0B0E13] p-12 lg:flex">
        <div className="pointer-events-none absolute -left-20 top-10 h-80 w-80 rounded-full bg-blue-600/15 blur-[110px]" />
        <Logo />
        <div className="relative">
          <h2 className="font-serif text-4xl font-light leading-tight text-slate-50">
            Understand yourself first.
            <br />
            <span className="italic text-blue-400">Then invest with clarity.</span>
          </h2>
          <p className="mt-5 max-w-md text-slate-400">
            A goal-based, risk-aware and explainable approach to building your personalized investment strategy.
          </p>
        </div>
        <p className="relative text-xs text-slate-600">Educational platform · Returns are not guaranteed</p>
      </div>
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-manrope text-2xl font-bold tracking-tight text-slate-50">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-[#12151C] px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors focus:border-blue-500/60";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success("Welcome back!");
      navigate(u.role === "admin" ? "/admin" : u.onboarded ? "/dashboard" : "/onboarding");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (creds) => {
    setEmail(creds.email);
    setPassword(creds.password);
    setLoading(true);
    try {
      const u = await login(creds.email, creds.password);
      toast.success("Signed in");
      navigate(u.role === "admin" ? "/admin" : u.onboarded ? "/dashboard" : "/onboarding");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your financial planning dashboard">
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Email</label>
          <input data-testid="login-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
          <input data-testid="login-password-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
        </div>
        <button data-testid="login-submit-button" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <div className="mt-5 space-y-2">
        <div className="text-center text-[11px] uppercase tracking-widest text-slate-600">Quick demo access</div>
        <button data-testid="demo-user-button" onClick={() => demoLogin({ email: "demo@smartinvest.com", password: "Demo@12345" })} className="w-full rounded-lg border border-white/10 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-white/25 hover:bg-white/[0.03]">
          Login as Demo User
        </button>
        <button data-testid="demo-admin-button" onClick={() => demoLogin({ email: "admin@smartinvest.com", password: "Admin@12345" })} className="w-full rounded-lg border border-amber-500/20 py-2 text-xs font-medium text-amber-300 transition-colors hover:border-amber-500/40 hover:bg-amber-500/[0.05]">
          Login as Admin
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link to="/register" data-testid="goto-register-link" className="font-medium text-blue-400 hover:text-blue-300">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

export { AuthShell, inputCls };
