# froe-desktop

froe-desktop is the graphical presentation adapter for `@xfq/froe/core`.

## Working principles

- Keep all agent behavior, safety policy, approvals, command execution, MCP lifecycle, and provider state in `@xfq/froe/core`.
- Keep the renderer unprivileged. Filesystem, credentials, native dialogs, and Froe sessions belong to the Electron main process.
- Expose a small typed preload interface; never expose Electron modules or a generic IPC escape hatch.
- Preserve Froe's domain language from `CONTEXT.md`.
- Keep `ARCHITECTURE.md` synchronized with changes to process responsibilities, IPC, session lifecycle, configuration authority, persistence, or security.
- Do not commit, publish, sign, or deploy unless explicitly requested.

## Engineering discipline

- Prefer platform and existing dependencies over new packages.
- Test behavior after every implementation change.
- Fix failures at their source; do not disable checks or add suppression comments.
- Never place secrets in source, logs, screenshots, or commits.
- Treat accessibility, cancellation, approval handling, and error recovery as product behavior.

## Browser support

The renderer runs only in the Chromium version bundled with the pinned Electron release. Baseline newly available features may be used when feature-detected and when a dependency-free fallback is small; core task flows must not depend on experimental browser features.

