# CLAUDE.md

VS Code extension "Ollama Local Chat" (`ollama-chat-vscode`): chat with local Ollama models inside VS Code. Everything runs locally; the extension talks only to the Ollama HTTP API (default `http://localhost:11434`, configurable via the `baseUrl` setting in `src/ollamaClient.ts`).

## Commands

```bash
bun install        # install deps (bun.lock; never npm/yarn)
bun run compile    # tsc -> out/
bun run watch      # tsc --watch during development
```

Test by pressing F5 in VS Code (Extension Development Host), then run the "Open Ollama Chat" command.

## Structure

- `src/extension.ts` - entry point, registers the `ollama.openChat` command
- `src/completionProvider.ts` - inline autocomplete (FIM via `/api/generate` with `suffix`, debounced, cancellable)
- `src/chatPanel.ts` - webview chat panel (UI)
- `src/ollamaClient.ts` - client for the local Ollama API (base URL handling, requests)
- `media/` - icon and webview assets
- `out/` - compiled output, never edit by hand

## Conventions

- TypeScript strict; no `any`, no unsafe casts.
- No new runtime dependencies without good reason: the extension is deliberately dependency-free (only dev deps).
- Keep everything local: no external services, no telemetry, no remote calls besides the user-configured Ollama endpoint.
- `bun run compile` must pass without errors before a change is done.
