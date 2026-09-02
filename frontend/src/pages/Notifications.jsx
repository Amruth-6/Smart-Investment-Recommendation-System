import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, AlertTriangle, Info, CheckCheck } from "lucide-react";
import api from "../lib/api";
import { PageHeader, Card, Skeleton, EmptyState } from "../components/common/UI";

export default function Notifications() {
  const qc = useQueryClient();
  const { data: notes, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: async () => (await api.get("/notifications")).data });

  const markAll = async () => { await api.put("/notifications/read-all"); qc.invalidateQueries({ queryKey: ["notifications"] }); };
  const markRead = async (id) => { await api.put(`/notifications/${id}/read`); qc.invalidateQueries({ queryKey: ["notifications"] }); };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Alerts about your goals, portfolio and financial health."
        actions={notes?.length > 0 && <button onClick={markAll} data-testid="mark-all-read" className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:border-white/25"><CheckCheck className="h-4 w-4" /> Mark all read</button>}
      />

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : notes?.length ? (
        <div className="space-y-3">
          {notes.map((n) => {
            const Icon = n.type === "warning" ? AlertTriangle : Info;
            const color = n.type === "warning" ? "text-amber-400" : "text-blue-400";
            return (
              <Card key={n.id} onClick={() => markRead(n.id)} className={`flex cursor-pointer items-start gap-3 p-4 ${n.is_read ? "opacity-60" : ""}`} data-testid={`notification-${n.id}`}>
                <span className={`mt-0.5 ${color}`}><Icon className="h-5 w-5" /></span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-manrope font-semibold text-slate-100">{n.title}</span>
                    {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">{n.message}</p>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Bell} title="You're all caught up" description="No new notifications right now." />
      )}
    </div>
  );
}
