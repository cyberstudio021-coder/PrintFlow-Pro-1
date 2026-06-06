import { Minus, Square, X, Printer } from "lucide-react";

declare global {
  interface Window {
    electron?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      getApiPort: () => Promise<number>;
      onPrintJobDetected: (cb: (job: unknown) => void) => void;
      removePrintJobListener: () => void;
    };
  }
}

export default function TitleBar() {
  return (
    <div
      className="drag-region flex items-center justify-between h-10 px-4 border-b shrink-0"
      style={{ borderColor: "rgba(255,255,255,0.06)", background: "#050505" }}
    >
      <div className="flex items-center gap-2 no-drag">
        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
          <Printer className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold tracking-tight">
          PrintFlow<span className="text-primary">.</span>Pro
        </span>
      </div>

      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={() => window.electron?.minimize()}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => window.electron?.maximize()}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={() => window.electron?.close()}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-500/20 transition-colors text-muted-foreground hover:text-red-400"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
