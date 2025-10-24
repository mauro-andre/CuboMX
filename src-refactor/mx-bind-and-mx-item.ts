import { MxElement, MxElProxy, MxProxy } from "./types";
import { PublicAPI, Reaction } from "./types";
import { reactionsSymbol, createProxy, createArrayProxy } from "./proxies";
import {
    parseAttrToBind,
    getComponentNameAttr,
    getProxyInfo,
    parseAttrValue,
    assignValue,
    createReaction,
} from "./hydration-helpers";

const addReaction = (
    proxy: MxElProxy | MxProxy,
    propName: string,
    reaction: Reaction
) => {
    const reactionMap = proxy[reactionsSymbol as any] as Map<
        string,
        Reaction[]
    >;

    if (!reactionMap.has(propName)) {
        reactionMap.set(propName, []);
    }

    reactionMap.get(propName)?.push(reaction);
};

const resolveMXBind = (el: MxElement, publicAPI: PublicAPI) => {
    el.__doNotProcessNode__ = true;

    for (const attr of Array.from(el.attributes)) {
        const parsed = parseAttrToBind(attr, ["mx-bind:", ":"]);
        if (!parsed) continue;
        const { attrToBind, modifier } = parsed;
        if (!attrToBind || attrToBind.startsWith(":")) continue;
        const { proxy, componentName, componentAttr } = getProxyInfo(
            el,
            attr,
            publicAPI
        );
        if (!proxy) {
            if (componentName) {
                console.error(
                    `[CuboMX] mx-bind directive failed: Component "${componentName}" not found`
                );
            } else {
                console.error(
                    `[CuboMX] mx-bind directive failed: No mx-data component found in element or ancestors`
                );
            }
            continue;
        }

        const value = parseAttrValue(el, attrToBind);
        assignValue(proxy, componentAttr, value, modifier);

        const reaction = createReaction(el, attrToBind);
        addReaction(proxy, componentAttr, reaction);
    }
};

const resolveMXItem = (el: MxElement, publicAPI: PublicAPI) => {
    el.__doNotProcessNode__ = true;
    const mainAttr = el.getAttributeNode("mx-item");
    if (!mainAttr) return;
    const { proxy, componentName, componentAttr } = getProxyInfo(
        el,
        mainAttr,
        publicAPI
    );

    if (!proxy) {
        if (componentName) {
            console.error(
                `[CuboMX] mx-item directive failed: Component "${componentName}" not found`
            );
        } else {
            console.error(
                `[CuboMX] mx-item directive failed: No mx-data component found in element or ancestors`
            );
        }
        return;
    }

    const itemProxy = createProxy({}, el);

    const allElementsInScope = [
        el,
        ...Array.from(el.querySelectorAll<MxElement>("*")),
    ];

    for (const element of allElementsInScope) {
        element.__doNotProcessNode__ = true;
        for (const attr of Array.from(element.attributes)) {
            const parsed = parseAttrToBind(attr, ["mx-item:", "::"]);
            if (!parsed) continue;

            const { attrToBind, modifier } = parsed;
            const component = getComponentNameAttr(attr);
            const propName = component.componentAttr;
            const value = parseAttrValue(element, attrToBind);

            assignValue(itemProxy, propName, value, modifier);
            const reaction = createReaction(element, attrToBind);
            addReaction(itemProxy, propName, reaction);
        }
    }

    const currentArray = proxy[componentAttr];
    if (
        !currentArray ||
        (Array.isArray(currentArray) && !("_hydrateAdd" in currentArray))
    ) {
        proxy[componentAttr] = createArrayProxy([itemProxy]);
    } else {
        currentArray._hydrateAdd(itemProxy);
    }
};

export { resolveMXBind, resolveMXItem };
