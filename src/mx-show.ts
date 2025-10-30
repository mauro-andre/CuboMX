import { MxElement, PublicAPI } from "./types";
import { getProxyInfo, createReaction, addReaction } from "./hydration-helpers";

const resolveMXShow = (el: MxElement, publicAPI: PublicAPI) => {
    const attr = el.getAttributeNode("mx-show");
    if (!attr) return;

    const { proxy, componentName, componentAttr } = getProxyInfo(
        el,
        attr,
        publicAPI
    );

    if (!proxy) {
        if (componentName) {
            console.error(
                `[CuboMX] mx-show directive failed: Component "${componentName}" not found`
            );
        } else {
            console.error(
                `[CuboMX] mx-show directive failed: No mx-data component found in element or ancestors`
            );
        }
        return;
    }

    const reaction = createReaction(el, "mx-show");
    addReaction(proxy, componentAttr, reaction);

    const state = !!proxy[componentAttr];
    if (!state) {
        el.style.display = "none";
    }

    el.removeAttribute("mx-cloak");
};

export { resolveMXShow };
