import type { FroeSessionStatus, RunOutcome } from "@xfq/froe/core";
import type {
  ApprovalResponse,
  BootstrapState,
  DesktopApi,
  DesktopEvent,
  OpenSessionRequest,
  PresentedSessionEvent,
  RunRequest,
} from "../../shared/desktop-api";

export function createDemoApi(): DesktopApi {
  const listeners = new Set<(event: DesktopEvent) => void>();
  let status: FroeSessionStatus | undefined;
  let sequence = 0;
  let timerIds: number[] = [];

  const emit = (event: DesktopEvent): void => listeners.forEach((listener) => listener(event));
  const emitRun = (event: PresentedSessionEvent["event"]): void => {
    sequence += 1;
    emit({
      type: "session_event",
      interfaceVersion: 1,
      sessionId: "demo-session",
      runId: "demo-run",
      sequence,
      event,
    });
  };
  const later = (milliseconds: number, callback: () => void): void => {
    timerIds.push(window.setTimeout(callback, milliseconds));
  };

  const bootstrap = async (): Promise<BootstrapState> => ({
    appVersion: "0.1.0",
    coreInterfaceVersion: 1,
    demo: true,
    connection: { openAIConfigured: true, baseURL: "https://api.openai.com/v1", tavilyConfigured: true },
  });

  const demoStatus = (): FroeSessionStatus => ({
    interfaceVersion: 1,
    sessionId: "demo-session",
    workspace: "/Users/xfq/git/froe",
    additionalDirectories: ["/Users/xfq/git/shared"],
    config: {
      provider: "openai",
      autoUpdate: true,
      model: "gpt-5.6-terra",
      reasoning: "medium",
      compactThresholdTokens: 200_000,
      maxTurns: 40,
      logging: "metadata",
      limits: {
        readLines: 400,
        readBytes: 131_072,
        searchResults: 200,
        commandOutputBytes: 131_072,
        commandTimeoutMs: 120_000,
      },
      commandEnv: [],
      mcpServers: { docs: { url: "https://example.com/mcp" } },
    },
    recordPath: "/Users/xfq/.local/state/froe/runs/demo.jsonl",
    activeMcpServers: [{ name: "docs", toolCount: 4 }],
    mcpFailures: [],
    activeRunId: "demo-run",
  });

  const openSession = async (_request: OpenSessionRequest): Promise<FroeSessionStatus> => {
    status = demoStatus();
    sequence = 0;
    timerIds.forEach(window.clearTimeout);
    timerIds = [];
    later(80, () => emitRun({ type: "run_started", workspace: status!.workspace, model: status!.config.model }));
    later(160, () => emitRun({ type: "model_text", text: "I’m tracing the parser boundary and its existing regression coverage before changing behavior." }));
    later(260, () => emitRun({ type: "action_requested", callId: "read", name: "read_file", details: ["path: src/run.ts", "lines: 1–220"] }));
    later(340, () => emitRun({ type: "action_result", callId: "read", name: "read_file", ok: true, output: { path: "src/run.ts", startLine: 1, endLine: 220, truncated: false } }));
    later(440, () => emitRun({ type: "model_text", text: "\nThe completion check is centralized, so the regression can stay narrow." }));
    later(520, () => emitRun({ type: "action_requested", callId: "test", name: "run_command", details: ["command: pnpm test", "cwd: .", "timeout: 120s"] }));
    later(620, () => {
      const prompt = {
        approvalId: "demo-approval",
        actionName: "run_command",
        reason: "macOS blocked a network-outbound operation. Allow a narrow retry to remote 127.0.0.1:8787?",
        destructive: false,
        scope: "sandbox_exception" as const,
        choices: ["approve_once", "deny"] as const,
        details: ["command: pnpm test", "cwd: .", "exception: network-outbound 127.0.0.1:8787"],
      };
      emitRun({ type: "approval_requested", ...prompt, choices: [...prompt.choices] });
      emit({ type: "approval_prompt", prompt: { ...prompt, choices: [...prompt.choices] } });
    });
    return status;
  };

  const finishDemo = (statusValue: RunOutcome["status"], summary: string): RunOutcome => {
    const outcome: RunOutcome = {
      status: statusValue,
      summary,
      turns: 4,
      verification: statusValue === "completed"
        ? [{ result: "passed", description: "pnpm test" }, { result: "passed", description: "pnpm typecheck" }]
        : [{ result: "not_run", description: "Validation stopped before completion" }],
    };
    emitRun({ type: "usage", inputTokens: 18_420, outputTokens: 1_284 });
    emitRun({ type: "run_finished", outcome });
    if (status !== undefined) {
      const { activeRunId: _activeRunId, ...settledStatus } = status;
      status = settledStatus;
    }
    return outcome;
  };

  return {
    bootstrap,
    selectWorkspace: async () => ({ id: "demo-workspace", path: "/Users/xfq/git/froe", name: "froe" }),
    selectAdditionalDirectories: async () => [{ id: "demo-shared", path: "/Users/xfq/git/shared", name: "shared" }],
    selectImages: async () => [{ id: `demo-image-${Date.now()}`, name: "parser-failure.png" }],
    openSession,
    sessionStatus: async () => status,
    closeSession: async () => { timerIds.forEach(window.clearTimeout); status = undefined; emit({ type: "session_closed" }); },
    run: async (_request: RunRequest) => {
      emitRun({ type: "run_started", workspace: status?.workspace ?? "/demo", model: status?.config.model ?? "gpt-5.6-terra" });
      emitRun({ type: "model_text", text: "I’ll inspect the requested scope first." });
      return finishDemo("completed", "The synthetic demo Run completed without changing files.");
    },
    cancelRun: async () => { finishDemo("cancelled", "The Run was cancelled; completed changes remain in the Workspace."); },
    respondToApproval: async (response: ApprovalResponse) => {
      if (response.decision === "deny") {
        emitRun({ type: "action_result", callId: "test", name: "run_command", ok: false, output: { code: "approval_denied", message: "The sandbox retry was denied." } });
        finishDemo("blocked", "Verification was blocked because the sandbox retry was denied.");
      } else {
        emitRun({ type: "action_result", callId: "test", name: "run_command", ok: true, output: { exitCode: 0, output: "42 tests passed", sandboxed: true } });
        finishDemo("completed", "Added the focused regression and verified the parser behavior.");
      }
    },
    saveOpenAIConnection: async () => ({ reopenRequired: true }),
    saveTavilyApiKey: async () => ({ reopenRequired: true }),
    addMcpServer: async () => ({ reopenRequired: true }),
    onEvent: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
