# Product

## Platform

Desktop application built with Electron.

## Users and purpose

Froe serves engineers who want to delegate a bounded coding task while continuously seeing what the agent is doing, what authority it is using, what needs approval, and how the result was verified.

## Initial release

- Configure an OpenAI-compatible connection and optional Tavily key.
- Select one Workspace and optional additional authorized directories.
- Run sequential tasks through one in-memory Froe Session.
- Attach PNG, JPEG, WEBP, or GIF images to a Run.
- Change the model between Runs without discarding continuation.
- Display ordered model, Action, approval, usage, compaction, verification, and outcome evidence.
- Approve only choices permitted by core, cancel active Runs, and close Sessions safely.
- Show active and failed MCP servers and add local or remote MCP definitions for the next Session.

## Constraints

- No Windows or Linux command-execution parity until Froe core provides an operating-system sandbox there.
- No commits, rollbacks, or broader filesystem authority beyond Froe core behavior.
- No fabricated safety claims; the interface shows the mechanism and its actual limits.
