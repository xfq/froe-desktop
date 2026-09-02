# Architecture

froe-desktop is an Electron application and a graphical presentation adapter over the supported `@xfq/froe/core` interface. It does not parse terminal output or import Froe implementation files.

## Process model

The Electron main process owns native dialogs, path grants, Froe configuration operations, the active `FroeSession`, run cancellation, and approval promises. The preload script exposes a narrow typed interface through `contextBridge`. The sandboxed renderer owns only graphical state and sends semantic requests through that interface.

The renderer has no Node integration and receives no generic IPC primitive. Navigation and popup creation are denied. IPC requests are accepted only from the application's own renderer URL.

## Session lifecycle and persistence

A Session is opened with user-selected options including model overrides, limits, approval mode, and `resumeHistory`. Opening a Workspace defaults to a fresh conversation with an empty Evidence Ledger while detecting any previous persisted conversation for that Workspace. The left workspace rail allows switching between starting a new conversation and resuming the previous conversation; when resuming, previously recorded conversation events are formatted into Ledger items to populate the Evidence Ledger and the core continuation state is restored.

## Configuration and credentials

OpenAI and Tavily keys are submitted to main-process handlers and saved through `configureFroe`; the renderer never reads them back. MCP definitions are likewise added through `configureFroe`. Changes that require a new Session are reported rather than silently discarding the active conversation.

## Packaging boundary

The application pins a released `@xfq/froe` package and imports only `@xfq/froe/core`. Local core development should use a packed tarball so the package export map and published file list are exercised. Desktop application updates are owned by the desktop package; Froe's npm-global CLI updater is not reused.
