import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { LedgerItem, LedgerState } from "../ledger";
import { actionLabel, tokenCount } from "../format";

interface EvidenceLedgerProps {
  state: LedgerState;
  running: boolean;
  verbose: boolean;
  onVerboseChange(value: boolean): void;
  onInitialize(): void;
}

export function EvidenceLedger({ state, running, verbose, onVerboseChange, onInitialize }: EvidenceLedgerProps): React.JSX.Element {
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);

  useLayoutEffect(() => {
    if (!stickToBottom.current || scroller.current === null) return;
    scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [state.items]);

  useEffect(() => {
    const element = scroller.current;
    if (element === null) return;
    const observer = new ResizeObserver(() => {
      if (stickToBottom.current) element.scrollTop = element.scrollHeight;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const onScroll = (): void => {
    const element = scroller.current;
    if (element === null) return;
    const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
    stickToBottom.current = atBottom;
    setShowJump(!atBottom);
  };
  const jumpToBottom = (): void => {
    const element = scroller.current;
    if (element === null) return;
    stickToBottom.current = true;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    setShowJump(false);
  };

  return (
    <section className="ledger-stage" aria-labelledby="ledger-title">
      <header className="ledger-header">
        <div>
          <h1 id="ledger-title">Evidence Ledger</h1>
          <p>{running ? "Run in progress. Events remain ordered as they arrive." : "Ready. Each task becomes one bounded Run."}</p>
        </div>
        <div className="ledger-metrics" aria-label="Session usage">
          <span><strong>{tokenCount(state.inputTokens)}</strong> input</span>
          <span><strong>{tokenCount(state.outputTokens)}</strong> output</span>
          <label className="verbose-toggle">
            <input
              type="checkbox"
              checked={verbose}
              onChange={(event) => onVerboseChange(event.target.checked)}
            />
            Show full results
          </label>
        </div>
      </header>

      <div className="ledger-scroll" ref={scroller} onScroll={onScroll} tabIndex={0}>
        {state.items.length === 0 ? (
          <div className="ledger-empty">
            <div className="empty-wedge" aria-hidden="true" />
            <h2>Set the first cut</h2>
            <p>Give Froe one concrete task. The investigation, Actions, approvals, and verification will appear here in sequence.</p>
            <button className="text-action" type="button" onClick={onInitialize}>Initialize this Workspace with /init</button>
          </div>
        ) : (
          <ol className="ledger-list" role="list">
            {state.items.map((item) => <LedgerRow item={item} key={item.id} verbose={verbose} />)}
          </ol>
        )}
        <div aria-hidden="true" className="ledger-end" />
      </div>
      {showJump && (
        <button className="jump-button" type="button" onClick={jumpToBottom}>Jump to latest</button>
      )}
    </section>
  );
}

function LedgerRow({ item, verbose }: { item: LedgerItem; verbose: boolean }): React.JSX.Element {
  const sequence = item.sequence === undefined ? "—" : String(item.sequence).padStart(3, "0");
  switch (item.type) {
    case "user":
      return (
        <li className="ledger-row ledger-row--user">
          <LedgerMeta sequence={sequence} label="You" />
          <div className="ledger-content">
            <p className="user-task">{item.task}</p>
            {item.images.length > 0 && <p className="entry-note">{item.images.length} image{item.images.length === 1 ? "" : "s"} attached</p>}
          </div>
        </li>
      );
    case "run_started":
      return (
        <li className="ledger-row ledger-row--run">
          <LedgerMeta sequence={sequence} label="Run" />
          <div className="ledger-content ledger-content--inline">
            <strong>Run started</strong>
            <span>{item.model}</span>
          </div>
        </li>
      );
    case "model":
      return (
        <li className="ledger-row ledger-row--model">
          <LedgerMeta sequence={sequence} label="Froe" />
          <div className="ledger-content model-text">{item.text}</div>
        </li>
      );
    case "action":
      return (
        <li className="ledger-row ledger-row--action">
          <LedgerMeta sequence={sequence} label="Action" />
          <div className="ledger-content">
            <div className="entry-title">
              <span className="entry-marker entry-marker--action" aria-hidden="true" />
              <strong>{actionLabel(item.name)}</strong>
            </div>
            {item.details.length > 0 && (
              <ul className="detail-list" role="list">{item.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
            )}
          </div>
        </li>
      );
    case "result":
      return (
        <li className={`ledger-row ledger-row--result ${item.ok ? "" : "ledger-row--failed"}`}>
          <LedgerMeta sequence={sequence} label="Result" />
          <div className="ledger-content">
            <div className="entry-title">
              <span className={`result-symbol result-symbol--${item.ok ? "success" : "failure"}`} aria-hidden="true" />
              <strong>{actionLabel(item.name)}</strong>
              <span>{resultSummary(item)}</span>
            </div>
            {verbose && (
              <details className="result-details">
                <summary>Show structured result</summary>
                <pre>{JSON.stringify(item.output, null, 2)}</pre>
              </details>
            )}
          </div>
        </li>
      );
    case "approval":
      return (
        <li className="ledger-row ledger-row--boundary">
          <LedgerMeta sequence={sequence} label="Boundary" />
          <div className="ledger-content">
            <div className="entry-title">
              <span className="boundary-symbol" aria-hidden="true" />
              <strong>{item.destructive ? "Destructive approval requested" : "Approval requested"}</strong>
              <span>{actionLabel(item.actionName)}</span>
            </div>
            <p>{item.reason}</p>
          </div>
        </li>
      );
    case "compaction":
      return (
        <li className="ledger-row ledger-row--system">
          <LedgerMeta sequence={sequence} label="Context" />
          <div className="ledger-content ledger-content--inline">
            <strong>Context compacted</strong>
            <span>{item.previousItems} to {item.retainedItems} items retained</span>
          </div>
        </li>
      );
    case "outcome":
      return (
        <li className={`ledger-row ledger-row--outcome ledger-row--${item.outcome.status}`}>
          <LedgerMeta sequence={sequence} label="Outcome" />
          <div className="ledger-content">
            <div className="outcome-heading">
              <strong>{item.outcome.status}</strong>
              <span>{item.outcome.turns} turn{item.outcome.turns === 1 ? "" : "s"}</span>
            </div>
            <p>{item.outcome.summary}</p>
            {item.outcome.verification.length > 0 && (
              <ul className="verification-list" role="list">
                {item.outcome.verification.map((check) => (
                  <li key={`${check.result}:${check.description}`}>
                    <span>{check.result.replaceAll("_", " ")}</span>
                    {check.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      );
    case "error":
      return (
        <li className="ledger-row ledger-row--error">
          <LedgerMeta sequence={sequence} label="Error" />
          <div className="ledger-content"><strong>Run could not continue</strong><p>{item.message}</p></div>
        </li>
      );
  }
}

function LedgerMeta({ sequence, label }: { sequence: string; label: string }): React.JSX.Element {
  return <div className="ledger-meta"><span>{sequence}</span><strong>{label}</strong></div>;
}

function resultSummary(item: Extract<LedgerItem, { type: "result" }>): string {
  if (!item.ok && isRecord(item.output) && typeof item.output.message === "string") return item.output.message;
  if (item.name === "run_command" && isRecord(item.output) && typeof item.output.exitCode === "number") {
    return `exit ${item.output.exitCode}`;
  }
  return item.ok ? "completed" : "failed";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
