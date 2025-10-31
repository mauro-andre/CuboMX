import { MxElement, MxElProxy, MxProxy } from "./types";
import { PublicAPI } from "./types";
import { createProxy } from "./proxy-component";
import { createArrayProxy } from "./proxy-array-item";
import {
    parseAttrToBind,
    getComponentNameAttr,
    getProxyInfo,
    assignValue,
    createReaction,
    addReaction,
    parseAttrValue,
    twoWayBinding,
} from "./hydration-helpers";

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

        const reaction = createReaction(el, attrToBind);
        addReaction(proxy, componentAttr, reaction);

        const value = parseAttrValue(el, attrToBind);
        assignValue(proxy, componentAttr, value, modifier);
        twoWayBinding(attrToBind, componentAttr, proxy as MxElProxy, el);
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

    // If this is a <template> element, use it as template definition
    if (el.tagName.toLowerCase() === "template") {
        const templateContent = (el as HTMLTemplateElement).content;
        const templateElement =
            templateContent.firstElementChild as MxElement | null;

        if (!templateElement) {
            console.error(
                `[CuboMX] mx-item template is empty: template must contain at least one child element`
            );
            return;
        }

        // Get parent element (the container where items will be inserted)
        const parentElement = el.parentElement as MxElement;

        // Initialize array with template info
        const currentArray = proxy[componentAttr];
        if (
            !currentArray ||
            (Array.isArray(currentArray) && !("_hydrateAdd" in currentArray))
        ) {
            const arrayProxy = createArrayProxy([], templateElement);
            arrayProxy._setParent?.(parentElement);
            proxy[componentAttr] = arrayProxy;
        } else {
            // Update existing array with template
            currentArray._setTemplate?.(templateElement);
            currentArray._setParent?.(parentElement);
        }

        // Remove the template element from DOM as it's just a definition
        el.remove();
        return;
    }

    el.__itemProxy__ = createProxy({}, el) as MxElProxy;

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

            const reaction = createReaction(element, attrToBind);
            addReaction(el.__itemProxy__, propName, reaction);

            const value = parseAttrValue(element, attrToBind);
            assignValue(el.__itemProxy__, propName, value, modifier);
            twoWayBinding(attrToBind, propName, el.__itemProxy__, element);
        }
    }

    const currentArray = proxy[componentAttr];
    if (
        !currentArray ||
        (Array.isArray(currentArray) && !("_hydrateAdd" in currentArray))
    ) {
        proxy[componentAttr] = createArrayProxy([el.__itemProxy__]);
    } else {
        currentArray._hydrateAdd(el.__itemProxy__);
    }
};

export { resolveMXBind, resolveMXItem };
