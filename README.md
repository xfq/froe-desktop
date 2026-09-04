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

## Packaging and Installation

To build the macOS installation packages (DMG installer and ZIP archive in `release/`):

```sh
pnpm package:mac
```

Users can open the generated `.dmg` and drag `Froe.app` to `/Applications`, or extract and launch from the `.zip`.

Froe is not yet signed with an Apple Developer ID. On first launch, macOS may prevent the app from opening. After confirming that the app came from the official Froe release, remove its quarantine attribute and launch it again:

```sh
xattr -dr com.apple.quarantine /Applications/Froe.app
```

To build an unpacked app directory without creating disk images or archives:

```sh
pnpm package:mac:dir
```

The initial package is unsigned. Signing, notarization, publishing, and update distribution are intentionally outside this repository's first version.
