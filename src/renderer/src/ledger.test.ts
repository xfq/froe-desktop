import { describe, expect, test } from "vitest";
import type { PresentedSessionEvent } from "../../shared/desktop-api";
import { initialLedgerState, ledgerReducer } from "./ledger";

const event = (sequence: number, value: PresentedSessionEvent["event"]): PresentedSessionEvent => ({
  type: "session_event",
  interfaceVersion: 2,
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

  test("adds generated images as ledger rows", () => {
    const state = ledgerReducer(initialLedgerState, {
      type: "session_event",
      event: event(1, {
        type: "image_generated",
        path: "/workspace/generated-images/cover.png",
        mediaType: "image/png",
        bytes: 48_120,
      }),
    });

    expect(state.items).toEqual([
      {
        id: "run:1",
        runId: "run",
        sequence: 1,
        type: "image",
        path: "/workspace/generated-images/cover.png",
        mediaType: "image/png",
        bytes: 48_120,
      },
    ]);
  });

  test("initializes with restored history items on reset", () => {
    const state = ledgerReducer(initialLedgerState, {
      type: "reset",
      initialItems: [
        { id: "history:0", type: "user", task: "Previous question", images: [] },
        { id: "history:1", type: "model", text: "Previous answer" },
      ],
    });

    expect(state.items).toHaveLength(2);
    expect(state.items[0]).toMatchObject({ type: "user", task: "Previous question" });
    expect(state.items[1]).toMatchObject({ type: "model", text: "Previous answer" });
  });
});
