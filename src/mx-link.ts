import { MxElement, PublicAPI } from "./types";
import { getProxyInfo } from "./hydration-helpers";
import { request } from "./request";
import { swap } from "./swap";

const resolveMXLink = (el: MxElement, publicAPI: PublicAPI) => {
    const attr = el.getAttributeNode("mx-link");
    const attrHref = el.getAttributeNode("href");
    const attrTarget = el.getAttributeNode("mx-target");
    const attrSelect = el.getAttributeNode("mx-select");
    const attrTitle = el.getAttributeNode("mx-title");
    if (!attr || !attrHref) {
        console.error(
            `[CuboMX] mx-link directive failed: It is necessary to have an href attribute.`
        );
        return;
    }

    el.addEventListener("click", async (event: Event) => {
        event.preventDefault();

        let html = null;

        if (attr.value) {
            const { proxy, componentName, componentAttr } = getProxyInfo(
                el,
                attr,
                publicAPI
            );
            if (!proxy) {
                if (componentName) {
                    console.error(
                        `[CuboMX] mx-link directive failed: Component "${componentName}" not found`
                    );
                } else {
                    console.error(
                        `[CuboMX] mx-link directive failed: No mx-data component found in element or ancestors`
                    );
                }
                return;
            }

            html = proxy[componentAttr];
        }
        const url = attrHref.value;
        const target = attrTarget?.value ?? "body:innerHTML";
        const select = attrSelect?.value;
        const title = attrTitle?.value;

        if (!html) {
            try {
                const response = await request({ url: url });
                html = response.text;
            } catch (error) {
                console.error(
                    `[CuboMX] Failed to fetch content for ${url}:`,
                    error
                );
                return;
            }
        }

        const swaps = select ? [{ select, target }] : [{ target }];
        const options = title
            ? { pushUrl: url, title: title }
            : { pushUrl: url };
        swap(html, swaps, options);
    });
};

export { resolveMXLink };
