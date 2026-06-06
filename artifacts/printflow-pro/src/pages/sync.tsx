import { Layout } from "@/components/layout";
import { useGetSyncStatus, getGetSyncStatusQueryKey, useTriggerSync } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, AlertCircle, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Sync() {
  const { data: status, isLoading } = useGetSyncStatus({ query: { queryKey: getGetSyncStatusQueryKey() } });
  const triggerSync = useTriggerSync();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSync = () => {
    triggerSync.mutate(
      { data: {} },
      {
        onSuccess: (res) => {
          toast({ title: res.message, description: `Synced ${res.recordsSynced} records.` });
          queryClient.invalidateQueries({ queryKey: getGetSyncStatusQueryKey() });
        },
        onError: () => {
          toast({ title: "Sync failed", variant: "destructive" });
        }
      }
    );
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Google Sync</h1>
          <p className="text-muted-foreground mt-1">Manage Google Sheets synchronization</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="card-radius border-border bg-card p-6">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status?.connected ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                {status?.connected ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-bold">{status?.connected ? 'Connected' : 'Disconnected'}</h2>
                <p className="text-sm text-muted-foreground">Google Sheets Integration</p>
              </div>
            </div>
            <Button 
              onClick={handleSync} 
              disabled={triggerSync.isPending || !status?.connected}
              className="element-radius bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(180,255,57,0.2)]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${triggerSync.isPending ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-muted-foreground">Auto Sync</span>
              <span className="font-medium">{status?.autoSyncEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-muted-foreground">Last Sync Time</span>
              <span className="font-medium font-mono">{status?.lastSyncTime || 'Never'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-muted-foreground">Records Synced</span>
              <span className="font-medium text-primary">{status?.recordsSynced?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-muted-foreground">Sync Interval</span>
              <span className="font-medium">{status?.syncInterval} minutes</span>
            </div>
          </div>
        </Card>

        <Card className="card-radius border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-muted-foreground" />
            <h2 className="text-xl font-bold">Data Mapping</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">The following datasets are continuously synced to your configured Google Sheets document.</p>
          
          <div className="space-y-3">
            {[
              "Print Transactions (Jobs, Amounts, Printer)",
              "Daily Summary (Revenue by type)",
              "Monthly Summary Aggregations",
              "Printer Usage Statistics"
            ].map((item, i) => (
              <div key={i} className="flex items-center p-3 rounded-lg bg-background border border-border">
                <div className="w-2 h-2 rounded-full bg-primary mr-3"></div>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
