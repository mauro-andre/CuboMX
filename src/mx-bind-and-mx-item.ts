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
        const value = parseAttrValue(el, attrToBind);
        assignValue(proxy, componentAttr, value, modifier, reaction.type);
        twoWayBinding(attrToBind, componentAttr, proxy as MxElProxy, el);

        addReaction(proxy, componentAttr, reaction);
    }
};

const resolveMXItem = (el: MxElement, publicAPI: PublicAPI) => {
    // Skip if this element was already processed as mx-item
    if (el.__mxItemProcessed__) return;

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
        for (const attr of Array.from(element.attributes)) {
            const parsed = parseAttrToBind(attr, ["mx-item:", "::"]);
            if (!parsed) continue;

            const { attrToBind, modifier } = parsed;
            const component = getComponentNameAttr(attr);
            const propName = component.componentAttr;

            const reaction = createReaction(element, attrToBind);
            const value = parseAttrValue(element, attrToBind);
            assignValue(
                el.__itemProxy__,
                propName,
                value,
                modifier,
                reaction.type
            );
            twoWayBinding(attrToBind, propName, el.__itemProxy__, element);

            addReaction(el.__itemProxy__, propName, reaction);
        }
    }

    const currentArray = proxy[componentAttr];
    if (
        !currentArray ||
        (Array.isArray(currentArray) && !("_hydrateAdd" in currentArray))
    ) {
        proxy[componentAttr] = createArrayProxy([el.__itemProxy__]);
    } else {
        // Calculate the index based on DOM position among siblings with same mx-item
        const parentElement = el.parentElement;
        let index = 0;

        if (parentElement) {
            // Get all sibling elements with the same mx-item attribute
            const mxItemAttr = el.getAttribute("mx-item");
            const siblings = Array.from(
                parentElement.querySelectorAll<MxElement>(`[mx-item="${mxItemAttr}"]`)
            );

            // Find the position of this element among its siblings
            index = siblings.indexOf(el);

            // If not found (shouldn't happen), default to end
            if (index === -1) {
                index = currentArray.length;
            }
        }

        currentArray._hydrateAdd(el.__itemProxy__, index);
    }
};

export { resolveMXBind, resolveMXItem };
