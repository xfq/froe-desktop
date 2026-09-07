# Domain context

- **Workspace**: the primary user-authorized directory owned by one Session.
- **Session**: one in-memory Froe context for a fixed Workspace and additional-directory set. It owns provider continuation, action authority, MCP connections, approval state, and one run record until closed.
- **Run**: one bounded task submitted through a Session. Only one Run may be active.
- **Ledger**: the ordered graphical presentation of user tasks, model text, Actions, approvals, generated images, usage, compaction, verification, and outcomes. It is presentation state, not provider continuation state.
- **Action**: a structured operation requested by the model and executed by Froe core.
- **Approval**: a decision requested by Froe core. The desktop app may offer only the choices supplied by core.
- **Path grant**: an opaque main-process token created by a native file dialog. Renderer requests use the token instead of arbitrary filesystem paths.
- **Desktop session controller**: the main-process module that adapts one `FroeSession` to the typed desktop interface and owns cancellation plus pending approval promises.
