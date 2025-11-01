import { MxElement } from "./types";
import { captureState } from "./history";

interface Selector {
    cssSelector: string;
    mode: string;
}

interface Swap {
    select?: string;
    target: string;
}

interface Option {
    pushUrl?: string;
    title?: string;
}

const selectorMode = (selector: string): Selector => {
    const sel = selector.split(":");
    const cssSelector = sel[0];
    const mode = sel[1] ?? "outerHTML";
    return { cssSelector, mode };
};

const swap = (html: string, swaps: Swap[], options?: Option): void => {
    const parser = new DOMParser();

    const pushUrl = options?.pushUrl;
    const targetSelectors = swaps.map(
        (swap) => selectorMode(swap.target).cssSelector
    );
    const currentState = pushUrl ? captureState(targetSelectors) : null;

    if (currentState) {
        window.history.replaceState(
            {
                swaps: currentState,
                title: document.title,
            },
            "",
            window.location.href
        );
    }

    for (const singleSwap of swaps) {
        const target = selectorMode(singleSwap.target);
        const targetEls = document.querySelectorAll<MxElement>(
            target.cssSelector
        );

        if (targetEls.length == 0) {
            console.error(
                `[CuboMX] no elements found in current DOM with css selector "${target.cssSelector}"`
            );
            continue;
        }

        const parsedDoc = parser.parseFromString(html, "text/html");

        let select: Selector = { cssSelector: "body", mode: "innerHTML" };
        let selectEl: MxElement | null = parsedDoc.body;
        if (singleSwap.select) {
            select = selectorMode(singleSwap.select);
            selectEl = parsedDoc.querySelector<MxElement>(select.cssSelector);
        }

        if (!selectEl) {
            console.error(
                `[CuboMX] Source element "${select.cssSelector}" not found in received HTML`
            );
            continue;
        }

        for (const el of Array.from(targetEls)) {
            const fragment = document.createDocumentFragment();
            if (select.mode === "innerHTML") {
                fragment.append(
                    ...Array.from(selectEl.cloneNode(true).childNodes)
                );
            } else {
                fragment.append(selectEl.cloneNode(true));
            }

            switch (target.mode) {
                case "innerHTML":
                    el.replaceChildren(fragment);
                    break;
                case "outerHTML":
                    el.replaceWith(fragment);
                    break;
                case "beforebegin":
                    el.before(fragment);
                    break;
                case "afterbegin":
                    el.prepend(fragment);
                    break;
                case "beforeend":
                    el.append(fragment);
                    break;
                case "afterend":
                    el.after(fragment);
                    break;
            }
        }
    }

    const title = options?.title;
    if (currentState) {
        const newState = { swaps: [], title: title ?? document.title };
        window.history.pushState(newState, title ?? document.title, pushUrl);
        if (title) {
            document.title = title;
        }
    }
};

export { swap };
