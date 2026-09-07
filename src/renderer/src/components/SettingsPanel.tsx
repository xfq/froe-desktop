import { useId, useState } from "react";
import type { FroeSessionStatus, McpServerConfig } from "@xfq/froe/core";
import type { BootstrapState } from "../../../shared/desktop-api";
import { errorMessage } from "../format";
import { CloseIcon } from "../icons";

interface SettingsPanelProps {
  bootstrap: BootstrapState;
  status: FroeSessionStatus;
  onClose(): void;
  saveOpenAI(apiKey: string, baseURL?: string): Promise<{ reopenRequired: boolean }>;
  saveTavily(apiKey: string): Promise<{ reopenRequired: boolean }>;
  addMcp(name: string, server: McpServerConfig): Promise<{ reopenRequired: boolean }>;
}

export function SettingsPanel({ bootstrap, status, onClose, saveOpenAI, saveTavily, addMcp }: SettingsPanelProps): React.JSX.Element {
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();

  const perform = async (operation: () => Promise<{ reopenRequired: boolean }>, success: string): Promise<void> => {
    setError(undefined);
    setNotice(undefined);
    try {
      const result = await operation();
      setNotice(`${success}${result.reopenRequired ? " Reopen the Workspace to apply it." : ""}`);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  return (
    <section className="settings-stage" aria-labelledby="settings-title">
      <header className="settings-header">
        <div>
          <h1 id="settings-title">Settings</h1>
          <p>Configuration changes never silently discard the active in-memory Session.</p>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close settings"><CloseIcon /></button>
      </header>
      <div className="settings-scroll">
        <ConnectionSettings
          baseURL={bootstrap.connection.baseURL ?? status.config.baseURL ?? "https://api.openai.com/v1"}
          onSave={(apiKey, baseURL) => perform(() => saveOpenAI(apiKey, baseURL), "OpenAI connection saved.")}
        />
        <TavilySettings
          configured={bootstrap.connection.tavilyConfigured}
          onSave={(key) => perform(() => saveTavily(key), "Tavily key saved.")}
        />
        <McpSettings
          activeCount={status.activeMcpServers.length}
          onAdd={(name, server) => perform(() => addMcp(name, server), `MCP server ${name} added.`)}
        />
        <section className="settings-section" aria-labelledby="effective-title">
          <h2 id="effective-title">Effective Session</h2>
          <dl className="settings-ledger">
            <div><dt>Model</dt><dd>{status.config.model}</dd></div>
            <div><dt>Reasoning</dt><dd>{status.config.reasoning}</dd></div>
            <div><dt>Maximum turns</dt><dd>{status.config.maxTurns}</dd></div>
            <div><dt>Image generation</dt><dd>{status.config.imageGeneration.enabled ? status.config.imageGeneration.model : "disabled"}</dd></div>
            <div><dt>Standing instructions</dt><dd>{status.config.extraInstructions.length === 0 ? "none" : `${status.config.extraInstructions.length} instruction${status.config.extraInstructions.length === 1 ? "" : "s"}`}</dd></div>
            <div><dt>Logging</dt><dd>{status.recordPath === undefined ? "disabled" : status.config.logging}</dd></div>
            <div><dt>Context compaction</dt><dd>{status.config.compactThresholdTokens === null ? "disabled" : `${status.config.compactThresholdTokens.toLocaleString()} tokens`}</dd></div>
          </dl>
        </section>
      </div>
      <div className="settings-announcer" aria-live="polite" aria-atomic="true">{notice}</div>
      {error !== undefined && <p className="settings-error" role="alert">{error}</p>}
    </section>
  );
}

function ConnectionSettings({ baseURL, onSave }: { baseURL: string; onSave(apiKey: string, baseURL: string): Promise<void> }): React.JSX.Element {
  const keyId = useId();
  const urlId = useId();
  const [key, setKey] = useState("");
  const [url, setUrl] = useState(baseURL);
  const [saving, setSaving] = useState(false);
  return (
    <section className="settings-section" aria-labelledby="openai-title">
      <div className="settings-section__heading">
        <div><h2 id="openai-title">OpenAI-compatible connection</h2><p>Saving replaces the stored key. Environment variables still take precedence.</p></div>
        <span className="configured-state">Configured</span>
      </div>
      <form onSubmit={(event) => {
        event.preventDefault();
        setSaving(true);
        void onSave(key, url).finally(() => { setSaving(false); setKey(""); });
      }}>
        <div className="settings-fields">
          <div className="field"><label htmlFor={keyId}>New API key</label><input id={keyId} type="password" value={key} onChange={(event) => setKey(event.target.value)} autoComplete="off" required /></div>
          <div className="field"><label htmlFor={urlId}>Base URL</label><input id={urlId} type="url" value={url} onChange={(event) => setUrl(event.target.value)} required /></div>
        </div>
        <button className="button button--secondary" type="submit" disabled={saving || !key.trim()}>{saving ? "Saving…" : "Replace connection"}</button>
      </form>
    </section>
  );
}

function TavilySettings({ configured, onSave }: { configured: boolean; onSave(apiKey: string): Promise<void> }): React.JSX.Element {
  const id = useId();
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <section className="settings-section" aria-labelledby="tavily-title">
      <div className="settings-section__heading">
        <div><h2 id="tavily-title">Web search</h2><p>A Tavily key enables the bounded `web_search` Action.</p></div>
        <span className={configured ? "configured-state" : "configured-state configured-state--off"}>{configured ? "Configured" : "Not configured"}</span>
      </div>
      <form className="settings-inline-form" onSubmit={(event) => {
        event.preventDefault();
        setSaving(true);
        void onSave(key).finally(() => { setSaving(false); setKey(""); });
      }}>
        <div className="field"><label htmlFor={id}>{configured ? "Replace Tavily key" : "Tavily API key"}</label><input id={id} type="password" value={key} onChange={(event) => setKey(event.target.value)} autoComplete="off" required /></div>
        <button className="button button--secondary" type="submit" disabled={saving || !key.trim()}>{saving ? "Saving…" : "Save key"}</button>
      </form>
    </section>
  );
}

function McpSettings({ activeCount, onAdd }: { activeCount: number; onAdd(name: string, server: McpServerConfig): Promise<void> }): React.JSX.Element {
  const nameId = useId();
  const transportId = useId();
  const commandId = useId();
  const argumentsId = useId();
  const urlId = useId();
  const [name, setName] = useState("");
  const [transport, setTransport] = useState<"local" | "remote">("local");
  const [command, setCommand] = useState("");
  const [argumentsText, setArgumentsText] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (): Promise<void> => {
    const server: McpServerConfig = transport === "remote"
      ? { url }
      : { command, args: argumentsText.split("\n").map((value) => value.trim()).filter(Boolean) };
    setSaving(true);
    try {
      await onAdd(name, server);
      setName("");
      setCommand("");
      setArgumentsText("");
      setUrl("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="settings-section" aria-labelledby="mcp-title">
      <div className="settings-section__heading">
        <div><h2 id="mcp-title">MCP servers</h2><p>Local servers execute outside the Action sandbox. Add only servers you trust.</p></div>
        <span className="configured-state">{activeCount} active</span>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <div className="settings-fields">
          <div className="field"><label htmlFor={nameId}>Server name</label><input id={nameId} value={name} onChange={(event) => setName(event.target.value)} pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,31}" required /></div>
          <div className="field"><label htmlFor={transportId}>Transport</label><select id={transportId} value={transport} onChange={(event) => setTransport(event.target.value as "local" | "remote")}><option value="local">Local stdio</option><option value="remote">Remote HTTP</option></select></div>
        </div>
        {transport === "local" ? (
          <div className="settings-fields">
            <div className="field"><label htmlFor={commandId}>Command</label><input id={commandId} value={command} onChange={(event) => setCommand(event.target.value)} spellCheck={false} required /></div>
            <div className="field"><label htmlFor={argumentsId}>Arguments, one per line</label><textarea id={argumentsId} rows={3} value={argumentsText} onChange={(event) => setArgumentsText(event.target.value)} spellCheck={false} /></div>
          </div>
        ) : (
          <div className="field"><label htmlFor={urlId}>Streamable HTTP URL</label><input id={urlId} type="url" value={url} onChange={(event) => setUrl(event.target.value)} required /></div>
        )}
        <button className="button button--secondary" type="submit" disabled={saving || !name.trim()}>{saving ? "Adding…" : "Add MCP server"}</button>
      </form>
    </section>
  );
}

