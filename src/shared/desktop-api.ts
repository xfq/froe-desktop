import type {
  ApprovalDecision,
  ApprovalScope,
  FroeSessionStatus,
  JsonValue,
  McpServerConfig,
  ReasoningEffort,
  RunOutcome,
  Verification,
} from "@xfq/froe/core";

export interface ConnectionStatus {
  openAIConfigured: boolean;
  baseURL?: string;
  tavilyConfigured: boolean;
}

export interface BootstrapState {
  appVersion: string;
  coreInterfaceVersion: number;
  demo: boolean;
  connection: ConnectionStatus;
}

export interface PathGrant {
  id: string;
  path: string;
  name: string;
}

export interface ImageGrant {
  id: string;
  name: string;
}

export interface OpenSessionRequest {
  workspaceGrantId: string;
  additionalDirectoryGrantIds: string[];
  model?: string;
  reasoning?: ReasoningEffort;
  maxTurns?: number;
  noLog: boolean;
  autoApproveNonDestructive: boolean;
}

export interface RunRequest {
  task: string;
  imageGrantIds: string[];
  model?: string;
}

export interface ApprovalResponse {
  approvalId: string;
  decision: ApprovalDecision;
}

export interface PresentedApprovalPrompt {
  approvalId: string;
  actionName: string;
  reason: string;
  destructive: boolean;
  scope: ApprovalScope;
  choices: ApprovalDecision[];
  details: string[];
}

export type PresentedRunEvent =
  | { type: "run_started"; workspace: string; model: string }
  | { type: "model_text"; text: string }
  | { type: "action_requested"; callId: string; name: string; details: string[] }
  | { type: "action_result"; callId: string; name: string; ok: boolean; output: JsonValue }
  | {
      type: "approval_requested";
      approvalId: string;
      actionName: string;
      reason: string;
      destructive: boolean;
      scope: ApprovalScope;
      choices: ApprovalDecision[];
      details: string[];
    }
  | { type: "context_compacted"; previousItems: number; retainedItems: number; thresholdTokens: number | null }
  | { type: "usage"; inputTokens: number; outputTokens: number }
  | { type: "run_finished"; outcome: RunOutcome };

export interface PresentedSessionEvent {
  type: "session_event";
  interfaceVersion: number;
  sessionId: string;
  runId: string;
  sequence: number;
  event: PresentedRunEvent;
}

export type DesktopEvent =
  | PresentedSessionEvent
  | { type: "approval_prompt"; prompt: PresentedApprovalPrompt }
  | { type: "session_closed" };

export type DesktopRequest =
  | { type: "bootstrap" }
  | { type: "select_workspace" }
  | { type: "select_additional_directories" }
  | { type: "select_images" }
  | { type: "open_session"; request: OpenSessionRequest }
  | { type: "session_status" }
  | { type: "close_session" }
  | { type: "run"; request: RunRequest }
  | { type: "cancel_run" }
  | { type: "approval_response"; response: ApprovalResponse }
  | { type: "save_openai_connection"; apiKey: string; baseURL?: string }
  | { type: "save_tavily_api_key"; apiKey: string }
  | { type: "add_mcp_server"; name: string; server: McpServerConfig };

export interface DesktopApi {
  bootstrap(): Promise<BootstrapState>;
  selectWorkspace(): Promise<PathGrant | undefined>;
  selectAdditionalDirectories(): Promise<PathGrant[]>;
  selectImages(): Promise<ImageGrant[]>;
  openSession(request: OpenSessionRequest): Promise<FroeSessionStatus>;
  sessionStatus(): Promise<FroeSessionStatus | undefined>;
  closeSession(): Promise<void>;
  run(request: RunRequest): Promise<RunOutcome>;
  cancelRun(): Promise<void>;
  respondToApproval(response: ApprovalResponse): Promise<void>;
  saveOpenAIConnection(apiKey: string, baseURL?: string): Promise<{ reopenRequired: boolean }>;
  saveTavilyApiKey(apiKey: string): Promise<{ reopenRequired: boolean }>;
  addMcpServer(name: string, server: McpServerConfig): Promise<{ reopenRequired: boolean }>;
  onEvent(listener: (event: DesktopEvent) => void): () => void;
}

export interface LedgerOutcome {
  status: RunOutcome["status"];
  summary: string;
  verification: Verification[];
  turns: number;
}

