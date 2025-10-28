import { MxElement } from "./types";

interface Selector {
    cssSelector: string;
    mode: string;
}

const selectorMode = (selector: string): Selector => {
    const sel = selector.split(":");
    const cssSelector = sel[0];
    const mode = sel[1] ?? "outerHTML";
    return { cssSelector, mode };
};

const swap = (
    html: string,
    swaps: Array<{ select?: string; target: string }>,
    options?: { pushUrl: string; title: string }
): void => {
    const parser = new DOMParser();

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

        let select: Selector = { cssSelector: "body", mode: "innerHTML" };
        let selectEl: MxElement | null = parser.parseFromString(
            html,
            "text/html"
        ).body;
        if (singleSwap.select) {
            select = selectorMode(singleSwap.select);
            selectEl = selectEl.querySelector<MxElement>(select.cssSelector);
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
};

export { swap };
