import { MxElement } from "./types";

interface CapturedState {
    selector: string;
    htmls: string[];
}

interface HistoryState {
    swaps: CapturedState[];
    title: string;
}

const captureState = (cssSelectors: string[]): CapturedState[] => {
    const capturedStates: CapturedState[] = [];
    const processedSelectors = new Set<string>();

    for (const cssSelector of cssSelectors) {
        if (processedSelectors.has(cssSelector)) continue;
        processedSelectors.add(cssSelector);
        const targetEls = document.querySelectorAll<MxElement>(cssSelector);
        if (targetEls.length > 0) {
            const htmls = Array.from(targetEls).map((el) => el.outerHTML);
            capturedStates.push({ selector: cssSelector, htmls: htmls });
        }
    }

    return capturedStates;
};

const restoreState = (state: HistoryState | null) => {
    if (!state) return;

    if (state.title !== undefined) {
        document.title = state.title;
    }

    if (!state.swaps) return;

    for (const swap of state.swaps) {
        const targetEls = document.querySelectorAll<MxElement>(swap.selector);

        if (targetEls.length === swap.htmls.length) {
            targetEls.forEach((el, idx) => {
                const tempEl = document.createElement("div");
                tempEl.innerHTML = swap.htmls[idx];

                if (tempEl.firstChild) {
                    el.replaceWith(tempEl.firstChild);
                }
            });
        }
    }
};

export { captureState, restoreState };
