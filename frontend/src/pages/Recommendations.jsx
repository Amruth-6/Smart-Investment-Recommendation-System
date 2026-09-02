import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, RefreshCw, Loader2, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { PageHeader, Card, Skeleton, EmptyState, Disclaimer } from "../components/common/UI";
import { scoreColor } from "../lib/format";

function MiniBar({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="text-slate-500">{label}</span>
        <span className="font-mono-num text-slate-400">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: scoreColor(value) }} />
      </div>
    </div>
  );
}

export default function Recommendations() {
  const qc = useQueryClient();
  const [gen, setGen] = useState(false);
  const { data: recs, isLoading } = useQuery({ queryKey: ["recommendations"], queryFn: async () => (await api.get("/recommendations")).data });

  const generate = async () => {
    setGen(true);
    try {
      await api.post("/recommendations/generate");
      qc.invalidateQueries({ queryKey: ["recommendations"] });
      toast.success("Recommendations generated");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setGen(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Personalized Recommendations"
        subtitle="A hybrid engine combining ML, financial rules, goal & risk compatibility, horizon and diversification."
        actions={<button onClick={generate} disabled={gen} data-testid="generate-recs-button" className="flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60">{gen ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Regenerate</button>}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : recs?.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {recs.map((r, idx) => (
            <Card key={r.id} className="p-6" data-testid={`rec-card-${idx}`}>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">{r.category}</span>
                  <h3 className="mt-2 font-manrope text-lg font-semibold text-slate-100">{r.investment_name}</h3>
                </div>
                <div className="text-right">
                  <div className="font-mono-num text-3xl font-bold" style={{ color: scoreColor(r.suitability_score) }}>{r.suitability_score}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">Suitability</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {Object.entries(r.subscores).slice(0, 6).map(([k, v]) => (
                  <MiniBar key={k} label={k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} value={v} />
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2 text-xs text-slate-400">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className="line-clamp-2">{r.reasons?.[0]}</span>
              </div>
              {r.cautions?.[0] && (
                <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span className="line-clamp-1">{r.cautions[0]}</span>
                </div>
              )}
              <Link to={`/recommendations/${r.id}`} data-testid={`rec-details-${idx}`} className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">Why this recommendation? <ArrowRight className="h-3 w-3" /></Link>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Sparkles} title="No recommendations yet" description="Generate personalized recommendations based on your profile, risk and goals." action={<button onClick={generate} className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">Generate now</button>} />
      )}
      <Disclaimer />
    </div>
  );
}
