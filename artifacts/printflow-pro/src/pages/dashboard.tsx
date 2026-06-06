import { Layout } from "@/components/layout";
import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGetDailySummary, getGetDailySummaryQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey, useGetPrintDistribution, getGetPrintDistributionQueryKey, useGetRevenueAnalytics, getGetRevenueAnalyticsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddPrintJobModal } from "@/components/add-job-modal";
import { TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const COLORS = { BW: "#3b82f6", Color: "#a855f7", Glossy: "#B4FF39", Photo: "#f97316" };

export default function Dashboard() {
  const [chartPeriod, setChartPeriod] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [distPeriod, setDistPeriod] = useState<"today" | "week" | "month" | "year">("today");

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ period: 'today' }, { query: { queryKey: getGetDashboardStatsQueryKey({ period: 'today' }) } });
  const { data: summary, isLoading: summaryLoading } = useGetDailySummary({ query: { queryKey: getGetDailySummaryQueryKey() } });
  const { data: recent, isLoading: recentLoading } = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() } });
  const { data: distribution, isLoading: distLoading } = useGetPrintDistribution({ period: distPeriod }, { query: { queryKey: getGetPrintDistributionQueryKey({ period: distPeriod }) } });
  const { data: revenueData, isLoading: revLoading } = useGetRevenueAnalytics({ view: chartPeriod }, { query: { queryKey: getGetRevenueAnalyticsQueryKey({ view: chartPeriod }) } });

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground mt-1">Live metrics and recent activity</p>
        </div>
        <AddPrintJobModal />
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 card-radius" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} growth={stats.revenueGrowth} />
          <StatCard title="Total Pages" value={stats.totalPages.toLocaleString()} growth={stats.pagesGrowth} />
          <StatCard title="Total Jobs" value={stats.totalJobs.toLocaleString()} growth={stats.jobsGrowth} />
          <StatCard title="Glossy Revenue" value={formatCurrency(stats.glossyRevenue)} growth={stats.glossyGrowth} />
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card className="col-span-2 card-radius border-border bg-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Revenue Analytics</h2>
            <ToggleGroup type="single" value={chartPeriod} onValueChange={(v) => v && setChartPeriod(v as any)} className="bg-background element-radius p-1">
              <ToggleGroupItem value="weekly" className="element-radius px-3 py-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Week</ToggleGroupItem>
              <ToggleGroupItem value="monthly" className="element-radius px-3 py-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Month</ToggleGroupItem>
              <ToggleGroupItem value="yearly" className="element-radius px-3 py-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Year</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="h-[300px] w-full">
            {revLoading ? <Skeleton className="w-full h-full" /> : revenueData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData.data}>
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

        <Card className="card-radius border-border bg-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Distribution</h2>
            <ToggleGroup type="single" value={distPeriod} onValueChange={(v) => v && setDistPeriod(v as any)} className="bg-background element-radius p-1 text-xs">
              <ToggleGroupItem value="today" className="element-radius px-2 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Today</ToggleGroupItem>
              <ToggleGroupItem value="week" className="element-radius px-2 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Week</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="h-[300px] w-full relative">
            {distLoading ? <Skeleton className="w-full h-full" /> : distribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "B&W", value: distribution.bwPercent },
                      { name: "Color", value: distribution.colorPercent },
                      { name: "Glossy", value: distribution.glossyPercent },
                      { name: "Photo", value: distribution.photoPercent },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {[COLORS.BW, COLORS.Color, COLORS.Glossy, COLORS.Photo].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0C0C0C', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 card-radius border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-6">Recent Activity</h2>
          {recentLoading ? <Skeleton className="h-64 w-full" /> : recent ? (
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Time</TableHead>
                    <TableHead>Printer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Pages</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.jobs.map((job) => (
                    <TableRow key={job.id} className="border-border hover:bg-white/5">
                      <TableCell className="font-mono text-xs">{job.printTime}</TableCell>
                      <TableCell>{job.printerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="element-radius border-border bg-background">
                          {job.printType} - {job.paperType} ({job.paperSize})
                        </Badge>
                      </TableCell>
                      <TableCell>{job.pages}</TableCell>
                      <TableCell className="text-right font-medium text-primary">₹{job.amount}</TableCell>
                    </TableRow>
                  ))}
                  {recent.jobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No recent activity</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </Card>

        <Card className="card-radius border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-6">Today's Summary</h2>
          {summaryLoading ? <Skeleton className="h-64 w-full" /> : summary ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground flex items-center"><div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS.BW }}></div>B&W</span>
                <div className="text-right">
                  <div className="font-medium">₹{summary.bwAmount}</div>
                  <div className="text-xs text-muted-foreground">{summary.bwPages} pgs</div>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground flex items-center"><div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS.Color }}></div>Color</span>
                <div className="text-right">
                  <div className="font-medium">₹{summary.colorAmount}</div>
                  <div className="text-xs text-muted-foreground">{summary.colorPages} pgs</div>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground flex items-center"><div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS.Glossy }}></div>Glossy</span>
                <div className="text-right">
                  <div className="font-medium text-primary">₹{summary.glossyAmount}</div>
                  <div className="text-xs text-muted-foreground">{summary.glossyPages} pgs</div>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground flex items-center"><div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS.Photo }}></div>Photo</span>
                <div className="text-right">
                  <div className="font-medium">₹{summary.photoAmount}</div>
                  <div className="text-xs text-muted-foreground">{summary.photoPages} pgs</div>
                </div>
              </div>
              <div className="flex justify-between items-center py-4 mt-2">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-2xl text-primary">₹{summary.totalAmount}</span>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, growth }: { title: string, value: string | number, growth: number }) {
  const isPositive = growth >= 0;
  return (
    <Card className="card-radius border-border bg-card p-6 flex flex-col justify-between">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="mt-4 flex items-end justify-between">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <div className={`flex items-center text-xs font-medium px-2 py-1 element-radius ${isPositive ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {Math.abs(growth)}%
        </div>
      </div>
    </Card>
  );
}
