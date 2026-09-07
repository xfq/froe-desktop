import { useId, useState } from "react";
import type { ReasoningEffort } from "@xfq/froe/core";
import type { OpenSessionRequest, PathGrant } from "../../../shared/desktop-api";
import { errorMessage } from "../format";
import { FolderIcon, WedgeMark } from "../icons";

interface ConnectionSetupProps {
  defaultBaseURL?: string;
  onConfigured(): Promise<void>;
  save(apiKey: string, baseURL: string): Promise<unknown>;
}

export function ConnectionSetup({ defaultBaseURL, save, onConfigured }: ConnectionSetupProps): React.JSX.Element {
  const apiKeyId = useId();
  const baseUrlId = useId();
  const [apiKey, setApiKey] = useState("");
  const [baseURL, setBaseURL] = useState(defaultBaseURL ?? "https://api.openai.com/v1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async (): Promise<void> => {
    setSaving(true);
    setError(undefined);
    try {
      await save(apiKey, baseURL);
      await onConfigured();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="setup-shell">
      <section className="setup-intro">
        <div className="setup-brand"><WedgeMark /><strong>froe</strong></div>
        <h1>Make the work inspectable.</h1>
        <p>Froe keeps the agent's Actions, approvals, and verification in one ordered ledger. Your connection stays in Froe's owner-only credential store.</p>
        <div className="setup-boundary">
          <span>What the app keeps</span>
          <ul role="list">
            <li>Provider continuation in memory</li>
            <li>Run metadata in Froe's record</li>
            <li>Credentials outside the Workspace</li>
          </ul>
        </div>
      </section>
      <section className="setup-form-panel" aria-labelledby="connection-title">
        <div>
          <h2 id="connection-title">Connect an OpenAI-compatible endpoint</h2>
          <p>Froe uses the Responses API contract with function calling. The key is never exposed to commands or MCP servers.</p>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <div className="field">
            <label htmlFor={apiKeyId}>API key</label>
            <span id={`${apiKeyId}-hint`}>Saved with owner-only file permissions.</span>
            <input
              id={apiKeyId}
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              aria-describedby={`${apiKeyId}-hint`}
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>
          <div className="field">
            <label htmlFor={baseUrlId}>Base URL</label>
            <span id={`${baseUrlId}-hint`}>Use the default for OpenAI, or enter a compatible endpoint.</span>
            <input
              id={baseUrlId}
              type="url"
              value={baseURL}
              onChange={(event) => setBaseURL(event.target.value)}
              aria-describedby={`${baseUrlId}-hint`}
              spellCheck={false}
              required
            />
          </div>
          {error !== undefined && <p className="form-error" role="alert">{error}</p>}
          <button className="button button--primary setup-submit" disabled={saving || !apiKey.trim()} type="submit">
            {saving ? "Saving connection…" : "Save and continue"}
          </button>
        </form>
      </section>
    </main>
  );
}

interface WorkspaceSetupProps {
  selectWorkspace(): Promise<PathGrant | undefined>;
  selectAdditionalDirectories(): Promise<PathGrant[]>;
  open(request: OpenSessionRequest): Promise<void>;
}

export function WorkspaceSetup({ selectWorkspace, selectAdditionalDirectories, open }: WorkspaceSetupProps): React.JSX.Element {
  const modelId = useId();
  const reasoningId = useId();
  const maxTurnsId = useId();
  const [workspace, setWorkspace] = useState<PathGrant>();
  const [additional, setAdditional] = useState<PathGrant[]>([]);
  const [model, setModel] = useState("gpt-6-astra");
  const [reasoning, setReasoning] = useState<ReasoningEffort>("medium");
  const [maxTurns, setMaxTurns] = useState(40);
  const [noLog, setNoLog] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string>();

  const chooseWorkspace = async (): Promise<void> => {
    const selected = await selectWorkspace();
    if (selected !== undefined) setWorkspace(selected);
  };
  const chooseAdditional = async (): Promise<void> => {
    const selected = await selectAdditionalDirectories();
    setAdditional(selected);
  };
  const submit = async (): Promise<void> => {
    if (workspace === undefined) return;
    setOpening(true);
    setError(undefined);
    try {
      await open({
        workspaceGrantId: workspace.id,
        additionalDirectoryGrantIds: additional.map((grant) => grant.id),
        model,
        reasoning,
        maxTurns,
        noLog,
        autoApproveNonDestructive: autoApprove,
        resumeHistory: false,
      });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setOpening(false);
    }
  };

  return (
    <main className="workspace-setup">
      <div className="workspace-setup__brand"><WedgeMark /><span>froe</span></div>
      <section className="workspace-choice" aria-labelledby="workspace-title">
        <div className="workspace-choice__copy">
          <h1 id="workspace-title">Choose the workpiece.</h1>
          <p>A Session owns one Workspace and its explicit additional directories until you close it. Existing changes remain in place.</p>
        </div>
        <div className="workspace-picker">
          <button className="workspace-pick-button" type="button" onClick={() => void chooseWorkspace()}>
            <FolderIcon />
            <span>
              <strong>{workspace?.name ?? "Select a Workspace"}</strong>
              <small>{workspace?.path ?? "Choose the repository Froe may inspect and change"}</small>
            </span>
          </button>
          <button className="text-action" type="button" onClick={() => void chooseAdditional()}>
            {additional.length === 0 ? "Authorize additional directories" : `${additional.length} additional director${additional.length === 1 ? "y" : "ies"} authorized`}
          </button>
        </div>

        <details className="session-options">
          <summary>Session options</summary>
          <div className="session-options__grid">
            <div className="field">
              <label htmlFor={modelId}>Model</label>
              <input id={modelId} value={model} onChange={(event) => setModel(event.target.value)} spellCheck={false} />
            </div>
            <div className="field">
              <label htmlFor={reasoningId}>Reasoning effort</label>
              <select id={reasoningId} value={reasoning} onChange={(event) => setReasoning(event.target.value as ReasoningEffort)}>
                {(["none", "low", "medium", "high", "xhigh", "max"] as const).map((value) => <option key={value}>{value}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor={maxTurnsId}>Maximum turns</label>
              <input id={maxTurnsId} type="number" min={1} value={maxTurns} onChange={(event) => setMaxTurns(Number(event.target.value))} />
            </div>
          </div>
          <label className="check-field">
            <input type="checkbox" checked={autoApprove} onChange={(event) => setAutoApprove(event.target.checked)} />
            Automatically allow non-destructive policy prompts for this Session
          </label>
          <label className="check-field">
            <input type="checkbox" checked={noLog} onChange={(event) => setNoLog(event.target.checked)} />
            Do not write a local Run record
          </label>
        </details>

        {error !== undefined && <p className="form-error" role="alert">{error}</p>}
        <button className="button button--primary open-workspace" type="button" disabled={workspace === undefined || opening} onClick={() => void submit()}>
          {opening ? "Opening Session…" : "Open Workspace"}
        </button>
      </section>
      <p className="workspace-footnote">Command execution is contained with macOS Seatbelt. Froe fails closed on unsupported operating systems.</p>
    </main>
  );
}
