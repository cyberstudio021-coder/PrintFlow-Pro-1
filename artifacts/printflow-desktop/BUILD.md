# PrintFlow Pro — Desktop Build Guide

## Prerequisites

- **Node.js 18+** (recommended: Node 20 LTS)
- **Windows 10/11** (required for the .exe build and Windows Print Spooler monitoring)
- **node-gyp build tools** for `better-sqlite3` native compilation:
  ```
  npm install --global --production windows-build-tools
  ```
  Or install "Desktop development with C++" via Visual Studio Installer.

---

## Setup

```bash
# Clone the repo and navigate to this directory
cd artifacts/printflow-desktop

# Install dependencies (rebuilds native modules for Electron automatically)
npm install
```

---

## Development

```bash
# Run in development mode (hot-reload)
npm run dev
```

This opens the Electron window with DevTools available.

---

## Building the Windows Installer

```bash
# Build production .exe installer
npm run build:installer
```

Output: `dist-electron/PrintFlow Pro Setup 1.0.0.exe`

The installer will:
- Create a desktop shortcut
- Add to Start Menu
- Install to `C:\Program Files\PrintFlow Pro` (configurable)
- Run as Administrator (required for print spooler access)

---

## How It Works

### Architecture

```
PrintFlow Pro.exe
    ↓
Electron Main Process
    ├── Embedded Express API Server (port 51247, localhost only)
    ├── SQLite Database (stored in %APPDATA%\PrintFlow Pro\printflow.db)
    ├── Windows Print Spooler Monitor (WMI events)
    └── System Tray Icon

Electron Renderer (React)
    └── Connects to http://127.0.0.1:51247/api
```

### Print Monitoring

On Windows, the app subscribes to `Win32_PrintJob` WMI events via PowerShell. Every time a print job completes on any connected printer, it is automatically captured, priced using your configured rates, and saved to the local database.

### Local Database

All data is stored locally in SQLite at:
```
%APPDATA%\PrintFlow Pro\printflow.db
```

No internet connection required. Google Sheets sync is optional and triggered manually.

### System Tray

- The app minimizes to the system tray when you click X (it keeps running in background)
- Double-click the tray icon to reopen the window
- Right-click the tray icon → Quit to fully exit

---

## Adding Your Icon

Replace these placeholder files in `resources/`:
- `icon.ico` — Multi-size Windows ICO (required for installer)
- `icon.png` — 512×512 PNG (used by Electron at runtime)

---

## Data Backup

Your database is at `%APPDATA%\PrintFlow Pro\printflow.db`. Back it up regularly.
To export data, use the Reports page → Export CSV.
