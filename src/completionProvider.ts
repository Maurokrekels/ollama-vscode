import * as http from "http";
import * as https from "https";
import { URL } from "url";
import * as vscode from "vscode";

const MAX_PREFIX_LINES = 100;
const MAX_SUFFIX_LINES = 30;
const MIN_PREFIX_CHARS = 3;
const MAX_TOKENS = 128;

interface GenerateResponse {
    response?: string;
}

function isGenerateResponse(value: unknown): value is GenerateResponse {
    return typeof value === "object" && value !== null;
}

function normalizeBaseUrl(baseUrl: string): URL {
    const trimmed = baseUrl.trim();
    const withProtocol = /^https?:\/\//.test(trimmed)
        ? trimmed
        : `http://${trimmed}`;
    return new URL(withProtocol);
}

function requestCompletion(
    baseUrl: string,
    model: string,
    prompt: string,
    suffix: string,
    token: vscode.CancellationToken,
): Promise<string> {
    return new Promise((resolve, reject) => {
        const url = normalizeBaseUrl(baseUrl);
        const transport = url.protocol === "https:" ? https : http;
        const body = JSON.stringify({
            model,
            prompt,
            suffix,
            stream: false,
            options: { num_predict: MAX_TOKENS, temperature: 0 },
        });

        const req = transport.request(
            {
                hostname: url.hostname,
                port: url.port || (url.protocol === "https:" ? 443 : 80),
                path: "/api/generate",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(body),
                },
            },
            (res) => {
                let data = "";
                res.on("data", (chunk: Buffer) => {
                    data += chunk.toString("utf8");
                });
                res.on("end", () => {
                    if (
                        !res.statusCode ||
                        res.statusCode < 200 ||
                        res.statusCode >= 300
                    ) {
                        reject(new Error(`HTTP ${res.statusCode}`));
                        return;
                    }
                    try {
                        const parsed: unknown = JSON.parse(data);
                        resolve(
                            isGenerateResponse(parsed)
                                ? (parsed.response ?? "")
                                : "",
                        );
                    } catch (error) {
                        reject(error);
                    }
                });
            },
        );

        req.on("error", reject);
        token.onCancellationRequested(() => {
            req.destroy();
            resolve("");
        });
        req.write(body);
        req.end();
    });
}

function delay(ms: number, token: vscode.CancellationToken): Promise<void> {
    return new Promise((resolve) => {
        const timer = setTimeout(resolve, ms);
        token.onCancellationRequested(() => {
            clearTimeout(timer);
            resolve();
        });
    });
}

export type AutocompleteStatus =
    | "idle"
    | "loading"
    | "suggested"
    | "empty"
    | "error";

export class OllamaCompletionProvider
    implements vscode.InlineCompletionItemProvider
{
    constructor(private readonly onStatus: (status: AutocompleteStatus) => void) {}

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken,
    ): Promise<vscode.InlineCompletionItem[]> {
        const config = vscode.workspace.getConfiguration("ollama");
        if (!config.get<boolean>("autocomplete.enabled", true)) {
            return [];
        }

        await delay(config.get<number>("autocomplete.debounceMs", 300), token);
        if (token.isCancellationRequested) {
            return [];
        }

        const prefixStart = new vscode.Position(
            Math.max(0, position.line - MAX_PREFIX_LINES),
            0,
        );
        const suffixEnd = new vscode.Position(
            Math.min(document.lineCount - 1, position.line + MAX_SUFFIX_LINES),
            Number.MAX_SAFE_INTEGER,
        );
        const prefix = document.getText(new vscode.Range(prefixStart, position));
        const suffix = document.getText(
            new vscode.Range(
                position,
                document.validatePosition(suffixEnd),
            ),
        );

        if (prefix.trim().length < MIN_PREFIX_CHARS) {
            this.onStatus("idle");
            return [];
        }

        this.onStatus("loading");
        try {
            const completion = await requestCompletion(
                config.get<string>("baseUrl", "http://localhost:11434"),
                config.get<string>(
                    "autocomplete.model",
                    "qwen2.5-coder:3b",
                ),
                prefix,
                suffix,
                token,
            );
            if (token.isCancellationRequested) {
                this.onStatus("idle");
                return [];
            }
            if (completion.trim() === "") {
                this.onStatus("empty");
                return [];
            }
            this.onStatus("suggested");
            const item = new vscode.InlineCompletionItem(
                completion,
                new vscode.Range(position, position),
            );
            item.command = {
                command: "ollama.recordUsage",
                title: "Record Ollama usage",
            };
            return [item];
        } catch {
            this.onStatus("error");
            return [];
        }
    }
}
