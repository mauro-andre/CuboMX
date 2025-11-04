import { MxElement } from "./types";
import { captureState } from "./history";
import { preprocessBindings } from "./rendering-helpers";

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
    data?: Record<string, any>;
}

const selectorMode = (selector: string): Selector => {
    const sel = selector.split(":");
    const cssSelector = sel[0];
    const mode = sel[1] ?? "outerHTML";
    return { cssSelector, mode };
};

const swap = async (
    html: string,
    swaps: Swap[],
    options?: Option
): Promise<void> => {
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

    // Collect all hydration promises from all swaps
    const allHydrationPromises: Promise<void>[] = [];

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

        let select: Selector;
        let selectEl: MxElement | null;

        if (singleSwap.select) {
            // Se select foi fornecido explicitamente, usa ele
            select = selectorMode(singleSwap.select);
            selectEl = parsedDoc.querySelector<MxElement>(select.cssSelector);
        } else {
            // Se select não foi fornecido, tenta usar target como select
            select = selectorMode(singleSwap.target);
            selectEl = null;

            // Só tenta buscar o elemento se o modo for innerHTML ou outerHTML
            if (select.mode === "innerHTML" || select.mode === "outerHTML") {
                selectEl = parsedDoc.querySelector<MxElement>(
                    select.cssSelector
                );
            }

            // Se não encontrou ou modo não era apropriado, usa body innerHTML
            if (!selectEl) {
                select = { cssSelector: "body", mode: "innerHTML" };
                selectEl = parsedDoc.body;
            }
        }

        if (!selectEl) {
            console.error(
                `[CuboMX] Source element "${select.cssSelector}" not found in received HTML`
            );
            continue;
        }

        // Preprocess bindings if data is provided
        if (options?.data) {
            preprocessBindings(selectEl, options.data, [":", "mx-bind:"]);
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

            // Collect ONLY root element nodes (direct children of fragment)
            // Do NOT traverse into descendants - MutationObserver only detects root nodes
            const rootElements = Array.from(fragment.childNodes).filter(
                (node) => node.nodeType === 1 // Only element nodes (not text/comment)
            ) as MxElement[];

            // Create promises for each root element that will be inserted
            const hydrationPromises = rootElements.map((rootElement) => {
                return new Promise<void>((resolve) => {
                    rootElement.__resolveHydration__ = () => resolve();
                });
            });

            allHydrationPromises.push(...hydrationPromises);

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

    // Await all hydration promises to ensure DOM is fully processed
    await Promise.all(allHydrationPromises);

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
