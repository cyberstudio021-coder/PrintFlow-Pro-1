import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { RefreshCw, CheckCircle, XCircle, Clock, Database } from "lucide-react";
import { useState } from "react";

export default function Sync() {
  const qc = useQueryClient();
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const { data: status } = useQuery({ queryKey: ["sync-status"], queryFn: api.getSyncStatus });
  const triggerSync = useMutation({
    mutationFn: api.triggerSync,
    onSuccess: (data) => {
      setLastMessage(data.message);
      qc.invalidateQueries({ queryKey: ["sync-status"] });
    },
  });

  const formatTime = (t: string | null) => {
    if (!t) return "Never";
    return new Date(t).toLocaleString("en-IN");
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Google Sync</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Synchronize print data to Google Sheets</p>
      </div>

      {/* Connection status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status?.connected ? "bg-primary/10" : "bg-white/5"}`}>
              {status?.connected
                ? <CheckCircle className="w-5 h-5 text-primary" />
                : <XCircle className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div>
              <div className="font-medium">{status?.connected ? "Connected to Google" : "Not Connected"}</div>
              <div className="text-xs text-muted-foreground">
                {status?.connected ? "Google account linked" : "Connect your Google account to enable sync"}
              </div>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-xl border text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
            onClick={() => window.electron?.openExternal("https://accounts.google.com")}
          >
            {status?.connected ? "Disconnect" : "Connect Google Account"}
          </button>
        </div>
      </div>

      {/* Sync stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Last Sync</span>
          </div>
          <div className="font-semibold">{formatTime(status?.lastSyncTime ?? null)}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Records Synced</span>
          </div>
          <div className="font-semibold">{(status?.recordsSynced ?? 0).toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Auto-Sync Interval</span>
          </div>
          <div className="font-semibold">{status?.syncInterval ?? 60} min</div>
        </div>
      </div>

      {/* Manual sync */}
      <div className="card">
        <h2 className="text-base font-semibold mb-4">Manual Sync</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Sync all print jobs, daily summaries, monthly totals, and printer usage stats to Google Sheets.
        </p>
        {lastMessage && (
          <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary/90">
            {lastMessage}
          </div>
        )}
        <button
          onClick={() => triggerSync.mutate()}
          disabled={triggerSync.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm glow-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${triggerSync.isPending ? "animate-spin" : ""}`} />
          {triggerSync.isPending ? "Syncing..." : "Sync Now"}
        </button>
      </div>

      {/* Sheet structure */}
      <div className="card">
        <h2 className="text-base font-semibold mb-4">Sheet Structure</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "Sheet 1: Print Transactions", cols: ["Date", "Time", "Printer", "Pages", "Print Type", "Paper Type", "Rate", "Amount"] },
            { name: "Sheet 2: Daily Summary", cols: ["Date", "B&W Pages", "Color Pages", "Glossy Pages", "Total Pages", "Total Amount"] },
            { name: "Sheet 3: Monthly Summary", cols: ["Month", "Total Pages", "Total Revenue"] },
            { name: "Sheet 4: Printer Usage", cols: ["Printer", "Total Pages", "Revenue"] },
          ].map((s) => (
            <div key={s.name} className="card-sm">
              <div className="text-xs font-medium text-primary mb-2">{s.name}</div>
              <div className="flex flex-wrap gap-1">
                {s.cols.map((c) => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-muted-foreground">{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
