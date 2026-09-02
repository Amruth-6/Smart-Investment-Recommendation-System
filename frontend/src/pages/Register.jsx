import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatApiErrorDetail } from "../lib/api";
import { AuthShell, inputCls } from "./Login";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created! Let's set up your profile.");
      navigate("/onboarding");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start building your personalized investment plan">
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Full name</label>
          <input data-testid="register-name-input" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Jane Doe" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Email</label>
          <input data-testid="register-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
          <input data-testid="register-password-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="At least 6 characters" />
        </div>
        <button data-testid="register-submit-button" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" data-testid="goto-login-link" className="font-medium text-blue-400 hover:text-blue-300">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
