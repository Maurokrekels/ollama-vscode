import * as vscode from "vscode";
import { ChatPanel } from "./chatPanel";
import {
    AutocompleteStatus,
    OllamaCompletionProvider,
} from "./completionProvider";

export function activate(context: vscode.ExtensionContext) {
    const openChat = vscode.commands.registerCommand(
        "ollama.openChat",
        () => {
        ChatPanel.createOrShow(context.extensionUri, context);
    });

    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right
    );

    statusBarItem.command = "ollama.openChat";
    statusBarItem.text = "$(comment-discussion) Ollama Chat";
    statusBarItem.tooltip = "Click to open Ollama Local Chat";
    
    statusBarItem.show();

    const autocompleteItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        99
    );
    autocompleteItem.command = "ollama.toggleAutocomplete";

    const isAutocompleteEnabled = () =>
        vscode.workspace
            .getConfiguration("ollama")
            .get<boolean>("autocomplete.enabled", true);

    const showStatus = (status: AutocompleteStatus | "off") => {
        const labels: Record<AutocompleteStatus | "off", string> = {
            idle: "$(sparkle) Ollama AC",
            off: "$(circle-slash) Ollama AC off",
            loading: "$(loading~spin) Ollama AC",
            suggested: "$(check) Ollama AC",
            empty: "$(sparkle) Ollama AC (no suggestion)",
            error: "$(error) Ollama AC unreachable",
        };
        autocompleteItem.text = labels[status];
        autocompleteItem.tooltip =
            status === "error"
                ? "Ollama autocomplete failed: is Ollama running and the model pulled? Click to toggle."
                : "Ollama autocomplete. Click to toggle.";
    };

    showStatus(isAutocompleteEnabled() ? "idle" : "off");
    autocompleteItem.show();

    const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("ollama.autocomplete.enabled")) {
            showStatus(isAutocompleteEnabled() ? "idle" : "off");
        }
    });

    const completionProvider = vscode.languages.registerInlineCompletionItemProvider(
        { pattern: "**" },
        new OllamaCompletionProvider(showStatus)
    );

    const toggleAutocomplete = vscode.commands.registerCommand(
        "ollama.toggleAutocomplete",
        async () => {
            const config = vscode.workspace.getConfiguration("ollama");
            const enabled = config.get<boolean>("autocomplete.enabled", true);
            await config.update(
                "autocomplete.enabled",
                !enabled,
                vscode.ConfigurationTarget.Global
            );
            vscode.window.showInformationMessage(
                `Ollama autocomplete ${enabled ? "off" : "on"}`
            );
        }
    );

    context.subscriptions.push(
        openChat,
        statusBarItem,
        autocompleteItem,
        configListener,
        completionProvider,
        toggleAutocomplete
    );
}

export function deactivate() {}