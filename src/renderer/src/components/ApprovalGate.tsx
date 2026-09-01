import { useEffect, useRef } from "react";
import type { ApprovalDecision } from "@xfq/froe/core";
import type { PresentedApprovalPrompt } from "../../../shared/desktop-api";
import { actionLabel } from "../format";

interface ApprovalGateProps {
  prompt: PresentedApprovalPrompt;
  deciding: boolean;
  onDecision(decision: ApprovalDecision): void;
}

const decisionLabels: Record<ApprovalDecision, string> = {
  deny: "Deny",
  approve_once: "Allow once",
  approve_for_run: "Allow this Action for the Run",
};

export function ApprovalGate({ prompt, deciding, onDecision }: ApprovalGateProps): React.JSX.Element {
  const denyButton = useRef<HTMLButtonElement>(null);
  useEffect(() => denyButton.current?.focus(), [prompt.approvalId]);

  const decisions = [...prompt.choices].sort((a) => a === "deny" ? -1 : 1);
  return (
    <section className="approval-gate" role="alert" aria-labelledby="approval-title">
      <div className="approval-copy">
        <div className="approval-heading">
          <span className="approval-mark" aria-hidden="true" />
          <div>
            <h2 id="approval-title">Approval required</h2>
            <p>{actionLabel(prompt.actionName)} · {prompt.scope === "sandbox_exception" ? "narrow sandbox exception" : "policy decision"}</p>
          </div>
        </div>
        <p className="approval-reason">{prompt.reason}</p>
        {prompt.details.length > 0 && (
          <ul className="approval-details" role="list">
            {prompt.details.map((detail) => <li key={detail}>{detail}</li>)}
          </ul>
        )}
      </div>
      <div className="approval-actions">
        {decisions.map((decision) => (
          <button
            className={decision === "deny" ? "button button--ink" : "button button--on-brass"}
            disabled={deciding}
            key={decision}
            onClick={() => onDecision(decision)}
            ref={decision === "deny" ? denyButton : undefined}
            type="button"
          >
            {decisionLabels[decision]}
          </button>
        ))}
      </div>
    </section>
  );
}
