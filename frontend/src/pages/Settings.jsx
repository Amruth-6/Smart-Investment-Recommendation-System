import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut, User, Cpu, ShieldCheck } from "lucide-react";
import api from "../lib/api";
import { PageHeader, Card, Disclaimer, SectionLabel } from "../components/common/UI";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: ml } = useQuery({ queryKey: ["ml-status"], queryFn: async () => (await api.get("/ml/status")).data });

  const handleLogout = async () => { await logout(); navigate("/"); };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and view system information." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <SectionLabel>Account</SectionLabel>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 font-manrope text-lg font-bold text-blue-300">{(user?.name || "U").charAt(0).toUpperCase()}</div>
              <div>
                <div className="font-manrope font-semibold text-slate-100">{user?.name}</div>
                <div className="text-sm text-slate-500">{user?.email}</div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0E1117] px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-slate-400"><User className="h-4 w-4" /> Role</span>
              <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-xs font-medium capitalize text-slate-200">{user?.role}</span>
            </div>
            <button onClick={handleLogout} data-testid="settings-logout" className="flex w-full items-center justify-center gap-2 rounded-full border border-red-500/25 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionLabel>System / AI Layer</SectionLabel>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0E1117] px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-slate-400"><Cpu className="h-4 w-4" /> Risk Classification Model</span>
              <span className={`text-xs font-medium ${ml?.risk_model_loaded ? "text-emerald-400" : "text-amber-400"}`}>{ml?.risk_model_loaded ? "Loaded (RandomForest)" : "Rule-based fallback"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0E1117] px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-slate-400"><Cpu className="h-4 w-4" /> Suitability Model</span>
              <span className={`text-xs font-medium ${ml?.recommendation_model_loaded ? "text-emerald-400" : "text-amber-400"}`}>{ml?.recommendation_model_loaded ? "Loaded (GradientBoosting)" : "Rule-based fallback"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0E1117] px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-slate-400"><ShieldCheck className="h-4 w-4" /> Auth</span>
              <span className="text-xs font-medium text-emerald-400">JWT (bcrypt)</span>
            </div>
          </div>
        </Card>
      </div>
      <Disclaimer />
    </div>
  );
}
