import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GitCompareArrows, TrendingUp } from "lucide-react";
import api from "../lib/api";
import { PageHeader, Card, Skeleton, Disclaimer } from "../components/common/UI";
import { formatINR } from "../lib/format";

const CATEGORIES = ["all", "Equity", "Mutual Funds", "ETFs", "Bonds", "Fixed Deposits", "Gold", "Government Securities", "REITs"];
const RISK_LABEL = ["", "Very Low", "Low", "Moderate", "High", "Very High"];

export default function InvestmentExplorer() {
  const navigate = useNavigate();
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState([]);

  const { data: overview } = useQuery({ queryKey: ["market-overview"], queryFn: async () => (await api.get("/market/overview")).data });
  const { data: investments, isLoading } = useQuery({ queryKey: ["market-investments", cat], queryFn: async () => (await api.get(`/market/investments?category=${cat}`)).data });

  const toggle = (inv) => {
    setSelected((prev) => {
      if (prev.find((x) => x.id === inv.id)) return prev.filter((x) => x.id !== inv.id);
      if (prev.length >= 2) return [prev[1], inv];
      return [...prev, inv];
    });
  };

  return (
    <div>
      <PageHeader
        title="Investment Explorer"
        subtitle="Explore the investment universe across 8 asset categories. Select two to compare."
        actions={selected.length === 2 && <button onClick={() => navigate("/investments/compare", { state: { selected } })} data-testid="compare-button" className="flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"><GitCompareArrows className="h-4 w-4" /> Compare ({selected.length})</button>}
      />

      {/* Market strip */}
      {overview && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {overview.indices.map((ix) => (
            <Card key={ix.name} className="p-4">
              <div className="text-xs text-slate-500">{ix.name}</div>
              <div className="font-mono-num text-lg font-bold text-slate-100">{ix.value.toLocaleString("en-IN")}</div>
              <div className={`text-xs font-medium ${ix.change_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>{ix.change_pct >= 0 ? "▲" : "▼"} {Math.abs(ix.change_pct)}%</div>
            </Card>
          ))}
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)} data-testid={`cat-filter-${c}`} className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${cat === c ? "border-blue-500/50 bg-blue-500/15 text-blue-200" : "border-white/10 text-slate-400 hover:text-slate-200"}`}>{c === "all" ? "All" : c}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {investments?.map((inv) => {
            const isSel = selected.find((x) => x.id === inv.id);
            return (
              <Card key={inv.id} className={`cursor-pointer p-5 ${isSel ? "border-blue-500/50 ring-1 ring-blue-500/30" : ""}`} onClick={() => toggle(inv)} data-testid={`inv-card-${inv.id}`}>
                <div className="mb-2 flex items-start justify-between">
                  <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">{inv.category}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${inv.risk_level >= 4 ? "bg-red-500/15 text-red-300" : inv.risk_level === 3 ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"}`}>{RISK_LABEL[inv.risk_level]} risk</span>
                </div>
                <h3 className="font-manrope font-semibold text-slate-100">{inv.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{inv.description}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
                  <div><div className="text-[10px] text-slate-500">Return</div><div className="font-mono-num text-sm font-semibold text-emerald-300">{inv.expected_return}%</div></div>
                  <div><div className="text-[10px] text-slate-500">Volatility</div><div className="font-mono-num text-sm font-semibold text-amber-300">{inv.volatility}%</div></div>
                  <div><div className="text-[10px] text-slate-500">Min</div><div className="font-mono-num text-sm font-semibold text-slate-200">{formatINR(inv.minimum_investment, true)}</div></div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Disclaimer />
    </div>
  );
}
