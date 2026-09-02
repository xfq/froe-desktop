import type { ImageGrant, LedgerItem, PresentedSessionEvent } from "../../shared/desktop-api";

export type { LedgerBase, LedgerItem } from "../../shared/desktop-api";

export interface LedgerState {
  items: LedgerItem[];
  inputTokens: number;
  outputTokens: number;
}

export type LedgerAction =
  | { type: "user_task"; id: string; task: string; images: ImageGrant[] }
  | { type: "session_event"; event: PresentedSessionEvent }
  | { type: "error"; id: string; message: string }
  | { type: "reset"; initialItems?: LedgerItem[] };

export const initialLedgerState: LedgerState = {
  items: [],
  inputTokens: 0,
  outputTokens: 0,
};

export function ledgerReducer(state: LedgerState, action: LedgerAction): LedgerState {
  if (action.type === "reset") {
    return {
      ...initialLedgerState,
      items: action.initialItems ? [...action.initialItems] : [],
    };
  }
  if (action.type === "user_task") {
    return {
      ...state,
      items: [...state.items, { id: action.id, type: "user", task: action.task, images: [...action.images] }],
    };
  }
  if (action.type === "error") {
    return { ...state, items: [...state.items, { id: action.id, type: "error", message: action.message }] };
  }

  const envelope = action.event;
  const event = envelope.event;
  if (event.type === "usage") {
    return {
      ...state,
      inputTokens: state.inputTokens + event.inputTokens,
      outputTokens: state.outputTokens + event.outputTokens,
    };
  }

  if (event.type === "model_text") {
    const last = state.items.at(-1);
    if (last?.type === "model" && last.runId === envelope.runId) {
      return {
        ...state,
        items: [
          ...state.items.slice(0, -1),
          { ...last, text: `${last.text}${event.text}`, sequence: envelope.sequence },
        ],
      };
    }
  }

  const item = ledgerItem(envelope);
  return item === undefined ? state : { ...state, items: [...state.items, item] };
}

function ledgerItem(envelope: PresentedSessionEvent): LedgerItem | undefined {
  const base = {
    id: `${envelope.runId}:${envelope.sequence}`,
    runId: envelope.runId,
    sequence: envelope.sequence,
  };
  const event = envelope.event;
  switch (event.type) {
    case "run_started":
      return { ...base, type: "run_started", workspace: event.workspace, model: event.model };
    case "model_text":
      return { ...base, type: "model", text: event.text };
    case "action_requested":
      return { ...base, type: "action", callId: event.callId, name: event.name, details: event.details };
    case "action_result":
      return { ...base, type: "result", callId: event.callId, name: event.name, ok: event.ok, output: event.output };
    case "approval_requested":
      return {
        ...base,
        type: "approval",
        approvalId: event.approvalId,
        actionName: event.actionName,
        reason: event.reason,
        details: event.details,
        destructive: event.destructive,
      };
    case "context_compacted":
      return { ...base, type: "compaction", previousItems: event.previousItems, retainedItems: event.retainedItems };
    case "run_finished":
      return { ...base, type: "outcome", outcome: event.outcome };
    case "usage":
      return undefined;
  }
}
