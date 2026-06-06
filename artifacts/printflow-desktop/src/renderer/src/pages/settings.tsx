import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Settings } from "@/lib/api";
import { useState, useEffect } from "react";
import { Save, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: api.getSettings });
  const updateSettings = useMutation({
    mutationFn: (data: Partial<Settings>) => api.updateSettings(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const [form, setForm] = useState<Partial<Settings>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const set = (key: keyof Settings, value: number | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => updateSettings.mutate(form);

  const PriceInput = ({ label, field }: { label: string; field: keyof Settings }) => (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-background" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <span className="text-muted-foreground text-sm">₹</span>
        <input
          type="number"
          min={0}
          step={0.5}
          value={(form[field] as number) ?? ""}
          onChange={(e) => set(field, parseFloat(e.target.value) || 0)}
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure pricing and sync preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-sm glow-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : updateSettings.isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* B&W Pricing */}
      <div className="card">
        <h2 className="text-base font-semibold mb-5">Black & White Printing</h2>
        <div className="grid grid-cols-2 gap-4">
          <PriceInput label="A4 Price (per page)" field="bwA4Price" />
          <PriceInput label="A3 Price (per page)" field="bwA3Price" />
        </div>
      </div>

      {/* Color Pricing */}
      <div className="card">
        <h2 className="text-base font-semibold mb-5">Color Printing</h2>
        <div className="grid grid-cols-2 gap-4">
          <PriceInput label="A4 Price (per page)" field="colorA4Price" />
          <PriceInput label="A3 Price (per page)" field="colorA3Price" />
        </div>
      </div>

      {/* Special Paper */}
      <div className="card">
        <h2 className="text-base font-semibold mb-5">Special Paper</h2>
        <div className="grid grid-cols-2 gap-4">
          <PriceInput label="Glossy Price (per page)" field="glossyPrice" />
          <PriceInput label="Photo Price (per page)" field="photoPrice" />
        </div>
      </div>

      {/* Pricing rules summary */}
      <div className="card">
        <h2 className="text-base font-semibold mb-4">Pricing Rules</h2>
        <div className="space-y-2">
          {[
            { rule: "Rule 1", desc: "Paper Type = Glossy", formula: "Pages × Glossy Price" },
            { rule: "Rule 2", desc: "Paper Type = Photo", formula: "Pages × Photo Price" },
            { rule: "Rule 3", desc: "Print Type = Color", formula: "Pages × Color Price (by size)" },
            { rule: "Rule 4", desc: "Otherwise (B&W)", formula: "Pages × B&W Price (by size)" },
          ].map((r) => (
            <div key={r.rule} className="flex items-center gap-4 py-2.5 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <span className="text-xs font-medium text-primary w-14">{r.rule}</span>
              <span className="text-sm text-muted-foreground flex-1">{r.desc}</span>
              <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded-lg">{r.formula}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sync Settings */}
      <div className="card">
        <h2 className="text-base font-semibold mb-5">Sync Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium">Auto Sync</div>
              <div className="text-xs text-muted-foreground">Automatically sync to Google Sheets on a schedule</div>
            </div>
            <button
              onClick={() => set("autoSyncEnabled", !form.autoSyncEnabled)}
              className={`w-10 h-5.5 rounded-full transition-colors relative ${form.autoSyncEnabled ? "bg-primary" : "bg-white/10"}`}
              style={{ height: 22, width: 40 }}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.autoSyncEnabled ? "translate-x-[18px]" : ""}`} />
            </button>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Sync Interval (minutes)</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-background w-32" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <input
                type="number"
                min={5}
                max={1440}
                value={form.syncInterval ?? 60}
                onChange={(e) => set("syncInterval", parseInt(e.target.value) || 60)}
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
