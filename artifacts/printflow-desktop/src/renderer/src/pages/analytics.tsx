import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = { BW: "#3b82f6", Color: "#a855f7", Glossy: "#B4FF39", Photo: "#f97316" };
const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function Analytics() {
  const [view, setView] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const year = new Date().getFullYear();
  const { data } = useQuery({ queryKey: ["revenue-analytics", view], queryFn: () => api.getRevenueAnalytics(view, year) });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Full revenue breakdown by print type and time period</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: fmt(data?.totalRevenue ?? 0), color: "#B4FF39" },
          { label: "B&W Revenue", value: fmt(data?.data?.reduce((s, d) => s + d.bwAmount, 0) ?? 0), color: COLORS.BW },
          { label: "Color Revenue", value: fmt(data?.data?.reduce((s, d) => s + d.colorAmount, 0) ?? 0), color: COLORS.Color },
          { label: "Glossy + Photo", value: fmt(data?.data?.reduce((s, d) => s + d.glossyAmount + d.photoAmount, 0) ?? 0), color: COLORS.Photo },
        ].map((c) => (
          <div key={c.label} className="card">
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className="text-xl font-bold mt-2" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold">Revenue Over Time</h2>
          <div className="flex gap-1 bg-background rounded-xl p-1">
            {(["weekly", "monthly", "yearly"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {v === "weekly" ? "This Week" : v === "monthly" ? `${year}` : "Last 5 Years"}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.data ?? []} barSize={28}>
              <XAxis dataKey="label" stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#555" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{ background: "#0C0C0C", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}
                formatter={(value: number, name: string) => [fmt(value), name]}
              />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "#888", fontSize: 12 }}>{v}</span>} />
              <Bar dataKey="bwAmount" name="B&W" stackId="a" fill={COLORS.BW} />
              <Bar dataKey="colorAmount" name="Color" stackId="a" fill={COLORS.Color} />
              <Bar dataKey="glossyAmount" name="Glossy" stackId="a" fill={COLORS.Glossy} />
              <Bar dataKey="photoAmount" name="Photo" stackId="a" fill={COLORS.Photo} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h2 className="text-base font-semibold">Detailed Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {["Period", "B&W", "Color", "Glossy", "Photo", "Total"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((row) => (
                <tr key={row.label} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <td className="px-6 py-3 font-medium">{row.label}</td>
                  <td className="px-6 py-3 text-[#3b82f6]">{fmt(row.bwAmount)}</td>
                  <td className="px-6 py-3 text-[#a855f7]">{fmt(row.colorAmount)}</td>
                  <td className="px-6 py-3 text-primary">{fmt(row.glossyAmount)}</td>
                  <td className="px-6 py-3 text-[#f97316]">{fmt(row.photoAmount)}</td>
                  <td className="px-6 py-3 font-semibold">{fmt(row.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
