# froe-desktop

The graphical desktop adapter for [froe](https://github.com/xfq/froe). It uses the supported `@xfq/froe/core` interface, so the CLI and desktop app share the same Session, Run, Action, approval, sandbox, MCP, provider, and recording behavior.

## Requirements

- macOS only for now
- Node.js 22 or newer
- pnpm 11 or newer

## Development

```sh
pnpm install
pnpm dev
```

The app uses the saved Froe credentials and configuration under the standard XDG paths. It can also configure the OpenAI-compatible connection and Tavily key from its first-run flow.

## Validation

```sh
pnpm typecheck
pnpm test
pnpm build
```

To preview the Evidence Ledger with synthetic local data and no API request:

```sh
FROE_DESKTOP_DEMO=1 pnpm dev
```

## Packaging

```sh
pnpm package:mac
```

The initial package is unsigned. Signing, notarization, publishing, and update distribution are intentionally outside this repository's first version.

