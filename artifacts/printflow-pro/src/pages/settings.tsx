import { Layout } from "@/components/layout";
import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    bwA4Price: 0, bwA3Price: 0, colorA4Price: 0, colorA3Price: 0, glossyPrice: 0, photoPrice: 0, autoSyncEnabled: false, syncInterval: 60
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        bwA4Price: settings.bwA4Price,
        bwA3Price: settings.bwA3Price,
        colorA4Price: settings.colorA4Price,
        colorA3Price: settings.colorA3Price,
        glossyPrice: settings.glossyPrice,
        photoPrice: settings.photoPrice,
        autoSyncEnabled: settings.autoSyncEnabled,
        syncInterval: settings.syncInterval
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateSettings.mutate(
      { data: formData },
      {
        onSuccess: () => {
          toast({ title: "Settings saved successfully" });
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to save settings", variant: "destructive" });
        }
      }
    );
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure pricing and system preferences</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={updateSettings.isPending || isLoading}
          className="element-radius bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          {updateSettings.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full card-radius" />
          <Skeleton className="h-64 w-full card-radius" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="card-radius border-border bg-card p-6">
            <h2 className="text-xl font-bold mb-6 text-primary">Printing Rates (₹)</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Black & White</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs mb-1 block">A4 Price</label>
                    <Input type="number" value={formData.bwA4Price} onChange={e => handleChange('bwA4Price', Number(e.target.value))} className="element-radius bg-background border-border" />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block">A3 Price</label>
                    <Input type="number" value={formData.bwA3Price} onChange={e => handleChange('bwA3Price', Number(e.target.value))} className="element-radius bg-background border-border" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Color</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs mb-1 block">A4 Price</label>
                    <Input type="number" value={formData.colorA4Price} onChange={e => handleChange('colorA4Price', Number(e.target.value))} className="element-radius bg-background border-border" />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block">A3 Price</label>
                    <Input type="number" value={formData.colorA3Price} onChange={e => handleChange('colorA3Price', Number(e.target.value))} className="element-radius bg-background border-border" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Special Paper</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs mb-1 block text-primary">Glossy Price</label>
                    <Input type="number" value={formData.glossyPrice} onChange={e => handleChange('glossyPrice', Number(e.target.value))} className="element-radius bg-background border-border" />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block text-orange-500">Photo Price</label>
                    <Input type="number" value={formData.photoPrice} onChange={e => handleChange('photoPrice', Number(e.target.value))} className="element-radius bg-background border-border" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="card-radius border-border bg-card p-6">
            <h2 className="text-xl font-bold mb-6">System Settings</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Google Sync</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
                    <div>
                      <p className="font-medium">Auto Sync</p>
                      <p className="text-xs text-muted-foreground">Automatically push data to Google Sheets</p>
                    </div>
                    <Switch 
                      checked={formData.autoSyncEnabled} 
                      onCheckedChange={(v) => handleChange('autoSyncEnabled', v)} 
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm mb-1 block">Sync Interval (minutes)</label>
                    <Input 
                      type="number" 
                      value={formData.syncInterval} 
                      onChange={e => handleChange('syncInterval', Number(e.target.value))} 
                      className="element-radius bg-background border-border"
                      disabled={!formData.autoSyncEnabled}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
