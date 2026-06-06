import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api, type Settings } from "@/lib/api";
import { TrendingUp, TrendingDown, Plus, Printer } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import AddJobModal from "@/components/add-job-modal";

const COLORS = { BW: "#3b82f6", Color: "#a855f7", Glossy: "#B4FF39", Photo: "#f97316" };

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const [chartView, setChartView] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [distPeriod, setDistPeriod] = useState<"today" | "week">("today");
  const [showAddJob, setShowAddJob] = useState(false);
  const qc = useQueryClient();

  const { data: stats } = useQuery({ queryKey: ["stats", "today"], queryFn: () => api.getDashboardStats("today") });
  const { data: summary } = useQuery({ queryKey: ["daily-summary"], queryFn: api.getDailySummary });
  const { data: recent } = useQuery({ queryKey: ["recent-activity"], queryFn: api.getRecentActivity });
  const { data: dist } = useQuery({ queryKey: ["distribution", distPeriod], queryFn: () => api.getPrintDistribution(distPeriod) });
  const { data: revenue } = useQuery({ queryKey: ["revenue", chartView], queryFn: () => api.getRevenueAnalytics(chartView) });

  // Listen for auto-detected print jobs
  useEffect(() => {
    window.electron?.onPrintJobDetected(() => {
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["daily-summary"] });
      qc.invalidateQueries({ queryKey: ["recent-activity"] });
    });
    return () => window.electron?.removePrintJobListener();
  }, [qc]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live metrics and recent activity</p>
        </div>
        <button
          onClick={() => setShowAddJob(true)}
          className="no-drag flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-sm glow-primary hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Print Job
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={fmt(stats?.totalRevenue ?? 0)} growth={stats?.revenueGrowth ?? 0} />
        <StatCard title="Total Pages" value={(stats?.totalPages ?? 0).toLocaleString()} growth={stats?.pagesGrowth ?? 0} />
        <StatCard title="Total Jobs" value={(stats?.totalJobs ?? 0).toLocaleString()} growth={stats?.jobsGrowth ?? 0} />
        <StatCard title="Glossy Revenue" value={fmt(stats?.glossyRevenue ?? 0)} growth={stats?.glossyGrowth ?? 0} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold">Revenue Analytics</h2>
            <div className="flex gap-1 bg-background rounded-xl p-1">
              {(["weekly", "monthly", "yearly"] as const).map((v) => (
                <button key={v} onClick={() => setChartView(v)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${chartView === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {v === "weekly" ? "Week" : v === "monthly" ? "Month" : "Year"}
                </button>
              ))}
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue?.data ?? []}>
                <XAxis dataKey="label" stroke="#555" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#0C0C0C", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }} />
                <Bar dataKey="bwAmount" name="B&W" stackId="a" fill={COLORS.BW} />
                <Bar dataKey="colorAmount" name="Color" stackId="a" fill={COLORS.Color} />
                <Bar dataKey="glossyAmount" name="Glossy" stackId="a" fill={COLORS.Glossy} />
                <Bar dataKey="photoAmount" name="Photo" stackId="a" fill={COLORS.Photo} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold">Distribution</h2>
            <div className="flex gap-1 bg-background rounded-xl p-1">
              {(["today", "week"] as const).map((v) => (
                <button key={v} onClick={() => setDistPeriod(v)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${distPeriod === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {v === "today" ? "Today" : "Week"}
                </button>
              ))}
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "B&W", value: dist?.bwPercent ?? 0 },
                    { name: "Color", value: dist?.colorPercent ?? 0 },
                    { name: "Glossy", value: dist?.glossyPercent ?? 0 },
                    { name: "Photo", value: dist?.photoPercent ?? 0 },
                  ]}
                  cx="50%" cy="45%" innerRadius={50} outerRadius={75}
                  paddingAngle={4} dataKey="value" stroke="none"
                >
                  {[COLORS.BW, COLORS.Color, COLORS.Glossy, COLORS.Photo].map((c, i) => (
                    <Cell key={i} fill={c} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0C0C0C", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "#888", fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card col-span-2 overflow-hidden" style={{ padding: 0 }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <h2 className="text-base font-semibold">Recent Activity</h2>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  {["Time", "Printer", "Type", "Pages", "Amount"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recent?.jobs ?? []).map((job) => (
                  <tr key={job.id} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{job.printTime}</td>
                    <td className="px-6 py-3 text-xs">{job.printerName}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-md border" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#aaa" }}>
                        {job.printType} / {job.paperType} / {job.paperSize}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs">{job.pages}</td>
                    <td className="px-6 py-3 text-xs font-semibold text-primary">₹{job.amount}</td>
                  </tr>
                ))}
                {(!recent?.jobs?.length) && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-xs">No recent activity</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold mb-5">Today's Summary</h2>
          <div className="space-y-3">
            {[
              { label: "B&W", color: COLORS.BW, amount: summary?.bwAmount ?? 0, pages: summary?.bwPages ?? 0 },
              { label: "Color", color: COLORS.Color, amount: summary?.colorAmount ?? 0, pages: summary?.colorPages ?? 0 },
              { label: "Glossy", color: COLORS.Glossy, amount: summary?.glossyAmount ?? 0, pages: summary?.glossyPages ?? 0 },
              { label: "Photo", color: COLORS.Photo, amount: summary?.photoAmount ?? 0, pages: summary?.photoPages ?? 0 },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: row.color }} />
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">₹{row.amount}</div>
                  <div className="text-xs text-muted-foreground">{row.pages} pgs</div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">₹{summary?.totalAmount ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {showAddJob && <AddJobModal onClose={() => { setShowAddJob(false); qc.invalidateQueries(); }} />}
    </div>
  );
}

function StatCard({ title, value, growth }: { title: string; value: string; growth: number }) {
  const pos = growth >= 0;
  return (
    <div className="card flex flex-col justify-between min-h-[110px]">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <div className="flex items-end justify-between mt-3">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-lg ${pos ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-400"}`}>
          {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(growth)}%
        </span>
      </div>
    </div>
  );
}
