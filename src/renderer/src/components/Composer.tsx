import { useId, useState, type KeyboardEvent } from "react";
import type { ImageGrant } from "../../../shared/desktop-api";
import { CloseIcon, ImageIcon, SendIcon, StopIcon } from "../icons";

interface ComposerProps {
  model: string;
  images: ImageGrant[];
  onModelChange(model: string): void;
  onChooseImages(): void;
  onRemoveImage(id: string): void;
  onSubmit(task: string): void;
}

export function Composer({
  model,
  images,
  onModelChange,
  onChooseImages,
  onRemoveImage,
  onSubmit,
}: ComposerProps): React.JSX.Element {
  const [task, setTask] = useState("");
  const taskId = useId();
  const modelId = useId();

  const submit = (): void => {
    if (!task.trim()) return;
    onSubmit(task.trim());
    setTask("");
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form className="composer" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      {images.length > 0 && (
        <ul className="attachment-list" role="list" aria-label="Images attached to the next Run">
          {images.map((image) => (
            <li key={image.id}>
              <ImageIcon />
              <span>{image.name}</span>
              <button type="button" onClick={() => onRemoveImage(image.id)} aria-label={`Remove ${image.name}`}>
                <CloseIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="visually-hidden" htmlFor={taskId}>Task for Froe</label>
      <textarea
        id={taskId}
        value={task}
        onChange={(event) => setTask(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Describe one bounded coding task"
        rows={3}
      />
      <div className="composer-toolbar">
        <div className="composer-tools">
          <button className="icon-text-button" type="button" onClick={onChooseImages}>
            <ImageIcon />
            Attach images
          </button>
          <div className="model-control">
            <label htmlFor={modelId}>Model</label>
            <input
              id={modelId}
              value={model}
              onChange={(event) => onModelChange(event.target.value)}
              spellCheck={false}
            />
          </div>
        </div>
        <button className="button button--primary" type="submit" disabled={!task.trim()}>
          <SendIcon />
          Start Run
        </button>
      </div>
      <p className="composer-hint">Press Enter to submit. Shift Enter adds a new line. One Run at a time.</p>
    </form>
  );
}

export function RunStatusStrip({
  phase,
  onCancel,
}: {
  phase: "running" | "awaiting_approval" | "cancelling";
  onCancel(): void;
}): React.JSX.Element {
  const status = phase === "awaiting_approval"
    ? "Froe needs your decision before it can continue."
    : phase === "cancelling"
      ? "Stopping the Run. Completed changes remain in the Workspace."
      : "Froe is working. Evidence will stay ordered above.";
  return (
    <section className="run-status-strip" aria-live="polite">
      <div>
        <span className="status-diamond status-diamond--active" aria-hidden="true" />
        <span>{status}</span>
      </div>
      <button className="button button--cancel" type="button" onClick={onCancel} disabled={phase === "cancelling"}>
        <StopIcon />
        {phase === "cancelling" ? "Cancelling" : "Cancel Run"}
      </button>
    </section>
  );
}
