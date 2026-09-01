import { app, dialog, ipcMain, type BrowserWindow, type IpcMainInvokeEvent } from "electron";
import {
  FROE_CORE_INTERFACE_VERSION,
  configureFroe,
  type FroeConfigurationResult,
  type McpServerConfig,
  type ReasoningEffort,
} from "@xfq/froe/core";
import type {
  BootstrapState,
  DesktopEvent,
  DesktopRequest,
  OpenSessionRequest,
  RunRequest,
} from "../shared/desktop-api.js";
import { PathGrantRegistry } from "./path-grants.js";
import { DesktopSessionController } from "./session-controller.js";

export const DESKTOP_REQUEST_CHANNEL = "froe-desktop:request";
export const DESKTOP_EVENT_CHANNEL = "froe-desktop:event";

export interface DesktopIpc {
  controller: DesktopSessionController;
  dispose(): void;
}

export function registerDesktopIpc(getWindow: () => BrowserWindow | undefined): DesktopIpc {
  const grants = new PathGrantRegistry();
  const emit = (event: DesktopEvent): void => {
    const window = getWindow();
    if (window !== undefined && !window.isDestroyed()) window.webContents.send(DESKTOP_EVENT_CHANNEL, event);
  };
  const controller = new DesktopSessionController(emit);

  ipcMain.handle(DESKTOP_REQUEST_CHANNEL, async (event, value: unknown): Promise<unknown> => {
    const window = getWindow();
    assertTrustedSender(event, window);
    const request = desktopRequest(value);

    switch (request.type) {
      case "bootstrap":
        return bootstrapState();
      case "select_workspace": {
        if (window === undefined) return undefined;
        const selection = await dialog.showOpenDialog(window, {
          title: "Choose a Froe Workspace",
          buttonLabel: "Open Workspace",
          properties: ["openDirectory", "createDirectory"],
        });
        return selection.canceled ? undefined : grants.grantDirectories(selection.filePaths)[0];
      }
      case "select_additional_directories": {
        if (window === undefined) return [];
        const selection = await dialog.showOpenDialog(window, {
          title: "Authorize additional directories",
          buttonLabel: "Authorize directories",
          properties: ["openDirectory", "multiSelections"],
        });
        return selection.canceled ? [] : grants.grantDirectories(selection.filePaths);
      }
      case "select_images": {
        if (window === undefined) return [];
        const selection = await dialog.showOpenDialog(window, {
          title: "Attach images to the next Run",
          buttonLabel: "Attach",
          properties: ["openFile", "multiSelections"],
          filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif"] }],
        });
        return selection.canceled ? [] : grants.grantImages(selection.filePaths);
      }
      case "open_session":
        return controller.open(resolveOpenRequest(request.request, grants));
      case "session_status":
        return controller.status();
      case "close_session":
        await controller.close();
        return undefined;
      case "run":
        return controller.run(resolveRunRequest(request.request, grants));
      case "cancel_run":
        controller.cancel();
        return undefined;
      case "approval_response":
        controller.respondToApproval(request.response.approvalId, request.response.decision);
        return undefined;
      case "save_openai_connection":
        return configuredResult(await configureFroe({
          type: "save_openai_connection",
          apiKey: requiredText(request.apiKey, "API key"),
          ...(request.baseURL === undefined ? {} : { baseURL: requiredText(request.baseURL, "Base URL") }),
        }));
      case "save_tavily_api_key":
        return configuredResult(await configureFroe({
          type: "save_tavily_api_key",
          apiKey: requiredText(request.apiKey, "Tavily API key"),
        }));
      case "add_mcp_server":
        return configuredResult(await configureFroe({
          type: "add_mcp_server",
          name: requiredText(request.name, "MCP server name"),
          server: mcpServer(request.server),
        }));
    }
  });

  return {
    controller,
    dispose: () => ipcMain.removeHandler(DESKTOP_REQUEST_CHANNEL),
  };
}

async function bootstrapState(): Promise<BootstrapState> {
  if (process.env.FROE_DESKTOP_DEMO === "1") {
    return {
      appVersion: app.getVersion(),
      coreInterfaceVersion: FROE_CORE_INTERFACE_VERSION,
      demo: true,
      connection: {
        openAIConfigured: true,
        baseURL: "https://api.openai.com/v1",
        tavilyConfigured: true,
      },
    };
  }
  const connection = await configureFroe({ type: "inspect_connection" });
  if (connection.type !== "connection") throw new Error("Froe returned an unexpected connection status.");
  return {
    appVersion: app.getVersion(),
    coreInterfaceVersion: FROE_CORE_INTERFACE_VERSION,
    demo: false,
    connection: {
      openAIConfigured: connection.openAIConfigured,
      ...(connection.baseURL === undefined ? {} : { baseURL: connection.baseURL }),
      tavilyConfigured: connection.tavilyConfigured,
    },
  };
}

function resolveOpenRequest(request: OpenSessionRequest, grants: PathGrantRegistry): Parameters<DesktopSessionController["open"]>[0] {
  return {
    workspace: grants.resolveDirectories([request.workspaceGrantId])[0]!,
    additionalDirectories: grants.resolveDirectories(request.additionalDirectoryGrantIds),
    noLog: request.noLog,
    autoApproveNonDestructive: request.autoApproveNonDestructive,
    ...(request.model === undefined ? {} : { model: requiredText(request.model, "Model") }),
    ...(request.reasoning === undefined ? {} : { reasoning: reasoningEffort(request.reasoning) }),
    ...(request.maxTurns === undefined ? {} : { maxTurns: positiveInteger(request.maxTurns, "Maximum turns") }),
  };
}

function resolveRunRequest(request: RunRequest, grants: PathGrantRegistry): Parameters<DesktopSessionController["run"]>[0] {
  return {
    task: requiredText(request.task, "Task"),
    imagePaths: grants.resolveImages(request.imageGrantIds),
    ...(request.model === undefined ? {} : { model: requiredText(request.model, "Model") }),
  };
}

function desktopRequest(value: unknown): DesktopRequest {
  if (!isRecord(value) || typeof value.type !== "string") throw new Error("Invalid desktop request.");
  return value as DesktopRequest;
}

function assertTrustedSender(event: IpcMainInvokeEvent, window: BrowserWindow | undefined): void {
  if (window === undefined || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) {
    throw new Error("Rejected an IPC request from an untrusted renderer.");
  }
}

function configuredResult(result: FroeConfigurationResult): { reopenRequired: boolean } {
  if (result.type !== "configured") throw new Error("Froe returned an unexpected configuration result.");
  return { reopenRequired: result.reopenRequired };
}

function reasoningEffort(value: ReasoningEffort): ReasoningEffort {
  const allowed = new Set<ReasoningEffort>(["none", "low", "medium", "high", "xhigh", "max"]);
  if (!allowed.has(value)) throw new Error("Unsupported reasoning effort.");
  return value;
}

function mcpServer(value: McpServerConfig): McpServerConfig {
  if (!isRecord(value)) throw new Error("Invalid MCP server configuration.");
  if (typeof value.url === "string") return { url: requiredText(value.url, "MCP URL") };
  if (typeof value.command !== "string" || !Array.isArray(value.args) || value.args.some((item) => typeof item !== "string")) {
    throw new Error("Invalid local MCP server configuration.");
  }
  return { command: requiredText(value.command, "MCP command"), args: [...value.args] };
}

function requiredText(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must not be empty.`);
  return value.trim();
}

function positiveInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

