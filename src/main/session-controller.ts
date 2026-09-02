import {
  openFroeSession,
  redactSensitiveText,
  summarizeAction,
  type ApprovalDecision,
  type FroeApprovalPrompt,
  type FroeRunRequest,
  type FroeSession,
  type FroeSessionEvent,
  type FroeSessionStatus,
  type OpenFroeSessionOptions,
  type ReasoningEffort,
  type RunOutcome,
} from "@xfq/froe/core";
import type { DesktopEvent, LedgerItem, OpenSessionResult, PresentedRunEvent, WorkspaceHistorySummary } from "../shared/desktop-api.js";
import { loadWorkspaceHistory } from "./session-history.js";

interface OpenDesktopSessionOptions {
  workspace: string;
  additionalDirectories: string[];
  model?: string;
  reasoning?: ReasoningEffort;
  maxTurns?: number;
  noLog: boolean;
  autoApproveNonDestructive: boolean;
  resumeHistory?: boolean;
}

interface RunDesktopTaskRequest {
  task: string;
  imagePaths: string[];
  model?: string;
}

interface PendingApproval {
  choices: ApprovalDecision[];
  resolve: (decision: ApprovalDecision) => void;
  removeAbortListener: () => void;
}

export type DesktopEventSink = (event: DesktopEvent) => void;

export interface FroeSessionFactory {
  open(options: OpenFroeSessionOptions): Promise<FroeSession>;
}

export interface SessionHistoryLoader {
  load(workspace: string): Promise<LedgerItem[]>;
}

const defaultSessionFactory: FroeSessionFactory = {
  open: openFroeSession,
};

const defaultHistoryLoader: SessionHistoryLoader = {
  load: loadWorkspaceHistory,
};

export class DesktopSessionController {
  readonly #emit: DesktopEventSink;
  readonly #factory: FroeSessionFactory;
  readonly #historyLoader: SessionHistoryLoader;
  readonly #pendingApprovals = new Map<string, PendingApproval>();
  #session: FroeSession | undefined;
  #runController: AbortController | undefined;
  #lastOpenOptions: OpenDesktopSessionOptions | undefined;

  constructor(
    emit: DesktopEventSink,
    factory: FroeSessionFactory = defaultSessionFactory,
    historyLoader: SessionHistoryLoader = defaultHistoryLoader,
  ) {
    this.#emit = emit;
    this.#factory = factory;
    this.#historyLoader = historyLoader;
  }

  status(): FroeSessionStatus | undefined {
    return this.#session?.status();
  }

