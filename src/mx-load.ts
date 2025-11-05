import { MxElement, PublicAPI } from "./types";
import { request } from "./request";
import { swap } from "./swap";

const resolveMXLoad = async (el: MxElement, publicAPI: PublicAPI) => {
    const attr = el.getAttributeNode("mx-load");
    const attrTarget = el.getAttributeNode("mx-target");
    const attrSelect = el.getAttributeNode("mx-select");
    // const attrTitle = el.getAttributeNode("mx-title");

    if (!attr || !attr.value) {
        console.error(
            `[CuboMX] mx-load directive failed: URL is required in mx-load attribute.`
        );
        return;
    }

    const url = attr.value;
    const target = attrTarget?.value ?? "body:innerHTML";
    const select = attrSelect?.value;
    // const title = attrTitle?.value;

    try {
        const response = await request({ url: url });
        const html = response.text;

        const swaps = select ? [{ select, target }] : [{ target }];
        // const options = title
        //     ? { pushUrl: url, title: title }
        //     : { pushUrl: url };

        await swap(html, swaps);
    } catch (error) {
        console.error(`[CuboMX] Failed to fetch content for ${url}:`, error);
    }
};

export { resolveMXLoad };
