import { Layout } from "@/components/layout";
import { useGetRevenueAnalytics, getGetRevenueAnalyticsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const COLORS = { BW: "#3b82f6", Color: "#a855f7", Glossy: "#B4FF39", Photo: "#f97316" };

export default function Analytics() {
  const [chartPeriod, setChartPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");
  
  const { data: revenueData, isLoading } = useGetRevenueAnalytics({ view: chartPeriod }, { query: { queryKey: getGetRevenueAnalyticsQueryKey({ view: chartPeriod }) } });

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revenue Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into revenue streams</p>
        </div>
        <ToggleGroup type="single" value={chartPeriod} onValueChange={(v) => v && setChartPeriod(v as any)} className="bg-card border border-border element-radius p-1">
          <ToggleGroupItem value="weekly" className="element-radius px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Weekly</ToggleGroupItem>
          <ToggleGroupItem value="monthly" className="element-radius px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Monthly</ToggleGroupItem>
          <ToggleGroupItem value="yearly" className="element-radius px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Yearly</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="card-radius border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Revenue ({chartPeriod})</h3>
          {isLoading ? <Skeleton className="h-8 w-32" /> : (
            <div className="text-3xl font-bold tracking-tight">{formatCurrency(revenueData?.totalRevenue || 0)}</div>
          )}
        </Card>
        <Card className="card-radius border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Pages ({chartPeriod})</h3>
          {isLoading ? <Skeleton className="h-8 w-32" /> : (
            <div className="text-3xl font-bold tracking-tight">{(revenueData?.totalPages || 0).toLocaleString()}</div>
          )}
        </Card>
      </div>

      <Card className="card-radius border-border bg-card p-6 h-[600px] flex flex-col">
        <h2 className="text-lg font-semibold mb-6">Revenue Breakdown</h2>
        <div className="flex-1 w-full relative min-h-[400px]">
          {isLoading ? <Skeleton className="w-full h-full" /> : revenueData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0C0C0C', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '12px' }} />
                <Bar dataKey="bwAmount" name="B&W" stackId="a" fill={COLORS.BW} radius={[0, 0, 0, 0]} />
                <Bar dataKey="colorAmount" name="Color" stackId="a" fill={COLORS.Color} />
                <Bar dataKey="glossyAmount" name="Glossy" stackId="a" fill={COLORS.Glossy} />
                <Bar dataKey="photoAmount" name="Photo" stackId="a" fill={COLORS.Photo} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </Card>
    </Layout>
  );
}
