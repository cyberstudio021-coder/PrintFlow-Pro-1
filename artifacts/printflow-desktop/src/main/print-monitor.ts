import { spawn } from "child_process";
import { EventEmitter } from "events";
import { getSettings, insertPrintJob } from "./db";

export class PrintMonitor extends EventEmitter {
  private watchProcess: ReturnType<typeof spawn> | null = null;
  private polling = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  start() {
    if (process.platform !== "win32") {
      // Non-Windows: use simulation mode for development
      this.startSimulation();
      return;
    }
    this.startWmiWatch();
  }

  stop() {
    this.polling = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.watchProcess) {
      this.watchProcess.kill();
      this.watchProcess = null;
    }
  }

  private startWmiWatch() {
    // PowerShell script to watch for new print jobs via WMI
    const psScript = `
$query = "SELECT * FROM __InstanceCreationEvent WITHIN 2 WHERE TargetInstance ISA 'Win32_PrintJob'"
Register-WmiEvent -Query $query -Action {
  $job = $Event.SourceEventArgs.NewEvent.TargetInstance
  $output = @{
    printer = $job.Name -replace ',.*',''
    pages = [int]$job.TotalPages
    size = 'A4'
    type = if ($job.ColorMode -eq 4) { 'Color' } else { 'BW' }
  } | ConvertTo-Json -Compress
  Write-Output $output
} | Out-Null

while ($true) { Start-Sleep -Seconds 1 }
`.trim();

    this.watchProcess = spawn("powershell.exe", [
      "-NonInteractive", "-NoProfile", "-Command", psScript
    ]);

    this.watchProcess.stdout?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const job = JSON.parse(line.trim());
          this.handleNewJob(job);
        } catch {
          // ignore non-JSON lines
        }
      }
    });

    this.watchProcess.on("close", () => {
      if (this.polling) {
        // Restart if it died unexpectedly
        setTimeout(() => this.startWmiWatch(), 5000);
      }
    });

    this.polling = true;
  }

  private startSimulation() {
    // Development simulation — creates a random job every 30s
    this.pollTimer = setInterval(() => {
      const printers = ["HP LaserJet Pro", "Canon PIXMA", "Epson L3150"];
      const types = ["BW", "Color", "Glossy", "Photo"] as const;
      const sizes = ["A4", "A3"] as const;
      const rand = Math.random();
      const type = rand < 0.5 ? "BW" : rand < 0.85 ? "Color" : rand < 0.95 ? "Glossy" : "Photo";
      this.handleNewJob({
        printer: printers[Math.floor(Math.random() * printers.length)],
        pages: 1 + Math.floor(Math.random() * 20),
        size: sizes[Math.floor(Math.random() * sizes.length)],
        type,
      });
    }, 30000);
  }

  private handleNewJob(raw: {
    printer: string;
    pages: number;
    size: string;
    type: string;
  }) {
    const settings = getSettings();
    const paperType = raw.type === "Glossy" ? "Glossy" : raw.type === "Photo" ? "Photo" : "Plain";

    let rate = settings.bw_a4_price;
    if (paperType === "Glossy") rate = settings.glossy_price;
    else if (paperType === "Photo") rate = settings.photo_price;
    else if (raw.type === "Color") {
      rate = raw.size === "A3" ? settings.color_a3_price : settings.color_a4_price;
    } else {
      rate = raw.size === "A3" ? settings.bw_a3_price : settings.bw_a4_price;
    }

    const amount = rate * raw.pages;
    const now = new Date();
    const printDate = now.toISOString().split("T")[0];
    const hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    const printTime = `${h12}:${mins} ${ampm}`;

    const job = insertPrintJob({
      printDate,
      printTime,
      printerName: raw.printer,
      pages: raw.pages,
      printType: raw.type,
      paperSize: raw.size,
      paperType,
      rate,
      amount,
    });

    this.emit("job", job);
  }
}
