import * as vscode from "vscode";

const STATE_KEY = "ollama.reviewPrompt";
const USAGE_THRESHOLD = 25;
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

export const REVIEW_URL =
    "https://marketplace.visualstudio.com/items?itemName=MauroKrekels.ollama-chat-vscode&ssr=false#review-details";

interface ReviewState {
    usage: number;
    done: boolean;
    snoozedUntil: number;
}

const DEFAULT_STATE: ReviewState = { usage: 0, done: false, snoozedUntil: 0 };

export class ReviewPrompt {
    private askedThisSession = false;

    constructor(private readonly context: vscode.ExtensionContext) {}

    private readState(): ReviewState {
        const stored = this.context.globalState.get<Partial<ReviewState>>(
            STATE_KEY,
            {},
        );
        return { ...DEFAULT_STATE, ...stored };
    }

    private async writeState(state: ReviewState): Promise<void> {
        await this.context.globalState.update(STATE_KEY, state);
    }

    async recordUsage(): Promise<void> {
        const state = this.readState();
        if (state.done) {
            return;
        }

        state.usage += 1;
        await this.writeState(state);

        if (
            this.askedThisSession ||
            state.usage < USAGE_THRESHOLD ||
            Date.now() < state.snoozedUntil
        ) {
            return;
        }

        this.askedThisSession = true;
        await this.ask(state);
    }

    async openReviewPage(): Promise<void> {
        await vscode.env.openExternal(vscode.Uri.parse(REVIEW_URL));
        const state = this.readState();
        state.done = true;
        await this.writeState(state);
    }

    private async ask(state: ReviewState): Promise<void> {
        const leaveReview = "Leave a review";
        const later = "Later";
        const never = "Don't ask again";

        const choice = await vscode.window.showInformationMessage(
            "Do you find Ollama Local Chat useful? A short review on the Marketplace helps other developers find it.",
            leaveReview,
            later,
            never,
        );

        if (choice === leaveReview) {
            await this.openReviewPage();
            return;
        }

        if (choice === never) {
            state.done = true;
        } else {
            state.snoozedUntil = Date.now() + SNOOZE_MS;
        }
        await this.writeState(state);
    }
}
