import { describe, expect, test } from "vitest";
import { historyItemsToLedgerItems, inspectWorkspaceHistory } from "./session-history.js";

describe("historyItemsToLedgerItems", () => {
  test("converts user and assistant text messages", () => {
    const items = [
      { role: "user", content: "Fix the build" },
      { role: "assistant", content: [{ type: "output_text", text: "I will inspect package.json." }] },
    ];

    const ledgerItems = historyItemsToLedgerItems(items);

    expect(ledgerItems).toEqual([
      { id: "history:0", type: "user", task: "Fix the build", images: [] },
      { id: "history:1", type: "model", text: "I will inspect package.json." },
    ]);
  });

  test("converts array-based user content and string assistant content", () => {
    const items = [
      { role: "user", content: [{ type: "input_text", text: "Multi-line\nquestion" }] },
      { role: "assistant", content: "Direct reply" },
    ];

    const ledgerItems = historyItemsToLedgerItems(items);

    expect(ledgerItems).toEqual([
      { id: "history:0", type: "user", task: "Multi-line\nquestion", images: [] },
      { id: "history:1", type: "model", text: "Direct reply" },
    ]);
  });

  test("converts tool actions and results", () => {
    const items = [
      {
        type: "function_call",
        call_id: "call_read",
        name: "read_file",
        arguments: JSON.stringify({ path: "src/main.ts" }),
      },
      {
        type: "function_call_output",
        call_id: "call_read",
        output: JSON.stringify({ ok: true, output: { path: "src/main.ts", startLine: 1, endLine: 50 } }),
      },
    ];

    const ledgerItems = historyItemsToLedgerItems(items);

    expect(ledgerItems).toHaveLength(2);
    expect(ledgerItems[0]).toMatchObject({
      id: "history:0",
      type: "action",
      callId: "call_read",
      name: "read_file",
      details: ['path: "src/main.ts"'],
    });
    expect(ledgerItems[1]).toMatchObject({
      id: "history:1",
      type: "result",
      callId: "call_read",
      name: "read_file",
      ok: true,
      output: { path: "src/main.ts", startLine: 1, endLine: 50 },
    });
  });

  test("converts finish tool output to outcome item", () => {
    const items = [
      {
        type: "function_call",
        call_id: "call_finish",
        name: "finish",
        arguments: JSON.stringify({
          outcome: "completed",
          summary: "Fixed the build issue",
          verification: [{ description: "pnpm test", result: "passed" }],
        }),
      },
      {
        type: "function_call_output",
        call_id: "call_finish",
        output: JSON.stringify({
          ok: true,
          output: {
            outcome: "completed",
            summary: "Fixed the build issue",
            verification: [{ description: "pnpm test", result: "passed" }],
          },
        }),
      },
    ];

    const ledgerItems = historyItemsToLedgerItems(items);

    expect(ledgerItems).toEqual([
      {
        id: "history:1",
        type: "outcome",
        outcome: {
          status: "completed",
          summary: "Fixed the build issue",
          verification: [{ description: "pnpm test", result: "passed" }],
          turns: 1,
        },
      },
    ]);
  });

  test("converts compaction items and skips unrecognised items", () => {
    const items = [
      { type: "compaction", previous_items: 10, retained_items: 4 },
      { unexpected: true },
    ];

    const ledgerItems = historyItemsToLedgerItems(items);

    expect(ledgerItems).toEqual([
      { id: "history:0", type: "compaction", previousItems: 10, retainedItems: 4 },
    ]);
  });

  test("inspectWorkspaceHistory returns summary for missing or empty workspace", async () => {
    const summary = await inspectWorkspaceHistory("/non-existent-workspace-path");
    expect(summary).toEqual({ hasHistory: false, itemCount: 0 });
  });
});
