import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell } from "electron";
import path from "path";
import { createServer, API_PORT } from "./server";
import { PrintMonitor } from "./print-monitor";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let printMonitor: PrintMonitor | null = null;

// Start the embedded Express server
const server = createServer();
server.listen(API_PORT, "127.0.0.1", () => {
  console.log(`PrintFlow API server running on port ${API_PORT}`);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    backgroundColor: "#050505",
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, "../../resources/icon.png"),
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, "../../resources/icon.png")
  ).resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip("PrintFlow Pro");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open PrintFlow Pro",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// IPC handlers
ipcMain.handle("window:minimize", () => mainWindow?.minimize());
ipcMain.handle("window:maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.restore();
  else mainWindow?.maximize();
});
ipcMain.handle("window:close", () => {
  mainWindow?.hide(); // minimize to tray on close
});
ipcMain.handle("window:isMaximized", () => mainWindow?.isMaximized() ?? false);
ipcMain.handle("get-api-port", () => API_PORT);
ipcMain.handle("open-external", (_event, url: string) => shell.openExternal(url));

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Start print monitoring
  printMonitor = new PrintMonitor();
  printMonitor.on("job", (job) => {
    // Notify renderer of a new print job so it can refresh
    mainWindow?.webContents.send("print-job-detected", job);
  });
  printMonitor.start();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // On Windows, keep app running in tray
  if (process.platform !== "darwin" && process.platform !== "win32") {
    app.quit();
  }
});

app.on("before-quit", () => {
  printMonitor?.stop();
});
