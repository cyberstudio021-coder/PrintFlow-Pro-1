import { Layout } from "@/components/layout";
import { useGetPrinterAnalytics, getGetPrinterAnalyticsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer as PrinterIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Printers() {
  const { data, isLoading } = useGetPrinterAnalytics({ query: { queryKey: getGetPrinterAnalyticsQueryKey() } });

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Printers</h1>
          <p className="text-muted-foreground mt-1">Per-printer performance metrics</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 card-radius" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {data?.printers.map((printer) => (
            <Card key={printer.printerName} className="card-radius border-border bg-card p-6">
              <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center">
                    <PrinterIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{printer.printerName}</h2>
                    <p className="text-sm text-muted-foreground">{printer.totalJobs.toLocaleString()} jobs completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold tracking-tight text-primary">{formatCurrency(printer.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">Revenue Generated</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">B&W Pages</span>
                    <span className="font-medium">{printer.bwPages.toLocaleString()}</span>
                  </div>
                  <Progress value={(printer.bwPages / printer.totalPages) * 100} className="h-2 bg-background [&>div]:bg-blue-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Color Pages</span>
                    <span className="font-medium">{printer.colorPages.toLocaleString()}</span>
                  </div>
                  <Progress value={(printer.colorPages / printer.totalPages) * 100} className="h-2 bg-background [&>div]:bg-purple-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Glossy & Photo Pages</span>
                    <span className="font-medium">{(printer.glossyPages + printer.photoPages).toLocaleString()}</span>
                  </div>
                  <Progress value={((printer.glossyPages + printer.photoPages) / printer.totalPages) * 100} className="h-2 bg-background [&>div]:bg-primary" />
                </div>
                
                <div className="pt-4 border-t border-border flex justify-between">
                  <span className="text-muted-foreground font-medium">Total Pages Printed</span>
                  <span className="font-bold">{printer.totalPages.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
