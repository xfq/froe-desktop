import type { FroeSessionStatus } from "@xfq/froe/core";
import type { WorkspaceHistorySummary } from "../../../shared/desktop-api";
import { FolderIcon, SettingsIcon, WedgeMark } from "../icons";

interface WorkspaceRailProps {
  status: FroeSessionStatus;
  phase: "ready" | "running" | "awaiting_approval" | "cancelling";
  activeConversation: "new" | "history";
  historySummary?: WorkspaceHistorySummary | undefined;
  onNewConversation(): void;
  onResumeHistory(): void;
  onNewWorkspace(): void;
  onOpenSettings(): void;
}

const phaseLabels: Record<WorkspaceRailProps["phase"], string> = {
  ready: "Ready for a task",
  running: "Run active",
  awaiting_approval: "Awaiting decision",
  cancelling: "Cancelling Run",
};

export function WorkspaceRail({
  status,
  phase,
  activeConversation,
  historySummary,
  onNewConversation,
  onResumeHistory,
  onNewWorkspace,
  onOpenSettings,
}: WorkspaceRailProps): React.JSX.Element {
  const workspaceName = status.workspace.split("/").filter(Boolean).at(-1) ?? status.workspace;
  const busy = phase !== "ready";
  return (
    <aside className="workspace-rail" aria-label="Workspace and Session">
      <div className="brand-lockup">
        <WedgeMark className="brand-mark" />
        <div>
          <strong>froe</strong>
          <span>desktop</span>
        </div>
      </div>

      <div className="rail-workspace">
        <FolderIcon className="rail-icon" />
        <div>
          <span className="rail-label">Workspace</span>
          <strong title={status.workspace}>{workspaceName}</strong>
          <span className="rail-path" title={status.workspace}>{status.workspace}</span>
        </div>
      </div>

      <div className="rail-section rail-section--conversations">
        <span className="rail-label">Conversations</span>
        <div className="conversation-list" role="list">
          <button
            type="button"
            className={`conversation-item ${activeConversation === "new" ? "conversation-item--active" : ""}`}
            onClick={onNewConversation}
            disabled={busy}
          >
            <span className="conversation-marker" aria-hidden="true" />
            <div className="conversation-details">
              <strong>New conversation</strong>
              <small>Fresh context</small>
            </div>
          </button>
          {historySummary?.hasHistory === true && (
            <button
              type="button"
              className={`conversation-item ${activeConversation === "history" ? "conversation-item--active" : ""}`}
              onClick={onResumeHistory}
              disabled={busy}
            >
              <span className="conversation-marker" aria-hidden="true" />
              <div className="conversation-details">
                <strong>Previous conversation</strong>
                <small title={historySummary.preview}>{historySummary.preview}</small>
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="rail-section">
        <span className="rail-label">Session</span>
        <div className="session-state">
          <span className={busy ? "status-diamond status-diamond--active" : "status-diamond"} aria-hidden="true" />
          <span>{phaseLabels[phase]}</span>
        </div>
        <dl className="rail-facts">
          <div>
            <dt>Model</dt>
            <dd>{status.config.model}</dd>
          </div>
          <div>
            <dt>Authority</dt>
            <dd>{1 + status.additionalDirectories.length} director{status.additionalDirectories.length === 0 ? "y" : "ies"}</dd>
          </div>
        </dl>
      </div>

      <div className="rail-section rail-section--mcp">
        <span className="rail-label">MCP connections</span>
        {status.activeMcpServers.length === 0 ? (
          <p className="rail-muted">No active servers</p>
        ) : (
          <ul className="mcp-list" role="list">
            {status.activeMcpServers.map((server) => (
              <li key={server.name}>
                <span>{server.name}</span>
                <span>{server.toolCount} tools</span>
              </li>
            ))}
          </ul>
        )}
        {status.mcpFailures.map((failure) => (
          <div className="rail-warning" key={failure.name}>
            <strong>{failure.name} unavailable</strong>
            <span>{failure.message}</span>
          </div>
        ))}
      </div>

      <div className="rail-footer">
        {status.recordPath !== undefined && (
          <p className="record-path" title={status.recordPath}>
            <span className="rail-label">Run record</span>
            {status.recordPath}
          </p>
        )}
        <button className="rail-button" type="button" onClick={onOpenSettings} disabled={busy}>
          <SettingsIcon />
          Settings
        </button>
        <button className="rail-button" type="button" onClick={onNewWorkspace} disabled={busy}>
          <FolderIcon />
          Change Workspace
        </button>
      </div>
    </aside>
  );
}
