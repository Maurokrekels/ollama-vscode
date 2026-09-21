<p align="center">
  <img src="media/icon.png" width="128" height="128" alt="Ollama Local Chat icon" />
</p>

# Ollama Local Chat

VS Code extension to chat with a local Ollama instance inside the editor—similar to Copilot-style chat but using your own models.

## Requirements

- [Ollama](https://ollama.ai/) installed and running locally
- VS Code 1.74.0 or newer

## Installation

1. Install dependencies: `bun install`
2. Build: `bun run compile`
3. Press **F5** in VS Code to run the extension in a new window (Extension Development Host)

To install from source in your main VS Code:

1. Run `bun run compile`
2. In VS Code: **Run** → **Install Additional Development Extensions...** → choose **Install from VSIX...** and pick the built VSIX, or run the extension from this folder via **Run and Debug** (F5).

## Usage

1. Start Ollama (e.g. `ollama serve` or ensure the Ollama app is running).
2. Open the Command Palette: **Cmd+Shift+P** (macOS) or **Ctrl+Shift+P** (Windows/Linux).
3. Run **Open Ollama Chat**.
4. Use the chat panel to send messages; responses stream in real time.

## Configuration

In VS Code **Settings** (or `settings.json`):

| Setting          | Description                | Default                  |
| ---------------- | -------------------------- | ------------------------ |
| `ollama.baseUrl` | Ollama API base URL        | `http://localhost:11434` |
| `ollama.model`   | Default model for the chat | `llama3.2:latest`        |
| `ollama.autocomplete.enabled` | Show inline code completions | `true` |
| `ollama.autocomplete.model` | Model for autocomplete (must support fill-in-the-middle) | `qwen2.5-coder:3b` |
| `ollama.autocomplete.debounceMs` | Wait after typing before requesting a completion | `300` |

## Autocomplete

Inline completions (grey ghost text, accept with **Tab**) come from a local model through Ollama's fill-in-the-middle support.

1. Pull a code model: `ollama pull qwen2.5-coder:3b`
2. Start typing. The status bar item **Ollama AC** shows when a request runs and whether a suggestion arrived. Click it to toggle autocomplete.

Use a small model for autocomplete, since it runs on every pause while typing. If another extension (for example Copilot) also shows inline suggestions, disable it while testing so you can tell them apart.

## Chat steering

You can keep typing while the model answers. A message sent mid-response stops the current stream, keeps what was already written, and restarts with your new message. Messages sent within one second are merged into a single follow-up.

## Features

- Inline autocomplete with a status bar indicator
- Send messages while the model is answering to steer the response

- Chat panel inside VS Code
- Connects to your local Ollama API
- Streaming responses
- Theme-aware UI
- Configurable model and base URL

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for how to set up the project, propose changes, and submit pull requests. By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

- Found a bug? [Open an issue](../../issues/new?template=bug_report.md).
- Have an idea? [Request a feature](../../issues/new?template=feature_request.md).

## License

MIT
