import { MxElement } from "./types";

interface Selector {
    el: MxElement;
    mode: string;
}

class SwapBuilder {
    private html: string;
    private sourceSelector: Selector | null = null;

    constructor(html: string) {
        this.html = html;
    }

    select(
        cssSelector: string,
        mode: "innerHTML" | "outerHTML" = "outerHTML"
    ): this {
        const parser = new DOMParser();
        const selectEl = parser
            .parseFromString(this.html, "text/html")
            .body.querySelector<MxElement>(cssSelector);

        if (!selectEl) {
            throw new Error(
                `[CuboMX] Source element "${cssSelector}" not found in received HTML`
            );
        }

        this.sourceSelector = { el: selectEl, mode: mode };
        return this;
    }

    target(
        cssSelector: string,
        mode:
            | "innerHTML"
            | "outerHTML"
            | "beforebegin"
            | "afterbegin"
            | "beforeend"
            | "afterend" = "outerHTML"
    ): this {
        const targetEls = document.querySelectorAll<MxElement>(cssSelector);

        if (targetEls.length == 0) {
            console.error(
                `[CuboMX] no elements found with css selector "${cssSelector}"`
            );
            this.sourceSelector = null;
            return this;
        }

        if (!this.sourceSelector) {
            const parser = new DOMParser();
            const selectEl = parser.parseFromString(
                this.html,
                "text/html"
            ).body;
            this.sourceSelector = { el: selectEl, mode: "innerHTML" };
        }

        for (const el of Array.from(targetEls)) {
            const fragment = document.createDocumentFragment();
            if (this.sourceSelector.mode === "innerHTML") {
                fragment.append(
                    ...Array.from(
                        this.sourceSelector.el.cloneNode(true).childNodes
                    )
                );
            } else {
                fragment.append(this.sourceSelector.el.cloneNode(true));
            }

            switch (mode) {
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

        this.sourceSelector = null;
        return this;
    }
}

export { SwapBuilder };
