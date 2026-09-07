import { useEffect, useMemo, useReducer, useState } from "react";
import type { ApprovalDecision, FroeSessionStatus, McpServerConfig } from "@xfq/froe/core";
import type {
  BootstrapState,
  DesktopApi,
  DesktopEvent,
  ImageGrant,
  OpenSessionRequest,
  WorkspaceHistorySummary,
} from "../../shared/desktop-api";
import { ApprovalGate } from "./components/ApprovalGate";
import { Composer, RunStatusStrip } from "./components/Composer";
import { EvidenceLedger } from "./components/EvidenceLedger";
import { ConnectionSetup, WorkspaceSetup } from "./components/Setup";
import { SettingsPanel } from "./components/SettingsPanel";
import { WorkspaceRail } from "./components/WorkspaceRail";
import { createDemoApi } from "./demo-api";
import { errorMessage } from "./format";
import { initialLedgerState, ledgerReducer } from "./ledger";

export function App(): React.JSX.Element {
  const api = useMemo<DesktopApi>(() => {
    const demo = import.meta.env.DEV && new URLSearchParams(window.location.search).has("demo");
    return demo ? createDemoApi() : window.froe;
  }, []);
  const [bootstrap, setBootstrap] = useState<BootstrapState>();
  const [session, setSession] = useState<FroeSessionStatus>();
  const [activeConversation, setActiveConversation] = useState<"new" | "history">("new");
  const [historySummary, setHistorySummary] = useState<WorkspaceHistorySummary>();
  const [ledger, dispatch] = useReducer(ledgerReducer, initialLedgerState);
  const [runPhase, setRunPhase] = useState<"ready" | "running" | "awaiting_approval" | "cancelling">("ready");
  const [approval, setApproval] = useState<Extract<DesktopEvent, { type: "approval_prompt" }>["prompt"]>();
  const [deciding, setDeciding] = useState(false);
  const [images, setImages] = useState<ImageGrant[]>([]);
  const [model, setModel] = useState("gpt-6-astra");
  const [verbose, setVerbose] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [politeMessage, setPoliteMessage] = useState("");
  const [criticalMessage, setCriticalMessage] = useState("");

  const handleEvent = (event: DesktopEvent): void => {
    if (event.type === "session_event") {
      dispatch({ type: "session_event", event });
      if (event.event.type === "run_started") setRunPhase("running");
      if (event.event.type === "run_finished") {
        setRunPhase("ready");
        setApproval(undefined);
        setPoliteMessage(`Run ${event.event.outcome.status}. ${event.event.outcome.summary}`);
      }
      return;
    }
    if (event.type === "approval_prompt") {
      setApproval(event.prompt);
      setRunPhase("awaiting_approval");
      setSettingsOpen(false);
      setCriticalMessage(`Approval required for ${event.prompt.actionName}.`);
      return;
    }
    setRunPhase("ready");
    setApproval(undefined);
  };

  useEffect(() => api.onEvent(handleEvent), [api]);
  useEffect(() => {
    let active = true;
    void api.bootstrap().then(async (value) => {
      if (!active) return;
      setBootstrap(value);
      if (!value.demo) return;
      const workspace = await api.selectWorkspace();
      if (!active || workspace === undefined) return;
      dispatch({
        type: "user_task",
        id: "demo-user-task",
        task: "Fix the parser’s empty-input regression and verify the narrowest relevant test suite.",
        images: [],
      });
      const result = await api.openSession({
        workspaceGrantId: workspace.id,
        additionalDirectoryGrantIds: [],
        model: "gpt-6-astra",
        reasoning: "medium",
        maxTurns: 40,
        noLog: false,
        autoApproveNonDestructive: false,
        resumeHistory: false,
      });
      if (active) {
        setSession(result.status);
        setModel(result.status.config.model);
        setHistorySummary(result.historySummary);
        setActiveConversation("new");
      }
    }).catch((error) => active && setCriticalMessage(errorMessage(error)));
    return () => { active = false; };
  }, [api]);

  const refreshBootstrap = async (): Promise<void> => setBootstrap(await api.bootstrap());
  const openSession = async (request: OpenSessionRequest): Promise<void> => {
    const result = await api.openSession(request);
    setActiveConversation(request.resumeHistory ? "history" : "new");
    setHistorySummary(result.historySummary);
    dispatch({ type: "reset", initialItems: result.restoredItems });
    setSession(result.status);
    setModel(result.status.config.model);
    setSettingsOpen(false);
  };
  const closeSession = async (): Promise<void> => {
    await api.closeSession();
    dispatch({ type: "reset" });
    setSession(undefined);
    setHistorySummary(undefined);
    setActiveConversation("new");
    setRunPhase("ready");
    setApproval(undefined);
    setSettingsOpen(false);
  };
  const startNewConversation = async (): Promise<void> => {
    if (runPhase !== "ready") return;
    try {
      const result = await api.newConversation();
      setActiveConversation("new");
      setHistorySummary(result.historySummary);
      dispatch({ type: "reset", initialItems: [] });
      setSession(result.status);
      setModel(result.status.config.model);
    } catch (error) {
      setCriticalMessage(errorMessage(error));
    }
  };
  const resumePreviousConversation = async (): Promise<void> => {
    if (runPhase !== "ready") return;
    try {
      const result = await api.resumeHistory();
      setActiveConversation("history");
      setHistorySummary(result.historySummary);
      dispatch({ type: "reset", initialItems: result.restoredItems });
      setSession(result.status);
      setModel(result.status.config.model);
    } catch (error) {
      setCriticalMessage(errorMessage(error));
    }
  };
  const run = async (task: string): Promise<void> => {
    const runImages = images;
    setImages([]);
    setRunPhase("running");
    dispatch({ type: "user_task", id: `user:${crypto.randomUUID()}`, task, images: runImages });
    try {
      await api.run({ task, imageGrantIds: runImages.map((image) => image.id), ...(model.trim() ? { model: model.trim() } : {}) });
    } catch (error) {
      const message = errorMessage(error);
      dispatch({ type: "error", id: `error:${crypto.randomUUID()}`, message });
      setCriticalMessage(message);
    } finally {
      setRunPhase("ready");
      const latest = await api.sessionStatus().catch(() => undefined);
      if (latest !== undefined) setSession(latest);
    }
  };
  const chooseImages = async (): Promise<void> => {
    try {
      const selected = await api.selectImages();
      setImages((current) => [...current, ...selected.filter((item) => current.every((existing) => existing.id !== item.id))]);
    } catch (error) {
      setCriticalMessage(errorMessage(error));
    }
  };
  const decide = async (decision: ApprovalDecision): Promise<void> => {
    if (approval === undefined) return;
    setDeciding(true);
    setRunPhase("running");
    try {
      await api.respondToApproval({ approvalId: approval.approvalId, decision });
      setApproval(undefined);
      setPoliteMessage(`Approval decision recorded: ${decision.replaceAll("_", " ")}.`);
    } catch (error) {
      setRunPhase("awaiting_approval");
      setCriticalMessage(errorMessage(error));
    } finally {
      setDeciding(false);
    }
  };
  const cancelRun = async (): Promise<void> => {
    setRunPhase("cancelling");
    try {
      await api.cancelRun();
    } catch (error) {
      setRunPhase(approval === undefined ? "running" : "awaiting_approval");
      setCriticalMessage(errorMessage(error));
    }
  };

  if (bootstrap === undefined) return <LoadingScreen />;
  if (!bootstrap.connection.openAIConfigured) {
    return (
      <ConnectionSetup
        {...(bootstrap.connection.baseURL === undefined ? {} : { defaultBaseURL: bootstrap.connection.baseURL })}
        save={(apiKey, baseURL) => api.saveOpenAIConnection(apiKey, baseURL)}
        onConfigured={refreshBootstrap}
      />
    );
  }
  if (session === undefined) {
    return (
      <WorkspaceSetup
        selectWorkspace={() => api.selectWorkspace()}
        selectAdditionalDirectories={() => api.selectAdditionalDirectories()}
        open={openSession}
      />
    );
  }

  const saveOpenAI = (apiKey: string, baseURL?: string) => api.saveOpenAIConnection(apiKey, baseURL);
  const saveTavily = (apiKey: string) => api.saveTavilyApiKey(apiKey);
  const addMcp = (name: string, server: McpServerConfig) => api.addMcpServer(name, server);
  const running = runPhase !== "ready";
  const changeWorkspace = (): void => {
    if (!window.confirm("Close this Session and change Workspace? The current Evidence Ledger cannot be resumed after it closes.")) return;
    void closeSession();
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-stage">Skip to Evidence Ledger</a>
      <WorkspaceRail
        status={session}
        phase={runPhase}
        activeConversation={activeConversation}
        historySummary={historySummary}
        onNewConversation={() => void startNewConversation()}
        onResumeHistory={() => void resumePreviousConversation()}
        onNewWorkspace={changeWorkspace}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <main className="main-stage" id="main-stage" tabIndex={-1}>
        {settingsOpen ? (
          <SettingsPanel
            bootstrap={bootstrap}
            status={session}
            onClose={() => setSettingsOpen(false)}
            saveOpenAI={saveOpenAI}
            saveTavily={saveTavily}
            addMcp={addMcp}
          />
        ) : (
          <>
            <EvidenceLedger state={ledger} running={running} verbose={verbose} onVerboseChange={setVerbose} onInitialize={() => void run("/init")} />
            {approval !== undefined && <ApprovalGate prompt={approval} deciding={deciding} onDecision={(decision) => void decide(decision)} />}
            {running ? (
              <RunStatusStrip phase={runPhase} onCancel={() => void cancelRun()} />
            ) : (
              <Composer
                model={model}
                images={images}
                onModelChange={setModel}
                onChooseImages={() => void chooseImages()}
                onRemoveImage={(id) => setImages((current) => current.filter((image) => image.id !== id))}
                onSubmit={(task) => void run(task)}
              />
            )}
          </>
        )}
      </main>
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">{politeMessage}</div>
      <div className="visually-hidden" role="alert">{criticalMessage}</div>
    </div>
  );
}

function LoadingScreen(): React.JSX.Element {
  return (
    <main className="loading-screen" aria-label="Opening Froe">
      <div className="loading-mark" aria-hidden="true" />
      <div className="loading-lines"><span /><span /><span /></div>
      <p>Opening Froe…</p>
    </main>
  );
}
