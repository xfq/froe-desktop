import { describe, expect, test, vi } from "vitest";
import { FROE_CORE_INTERFACE_VERSION } from "@xfq/froe/core";
import type {
  FroeApprovalPrompt,
  FroeRunRequest,
  FroeSession,
  FroeSessionEvent,
  FroeSessionStatus,
  OpenFroeSessionOptions,
  RunOutcome,
} from "@xfq/froe/core";
import { DesktopSessionController, presentSessionEvent, type FroeSessionFactory } from "./session-controller.js";

const completed: RunOutcome = {
  status: "completed",
  summary: "Done",
  turns: 1,
  verification: [],
};

const baseStatus: FroeSessionStatus = {
  interfaceVersion: FROE_CORE_INTERFACE_VERSION,
  sessionId: "session",
  workspace: "/workspace",
  additionalDirectories: [],
  config: {
    provider: "openai",
    autoUpdate: true,
    model: "gpt-6-astra",
    reasoning: "medium",
    imageGeneration: {
      enabled: true,
      model: "gpt-image-2",
      size: "auto",
      quality: "auto",
      background: "auto",
      outputFormat: "png",
    },
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
    extraInstructions: [],
    mcpServers: {},
  },
  activeMcpServers: [],
  mcpFailures: [],
};

const desktopOpenOptions = {
  workspace: "/workspace",
  additionalDirectories: [],
  noLog: false,
  autoApproveNonDestructive: false,
  resumeHistory: true,
};

const approvalPrompt: FroeApprovalPrompt = {
  id: "approval",
  action: { callId: "call", name: "run_command", arguments: { executable: "pnpm", args: ["test"] } },
  reason: "Needs a narrow sandbox exception.",
  destructive: false,
  scope: "sandbox_exception",
  choices: ["deny", "approve_once"],
};

function fakeSession(overrides: Partial<FroeSession> = {}): FroeSession {
  return {
    status: () => baseStatus,
    run: async () => completed,
    close: async () => undefined,
    ...overrides,
  };
}

function capturingFactory(session: FroeSession): { factory: FroeSessionFactory; options: () => OpenFroeSessionOptions } {
  let captured: OpenFroeSessionOptions | undefined;
  return {
    factory: { open: async (options) => { captured = options; return session; } },
    options: () => {
      if (captured === undefined) throw new Error("Session has not been opened.");
      return captured;
    },
  };
}

describe("presentSessionEvent", () => {
  test("summarizes action arguments without crossing the raw patch body", () => {
    const envelope: FroeSessionEvent = {
      interfaceVersion: FROE_CORE_INTERFACE_VERSION,
      sessionId: "session",
      runId: "run",
      sequence: 3,
      event: {
        type: "action_requested",
        action: {
          callId: "call",
          name: "apply_patch",
          arguments: {
            changes: [{ path: "src/index.ts", oldText: "private source", newText: "replacement" }],
          },
        },
      },
    };

    const presented = presentSessionEvent(envelope);

    expect(presented.type).toBe("session_event");
    expect(JSON.stringify(presented)).not.toContain("private source");
    expect(JSON.stringify(presented)).toContain("src/index.ts");
  });

  test("redacts credential-shaped text from approval reasons", () => {
    const envelope: FroeSessionEvent = {
      interfaceVersion: FROE_CORE_INTERFACE_VERSION,
      sessionId: "session",
      runId: "run",
      sequence: 4,
      event: {
        type: "approval_requested",
        approvalId: "approval",
        action: { callId: "call", name: "run_command", arguments: { executable: "tool", args: [] } },
        reason: "Command includes api_key=sk-1234567890abcdefghijklmnop",
        destructive: false,
        scope: "policy",
        choices: ["approve_once", "deny", "approve_for_run"],
      },
    };

    expect(JSON.stringify(presentSessionEvent(envelope))).not.toContain("sk-1234567890");
    expect(JSON.stringify(presentSessionEvent(envelope))).toContain("api_key=<redacted>");
  });

  test("presents generated images with path, media type, and size", () => {
    const envelope: FroeSessionEvent = {
      interfaceVersion: FROE_CORE_INTERFACE_VERSION,
      sessionId: "session",
      runId: "run",
      sequence: 5,
      event: {
        type: "image_generated",
        path: "/workspace/generated-images/cover.png",
        mediaType: "image/png",
        bytes: 48_120,
      },
    };

    expect(presentSessionEvent(envelope)).toMatchObject({
      type: "session_event",
      event: {
        type: "image_generated",
        path: "/workspace/generated-images/cover.png",
        mediaType: "image/png",
        bytes: 48_120,
      },
    });
  });
});

