import { contextBridge, ipcRenderer } from "electron";
import type {
  ApprovalResponse,
  DesktopApi,
  DesktopEvent,
  DesktopRequest,
  OpenSessionRequest,
  RunRequest,
} from "../shared/desktop-api.js";

const request = <T>(message: DesktopRequest): Promise<T> => ipcRenderer.invoke("froe-desktop:request", message) as Promise<T>;

const api: DesktopApi = {
  bootstrap: () => request({ type: "bootstrap" }),
  selectWorkspace: () => request({ type: "select_workspace" }),
  selectAdditionalDirectories: () => request({ type: "select_additional_directories" }),
  selectImages: () => request({ type: "select_images" }),
  openSession: (options: OpenSessionRequest) => request({ type: "open_session", request: options }),
  sessionStatus: () => request({ type: "session_status" }),
  closeSession: () => request({ type: "close_session" }),
  run: (run: RunRequest) => request({ type: "run", request: run }),
  cancelRun: () => request({ type: "cancel_run" }),
  respondToApproval: (response: ApprovalResponse) => request({ type: "approval_response", response }),
  saveOpenAIConnection: (apiKey, baseURL) => request({
    type: "save_openai_connection",
    apiKey,
    ...(baseURL === undefined ? {} : { baseURL }),
  }),
  saveTavilyApiKey: (apiKey) => request({ type: "save_tavily_api_key", apiKey }),
  addMcpServer: (name, server) => request({ type: "add_mcp_server", name, server }),
  onEvent: (listener: (event: DesktopEvent) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, message: DesktopEvent): void => listener(message);
    ipcRenderer.on("froe-desktop:event", handler);
    return () => ipcRenderer.removeListener("froe-desktop:event", handler);
  },
};

contextBridge.exposeInMainWorld("froe", api);

