import { describe, expect, test } from "vitest";
import type { PresentedSessionEvent } from "../../shared/desktop-api";
import { initialLedgerState, ledgerReducer } from "./ledger";

const event = (sequence: number, value: PresentedSessionEvent["event"]): PresentedSessionEvent => ({
  type: "session_event",
  interfaceVersion: 1,
  sessionId: "session",
  runId: "run",
  sequence,
  event: value,
});

describe("ledgerReducer", () => {
  test("coalesces streamed model text within one Run", () => {
    const first = ledgerReducer(initialLedgerState, {
      type: "session_event",
      event: event(1, { type: "model_text", text: "Inspecting " }),
    });
    const second = ledgerReducer(first, {
      type: "session_event",
      event: event(2, { type: "model_text", text: "the parser." }),
    });

    expect(second.items).toHaveLength(1);
    expect(second.items[0]).toMatchObject({ type: "model", text: "Inspecting the parser.", sequence: 2 });
  });

  test("tracks usage without adding noisy ledger rows", () => {
    const state = ledgerReducer(initialLedgerState, {
      type: "session_event",
      event: event(1, { type: "usage", inputTokens: 120, outputTokens: 30 }),
    });

    expect(state.items).toEqual([]);
    expect(state.inputTokens).toBe(120);
    expect(state.outputTokens).toBe(30);
  });
});

