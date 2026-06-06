import { Layout } from "@/components/layout";
import { useGetReport, getGetReportQueryKey, GetReportFilter } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileIcon, FileTextIcon } from "lucide-react";

export default function Reports() {
  const [filter, setFilter] = useState<GetReportFilter>("today");
  
  const { data: report, isLoading } = useGetReport({ filter }, { query: { queryKey: getGetReportQueryKey({ filter }) } });

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">Export and view detailed transactions</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-[180px] element-radius bg-card border-border">
              <SelectValue placeholder="Select filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="element-radius border-border hover:bg-white/5">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" className="element-radius border-border hover:bg-white/5">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full card-radius" />
          <Skeleton className="h-96 w-full card-radius" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          <Card className="card-radius border-border bg-card p-6">
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(report.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Pages</p>
                <p className="text-3xl font-bold">{report.totalPages.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Revenue / Print</p>
                <p className="text-3xl font-bold">{formatCurrency(report.avgRevenuePerPrint)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Top Printer</p>
                <p className="text-3xl font-bold truncate">{report.topPrinter}</p>
              </div>
            </div>
          </Card>

          <Card className="card-radius border-border bg-card overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-semibold">Transactions ({report.jobs.length})</h2>
            </div>
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader className="bg-background/50 sticky top-0 backdrop-blur z-10">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Printer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Paper</TableHead>
                    <TableHead>Pages</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.jobs.map((job) => (
                    <TableRow key={job.id} className="border-border hover:bg-white/5">
                      <TableCell>
                        <div className="font-medium">{job.printDate}</div>
                        <div className="text-xs text-muted-foreground font-mono">{job.printTime}</div>
                      </TableCell>
                      <TableCell>{job.printerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="element-radius border-border bg-background">
                          {job.printType}
                        </Badge>
                      </TableCell>
                      <TableCell>{job.paperType} ({job.paperSize})</TableCell>
                      <TableCell>{job.pages}</TableCell>
                      <TableCell className="text-right font-medium text-primary">₹{job.amount}</TableCell>
                    </TableRow>
                  ))}
                  {report.jobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No transactions found for this period</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      ) : null}
    </Layout>
  );
}
