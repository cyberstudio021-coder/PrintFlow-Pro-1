import { Layout } from "@/components/layout";
import {
  useGetSettings,
  getGetSettingsQueryKey,
  useUpdateSettings,
  useGetSyncStatus,
  getGetSyncStatusQueryKey,
  useTriggerSync,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { RefreshCw, Wifi, WifiOff, Clock, Database, RotateCcw, AlertCircle } from "lucide-react";

const DEFAULTS = {
  bwA4Price: 2,
  bwA3Price: 4,
  colorA4Price: 10,
  colorA3Price: 20,
  glossyPrice: 25,
  photoPrice: 30,
  autoSyncEnabled: false,
  syncInterval: 60,
};

type FormData = typeof DEFAULTS;

function formatSyncTime(isoString: string | null) {
  if (!isoString) return "Never";
  const date = new Date(isoString);
  return date.toLocaleString();
}

function priceError(val: number): string | null {
  if (isNaN(val) || val < 0) return "Must be ≥ 0";
  return null;
}

function intervalError(val: number): string | null {
  if (isNaN(val) || val < 1) return "Must be ≥ 1";
  if (!Number.isInteger(val)) return "Must be a whole number";
  return null;
}

function formHasErrors(f: FormData): boolean {
  return (
    priceError(f.bwA4Price) !== null ||
    priceError(f.bwA3Price) !== null ||
    priceError(f.colorA4Price) !== null ||
    priceError(f.colorA3Price) !== null ||
    priceError(f.glossyPrice) !== null ||
    priceError(f.photoPrice) !== null ||
    intervalError(f.syncInterval) !== null
  );
}

function isDirty(form: FormData, saved: FormData): boolean {
  return (Object.keys(form) as (keyof FormData)[]).some(
    (k) => form[k] !== saved[k]
  );
}

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() },
  });
  const { data: syncStatus, isLoading: syncLoading } = useGetSyncStatus({
    query: {
      queryKey: getGetSyncStatusQueryKey(),
      refetchInterval: 30_000,
    },
  });
  const updateSettings = useUpdateSettings();
  const triggerSync = useTriggerSync();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormData>(DEFAULTS);
  const [savedData, setSavedData] = useState<FormData>(DEFAULTS);

  useEffect(() => {
    if (settings) {
      const loaded: FormData = {
        bwA4Price: settings.bwA4Price,
        bwA3Price: settings.bwA3Price,
        colorA4Price: settings.colorA4Price,
        colorA3Price: settings.colorA3Price,
        glossyPrice: settings.glossyPrice,
        photoPrice: settings.photoPrice,
        autoSyncEnabled: settings.autoSyncEnabled,
        syncInterval: settings.syncInterval,
      };
      setFormData(loaded);
      setSavedData(loaded);
    }
  }, [settings]);

  const handleChange = (field: keyof FormData, value: number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFormData(DEFAULTS);
  };

  const handleSave = () => {
    if (formHasErrors(formData)) return;
    updateSettings.mutate(
      { data: formData },
      {
        onSuccess: (updated) => {
          const next: FormData = {
            bwA4Price: updated.bwA4Price,
            bwA3Price: updated.bwA3Price,
            colorA4Price: updated.colorA4Price,
            colorA3Price: updated.colorA3Price,
            glossyPrice: updated.glossyPrice,
            photoPrice: updated.photoPrice,
            autoSyncEnabled: updated.autoSyncEnabled,
            syncInterval: updated.syncInterval,
          };
          setSavedData(next);
          toast({ title: "Settings saved" });
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to save settings", variant: "destructive" });
        },
      }
    );
  };

  const handleSyncNow = () => {
    triggerSync.mutate(
      { data: {} },
      {
        onSuccess: (result) => {
          toast({ title: `Sync complete — ${result.recordsSynced} records`, description: result.message });
          queryClient.invalidateQueries({ queryKey: getGetSyncStatusQueryKey() });
        },
        onError: () => {
          toast({ title: "Sync failed", variant: "destructive" });
        },
      }
    );
  };

  const dirty = isDirty(formData, savedData);
  const hasErrors = formHasErrors(formData);

  const PriceField = ({
    label,
    field,
    accent,
  }: {
    label: string;
    field: keyof FormData;
    accent?: string;
  }) => {
    const val = formData[field] as number;
    const err = priceError(val);
    return (
      <div>
        <label className={`text-xs mb-1 block ${accent ?? ""}`}>{label}</label>
        <Input
          type="number"
          min={0}
          step={0.5}
          value={val}
          onChange={(e) => handleChange(field, Number(e.target.value))}
          className={`element-radius bg-background border-border ${err ? "border-destructive" : ""}`}
        />
        {err && (
          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {err}
          </p>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure pricing and system preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && !isLoading && (
            <span className="text-xs text-amber-500 font-medium">Unsaved changes</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isLoading}
            className="element-radius"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending || isLoading || !dirty || hasErrors}
            className="element-radius bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full card-radius" />
          <Skeleton className="h-64 w-full card-radius" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pricing Rates */}
          <Card className="card-radius border-border bg-card p-6">
            <h2 className="text-xl font-bold mb-6 text-primary">
              Printing Rates (₹)
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Black & White
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <PriceField label="A4 Price" field="bwA4Price" />
                  <PriceField label="A3 Price" field="bwA3Price" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Color
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <PriceField label="A4 Price" field="colorA4Price" />
                  <PriceField label="A3 Price" field="colorA3Price" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Special Paper
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <PriceField label="Glossy Price" field="glossyPrice" accent="text-primary" />
                  <PriceField label="Photo Price" field="photoPrice" accent="text-orange-500" />
                </div>
              </div>
            </div>
          </Card>

          {/* System Settings */}
          <div className="space-y-6">
            {/* Sync Status */}
            <Card className="card-radius border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Google Sync</h2>
                {syncLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : syncStatus?.connected ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <Wifi className="h-3 w-3 mr-1" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground border-border">
                    <WifiOff className="h-3 w-3 mr-1" /> Not Connected
                  </Badge>
                )}
              </div>

              {/* Sync stats */}
              {!syncLoading && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 rounded-xl border border-border bg-background">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                      <Clock className="h-3 w-3" /> Last Sync
                    </div>
                    <p className="text-sm font-medium truncate">
                      {formatSyncTime(syncStatus?.lastSyncTime ?? null)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-background">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                      <Database className="h-3 w-3" /> Records Synced
                    </div>
                    <p className="text-sm font-medium">
                      {syncStatus?.recordsSynced ?? 0}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
                  <div>
                    <p className="font-medium">Auto Sync</p>
                    <p className="text-xs text-muted-foreground">
                      Automatically push data to Google Sheets
                    </p>
                  </div>
                  <Switch
                    checked={formData.autoSyncEnabled}
                    onCheckedChange={(v) => handleChange("autoSyncEnabled", v)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                <div>
                  <label className="text-sm mb-1 block">
                    Sync Interval (minutes)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={formData.syncInterval}
                    onChange={(e) =>
                      handleChange("syncInterval", Number(e.target.value))
                    }
                    className={`element-radius bg-background border-border ${intervalError(formData.syncInterval) ? "border-destructive" : ""}`}
                    disabled={!formData.autoSyncEnabled}
                  />
                  {intervalError(formData.syncInterval) && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />{" "}
                      {intervalError(formData.syncInterval)}
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full element-radius"
                  onClick={handleSyncNow}
                  disabled={triggerSync.isPending}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${triggerSync.isPending ? "animate-spin" : ""}`}
                  />
                  {triggerSync.isPending ? "Syncing..." : "Sync Now"}
                </Button>

                {!syncStatus?.connected && (
                  <p className="text-xs text-muted-foreground text-center">
                    Connect a Google account to enable live sync to Sheets
                  </p>
                )}
              </div>
            </Card>

            {/* Pricing Rules reference card */}
            <Card className="card-radius border-border bg-card p-6">
              <h2 className="text-xl font-bold mb-4">Pricing Rules</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span>B&W A4</span>
                  <span className="font-medium text-foreground">₹{formData.bwA4Price} / page</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span>B&W A3</span>
                  <span className="font-medium text-foreground">₹{formData.bwA3Price} / page</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span>Color A4</span>
                  <span className="font-medium text-foreground">₹{formData.colorA4Price} / page</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span>Color A3</span>
                  <span className="font-medium text-foreground">₹{formData.colorA3Price} / page</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span>Glossy Paper</span>
                  <span className="font-medium text-primary">₹{formData.glossyPrice} / page</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Photo Paper</span>
                  <span className="font-medium text-orange-500">₹{formData.photoPrice} / page</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Amount = Pages × Rate. Changes take effect on new print jobs.
              </p>
            </Card>
          </div>
        </div>
      )}
    </Layout>
  );
}
