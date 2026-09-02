import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { summarizeAction, type JsonValue, type Verification } from "@xfq/froe/core";
import type { LedgerItem, WorkspaceHistorySummary } from "../shared/desktop-api.js";

export async function loadWorkspaceHistory(workspace: string): Promise<LedgerItem[]> {
  const root = process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state");
  const directory = join(root, "froe", "conversations");
  const hash = createHash("sha256").update(workspace).digest("hex");
  const filePath = join(directory, `${hash}.json`);

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1 || parsed.workspace !== workspace) {
      return [];
    }
    if (!Array.isArray(parsed.items)) {
      return [];
    }
    return historyItemsToLedgerItems(parsed.items);
  } catch {
    return [];
  }
}

export async function inspectWorkspaceHistory(workspace: string): Promise<WorkspaceHistorySummary> {
  const items = await loadWorkspaceHistory(workspace);
  if (items.length === 0) {
    return { hasHistory: false, itemCount: 0 };
  }
  const firstUser = items.find((item) => item.type === "user") as Extract<LedgerItem, { type: "user" }> | undefined;
  return {
    hasHistory: true,
    preview: firstUser?.task ?? "Previous conversation",
    itemCount: items.length,
  };
}

export function historyItemsToLedgerItems(items: readonly unknown[]): LedgerItem[] {
  const result: LedgerItem[] = [];
  const functionCalls = new Map<string, { name: string; arguments: Record<string, unknown> }>();

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!isRecord(item)) continue;

    const id = `history:${index}`;

    if (item.role === "user") {
      const task = extractUserTask(item.content);
      if (task.trim()) {
        result.push({
          id,
          type: "user",
          task,
          images: [],
        });
      }
      continue;
    }

    if (item.role === "assistant") {
      const text = extractAssistantText(item.content);
      if (text.trim()) {
        result.push({
          id,
          type: "model",
          text,
        });
      }
      continue;
    }

    if (item.type === "function_call" && typeof item.call_id === "string" && typeof item.name === "string") {
      const rawArgs = typeof item.arguments === "string" ? parseJson(item.arguments) : item.arguments;
      const parsedArgs = isRecord(rawArgs) ? rawArgs : {};
      functionCalls.set(item.call_id, { name: item.name, arguments: parsedArgs });

      if (item.name !== "finish") {
        result.push({
          id,
          type: "action",
          callId: item.call_id,
          name: item.name,
          details: summarizeAction({ name: item.name, arguments: parsedArgs }),
        });
      }
      continue;
    }

    if (item.type === "function_call_output" && typeof item.call_id === "string") {
      const call = functionCalls.get(item.call_id);
      const name = call?.name ?? "";
      const rawOutput = typeof item.output === "string" ? parseJson(item.output) : item.output;
      const ok = isRecord(rawOutput) && typeof rawOutput.ok === "boolean" ? rawOutput.ok : true;
      const output = isRecord(rawOutput) && "output" in rawOutput ? (rawOutput.output as JsonValue) : (rawOutput as JsonValue);

      if (name === "finish" && isRecord(output) && typeof output.outcome === "string" && typeof output.summary === "string") {
        const verification = Array.isArray(output.verification)
          ? (output.verification as unknown[]).filter(isVerification)
          : [];
        result.push({
          id,
          type: "outcome",
          outcome: {
            status: output.outcome === "completed" ? "completed" : "blocked",
            summary: output.summary,
            verification,
            turns: 1,
          },
        });
      } else if (name !== "finish") {
        result.push({
          id,
          type: "result",
          callId: item.call_id,
          name,
          ok,
          output,
        });
      }
      continue;
    }

    if (item.type === "compaction") {
      const previousItems = typeof item.previous_items === "number" ? item.previous_items : 0;
      const retainedItems = typeof item.retained_items === "number" ? item.retained_items : 0;
      if (previousItems > 0 && retainedItems > 0) {
        result.push({
          id,
          type: "compaction",
          previousItems,
          retainedItems,
        });
      }
      continue;
    }
  }

  return result;
}

function extractUserTask(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part): part is { type: string; text: string } => isRecord(part) && part.type === "input_text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("\n");
  }
  return "";
}

function extractAssistantText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!isRecord(part)) return "";
        if (part.type === "output_text" && typeof part.text === "string") return part.text;
        if (part.type === "refusal" && typeof part.refusal === "string") return `Model refusal: ${part.refusal}`;
        return "";
      })
      .join("");
  }
  return "";
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isVerification(value: unknown): value is Verification {
  return (
    isRecord(value)
    && typeof value.description === "string"
    && (value.result === "passed" || value.result === "not_run" || value.result === "failed")
  );
}
