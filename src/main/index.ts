import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow } from "electron";
import { registerDesktopIpc, type DesktopIpc } from "./ipc.js";

const currentDirectory = fileURLToPath(new URL(".", import.meta.url));
let mainWindow: BrowserWindow | undefined;
let desktopIpc: DesktopIpc | undefined;

function assertSupportedNodeRuntime(): void {
  const major = Number(process.versions.node.split(".")[0]);
  if (!Number.isSafeInteger(major) || major < 22) {
    throw new Error(`Froe requires Node.js 22 or newer; Electron embeds ${process.versions.node}.`);
  }
}

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 880,
    minHeight: 640,
    backgroundColor: "#11100d",
    title: "Froe",
    webPreferences: {
      preload: join(currentDirectory, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  if (rendererUrl !== undefined) {
    const url = new URL(rendererUrl);
    if (process.env.FROE_DESKTOP_DEMO === "1") url.searchParams.set("demo", "1");
    void window.loadURL(url.toString());
  } else {
    void window.loadFile(join(currentDirectory, "../renderer/index.html"));
  }

  let closing = false;
  window.on("close", (event) => {
    if (closing) return;
    event.preventDefault();
    closing = true;
    void desktopIpc?.controller.close().finally(() => window.destroy());
  });
  window.on("closed", () => {
    if (mainWindow === window) mainWindow = undefined;
  });
  return window;
}

assertSupportedNodeRuntime();
app.setName("Froe");

void app.whenReady().then(() => {
  desktopIpc = registerDesktopIpc(() => mainWindow);
  mainWindow = createWindow();
});

app.on("activate", () => {
  if (mainWindow === undefined) mainWindow = createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => desktopIpc?.dispose());
