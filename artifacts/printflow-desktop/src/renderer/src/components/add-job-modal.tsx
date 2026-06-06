import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { X } from "lucide-react";

interface Props { onClose: () => void; }

export default function AddJobModal({ onClose }: Props) {
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: api.getSettings });
  const [form, setForm] = useState({
    printerName: "", pages: 1,
    printType: "BW", paperSize: "A4", paperType: "Plain",
  });

  const createJob = useMutation({
    mutationFn: () => api.createPrintJob(form as any),
    onSuccess: onClose,
  });

  const calcEstimate = () => {
    if (!settings) return 0;
    const { pages, printType, paperSize, paperType } = form;
    let rate = 0;
    if (paperType === "Glossy") rate = settings.glossyPrice;
    else if (paperType === "Photo") rate = settings.photoPrice;
    else if (printType === "BW") rate = paperSize === "A3" ? settings.bwA3Price : settings.bwA4Price;
    else rate = paperSize === "A3" ? settings.colorA3Price : settings.colorA4Price;
    return rate * pages;
  };

  const set = (key: string, value: string | number) => setForm((f) => ({ ...f, [key]: value }));

  const Select = ({ label, field, options }: { label: string; field: string; options: string[] }) => (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
      <select
        value={(form as any)[field]}
        onChange={(e) => set(field, e.target.value)}
        className="w-full px-3 py-2 rounded-xl border bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        {options.map((o) => <option key={o} value={o}>{o === "BW" ? "B&W" : o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="card w-[420px] space-y-5" style={{ borderRadius: 28 }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">New Print Job</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Printer Name</label>
            <input
              placeholder="e.g. HP LaserJet 1"
              value={form.printerName}
              onChange={(e) => set("printerName", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Pages</label>
              <input
                type="number" min={1}
                value={form.pages}
                onChange={(e) => set("pages", parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              />
            </div>
            <Select label="Paper Size" field="paperSize" options={["A4", "A3"]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Print Type" field="printType" options={["BW", "Color", "Glossy", "Photo"]} />
            <Select label="Paper Type" field="paperType" options={["Plain", "Glossy", "Photo"]} />
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{ background: "rgba(180,255,57,0.04)", borderColor: "rgba(180,255,57,0.15)" }}>
          <span className="text-sm text-muted-foreground">Estimated Amount</span>
          <span className="text-xl font-bold text-primary">₹{calcEstimate()}</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            Cancel
          </button>
          <button
            onClick={() => createJob.mutate()}
            disabled={!form.printerName || createJob.isPending}
            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold glow-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {createJob.isPending ? "Adding..." : "Confirm Job"}
          </button>
        </div>
      </div>
    </div>
  );
}
