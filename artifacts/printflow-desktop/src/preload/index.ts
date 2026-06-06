import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  getApiPort: () => ipcRenderer.invoke("get-api-port"),
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  onPrintJobDetected: (callback: (job: unknown) => void) => {
    ipcRenderer.on("print-job-detected", (_event, job) => callback(job));
  },
  removePrintJobListener: () => {
    ipcRenderer.removeAllListeners("print-job-detected");
  },
});