describe("DesktopSessionController", () => {
  test("cancels an active Run through its AbortSignal", async () => {
    let runSignal: AbortSignal | undefined;
    const session = fakeSession({
      run: (request: FroeRunRequest) => new Promise<RunOutcome>((resolve) => {
        runSignal = request.signal;
        request.signal?.addEventListener("abort", () => resolve({ ...completed, status: "cancelled" }), { once: true });
      }),
    });
    const { factory } = capturingFactory(session);
    const controller = new DesktopSessionController(() => undefined, factory);
    await controller.open(desktopOpenOptions);

    const run = controller.run({ task: "test", imagePaths: [] });
    controller.cancel();

    await expect(run).resolves.toMatchObject({ status: "cancelled" });
    expect(runSignal?.aborted).toBe(true);
  });

  test("rejects a concurrent Run", async () => {
    let finishRun: ((outcome: RunOutcome) => void) | undefined;
    const session = fakeSession({
      run: () => new Promise<RunOutcome>((resolve) => { finishRun = resolve; }),
    });
    const { factory } = capturingFactory(session);
    const controller = new DesktopSessionController(() => undefined, factory);
    await controller.open(desktopOpenOptions);

    const firstRun = controller.run({ task: "first", imagePaths: [] });
    await expect(controller.run({ task: "second", imagePaths: [] })).rejects.toThrow("already active");
    finishRun?.(completed);
    await firstRun;
  });

  test("denies pending approvals before closing the Session", async () => {
    const close = vi.fn(async () => undefined);
    const events: unknown[] = [];
    const { factory, options } = capturingFactory(fakeSession({ close }));
    const controller = new DesktopSessionController((event) => events.push(event), factory);
    await controller.open(desktopOpenOptions);
    const approval = options().adapter?.requestApproval?.(approvalPrompt);

    await controller.close();

    await expect(approval).resolves.toBe("deny");
    expect(close).toHaveBeenCalledOnce();
    expect(events).toContainEqual({ type: "session_closed" });
  });

  test("rejects unknown or unavailable approval decisions", async () => {
    const { factory, options } = capturingFactory(fakeSession());
    const controller = new DesktopSessionController(() => undefined, factory);
    await controller.open(desktopOpenOptions);
    const approval = options().adapter?.requestApproval?.(approvalPrompt);

    expect(() => controller.respondToApproval("missing", "deny")).toThrow("no longer pending");
    expect(() => controller.respondToApproval("approval", "approve_for_run")).toThrow("did not offer");
    controller.respondToApproval("approval", "approve_once");

    await expect(approval).resolves.toBe("approve_once");
  });

  test("closes the prior Session before opening a replacement", async () => {
    const lifecycle: string[] = [];
    const first = fakeSession({ close: async () => { lifecycle.push("close:first"); } });
    const second = fakeSession({ close: async () => { lifecycle.push("close:second"); } });
    let openCount = 0;
    const factory: FroeSessionFactory = {
      open: async () => {
        openCount += 1;
        lifecycle.push(`open:${openCount}`);
        return openCount === 1 ? first : second;
      },
    };
    const controller = new DesktopSessionController(() => undefined, factory);

    await controller.open(desktopOpenOptions);
    await controller.open({ ...desktopOpenOptions, workspace: "/replacement" });

    expect(lifecycle).toEqual(["open:1", "close:first", "open:2"]);
  });

  test("forwards resumeHistory option to the session factory", async () => {
    const { factory, options } = capturingFactory(fakeSession());
    const controller = new DesktopSessionController(() => undefined, factory);

    await controller.open({ ...desktopOpenOptions, resumeHistory: true });
    expect(options().resumeHistory).toBe(true);

    await controller.open({ ...desktopOpenOptions, resumeHistory: false });
    expect(options().resumeHistory).toBe(false);
  });

  test("returns restored ledger items when resumeHistory is true and empty when false", async () => {
    const { factory } = capturingFactory(fakeSession());
    const historyLoader = {
      load: vi.fn(async (_workspace: string) => [
        { id: "history:0", type: "user" as const, task: "Previous task", images: [] },
        { id: "history:1", type: "model" as const, text: "Previous answer" },
      ]),
    };
    const controller = new DesktopSessionController(() => undefined, factory, historyLoader);

    const resumed = await controller.open({ ...desktopOpenOptions, resumeHistory: true });
    expect(resumed.restoredItems).toHaveLength(2);
    expect(resumed.restoredItems[0]).toMatchObject({ type: "user", task: "Previous task" });
    expect(historyLoader.load).toHaveBeenCalledWith("/workspace");

    const fresh = await controller.open({ ...desktopOpenOptions, resumeHistory: false });
    expect(fresh.restoredItems).toEqual([]);
  });

  test("switches between new conversation and resumed history", async () => {
    const { factory, options } = capturingFactory(fakeSession());
    const historyLoader = {
      load: vi.fn(async (_workspace: string) => [
        { id: "history:0", type: "user" as const, task: "Historical task", images: [] },
      ]),
    };
    const controller = new DesktopSessionController(() => undefined, factory, historyLoader);

    await controller.open({ ...desktopOpenOptions, resumeHistory: false });
    expect(options().resumeHistory).toBe(false);

    const resumed = await controller.resumeHistory();
    expect(resumed.restoredItems).toHaveLength(1);
    expect(options().resumeHistory).toBe(true);

    const fresh = await controller.newConversation();
    expect(fresh.restoredItems).toEqual([]);
    expect(options().resumeHistory).toBe(false);
  });
});