  async open(options: OpenDesktopSessionOptions): Promise<OpenSessionResult> {
    await this.close();
    this.#lastOpenOptions = options;
    const session = await this.#factory.open({
      workspace: options.workspace,
      additionalDirectories: options.additionalDirectories,
      noLog: options.noLog,
      ...(options.resumeHistory === undefined ? {} : { resumeHistory: options.resumeHistory }),
      approvalMode: options.autoApproveNonDestructive ? "auto_non_destructive" : "prompt",
      overrides: {
        ...(options.model === undefined ? {} : { model: options.model }),
        ...(options.reasoning === undefined ? {} : { reasoning: options.reasoning }),
        ...(options.maxTurns === undefined ? {} : { maxTurns: options.maxTurns }),
      },
      adapter: {
        onEvent: (event) => this.#emit(presentSessionEvent(event)),
        requestApproval: (prompt, signal) => this.#requestApproval(prompt, signal),
      },
    });
    this.#session = session;
    const allItems = await this.#historyLoader.load(options.workspace);
    const firstUser = allItems.find((item) => item.type === "user") as Extract<LedgerItem, { type: "user" }> | undefined;
    const historySummary: WorkspaceHistorySummary = allItems.length === 0
      ? { hasHistory: false, itemCount: 0 }
      : { hasHistory: true, preview: firstUser?.task ?? "Previous conversation", itemCount: allItems.length };
    const restoredItems = options.resumeHistory === true ? allItems : [];
    return {
      status: session.status(),
      historySummary,
      restoredItems,
    };
  }

  async resumeHistory(): Promise<OpenSessionResult> {
    if (this.#lastOpenOptions === undefined) throw new Error("No active Workspace Session.");
    return this.open({ ...this.#lastOpenOptions, resumeHistory: true });
  }

  async newConversation(): Promise<OpenSessionResult> {
    if (this.#lastOpenOptions === undefined) throw new Error("No active Workspace Session.");
    return this.open({ ...this.#lastOpenOptions, resumeHistory: false });
  }

  async run(request: RunDesktopTaskRequest): Promise<RunOutcome> {
    if (this.#session === undefined) throw new Error("Open a Froe Workspace before starting a Run.");
    if (this.#runController !== undefined) throw new Error("A Run is already active.");
    const controller = new AbortController();
    this.#runController = controller;
    const coreRequest: FroeRunRequest = {
      task: request.task,
      signal: controller.signal,
      ...(request.imagePaths.length === 0 ? {} : { imagePaths: request.imagePaths }),
      ...(request.model === undefined ? {} : { model: request.model }),
    };
    try {
      return await this.#session.run(coreRequest);
    } finally {
      if (this.#runController === controller) this.#runController = undefined;
    }
  }

  cancel(): void {
    this.#runController?.abort();
  }

  respondToApproval(approvalId: string, decision: ApprovalDecision): void {
    const pending = this.#pendingApprovals.get(approvalId);
    if (pending === undefined) throw new Error("This approval is no longer pending.");
    if (!pending.choices.includes(decision)) throw new Error("Froe did not offer that approval decision.");
    this.#pendingApprovals.delete(approvalId);
    pending.removeAbortListener();
    pending.resolve(decision);
  }

  async close(): Promise<void> {
    this.cancel();
    for (const [id, pending] of this.#pendingApprovals) {
      this.#pendingApprovals.delete(id);
      pending.removeAbortListener();
      pending.resolve("deny");
    }
    const session = this.#session;
    this.#session = undefined;
    if (session !== undefined) {
      await session.close();
      this.#emit({ type: "session_closed" });
    }
  }

  #requestApproval(prompt: FroeApprovalPrompt, signal?: AbortSignal): Promise<ApprovalDecision> {
    const presented = {
      approvalId: prompt.id,
      actionName: prompt.action.name,
      reason: redactSensitiveText(prompt.reason),
      destructive: prompt.destructive,
      scope: prompt.scope,
      choices: [...prompt.choices],
      details: summarizeAction(prompt.action),
    };
    this.#emit({ type: "approval_prompt", prompt: presented });

    return new Promise<ApprovalDecision>((resolve) => {
      const abort = (): void => {
        const pending = this.#pendingApprovals.get(prompt.id);
        if (pending === undefined) return;
        this.#pendingApprovals.delete(prompt.id);
        pending.removeAbortListener();
        resolve("deny");
      };
      signal?.addEventListener("abort", abort, { once: true });
      this.#pendingApprovals.set(prompt.id, {
        choices: [...prompt.choices],
        resolve,
        removeAbortListener: () => signal?.removeEventListener("abort", abort),
      });
      if (signal?.aborted) abort();
    });
  }
}

export function presentSessionEvent(envelope: FroeSessionEvent): DesktopEvent {
  return {
    type: "session_event",
    interfaceVersion: envelope.interfaceVersion,
    sessionId: envelope.sessionId,
    runId: envelope.runId,
    sequence: envelope.sequence,
    event: presentRunEvent(envelope),
  };
}

function presentRunEvent(envelope: FroeSessionEvent): PresentedRunEvent {
  const event = envelope.event;
  switch (event.type) {
    case "action_requested":
      return {
        type: event.type,
        callId: event.action.callId,
        name: event.action.name,
        details: summarizeAction(event.action),
      };
    case "approval_requested":
      return {
        type: event.type,
        approvalId: event.approvalId,
        actionName: event.action.name,
        reason: redactSensitiveText(event.reason),
        destructive: event.destructive,
        scope: event.scope,
        choices: [...event.choices],
        details: summarizeAction(event.action),
      };
    case "action_result":
      return {
        type: event.type,
        callId: event.result.callId,
        name: event.result.name,
        ok: event.result.ok,
        output: event.result.output,
      };
    case "run_started":
    case "model_text":
    case "context_compacted":
    case "usage":
    case "run_finished":
      return structuredClone(event);
  }
}
