import { parseAttrToBind, getComponentNameAttr, parseAttrValue, assignValue, createReaction, } from "./hydration-helpers";
import { createProxy, reactionsSymbol } from "./proxy-component";
const hydrateItemProxy = (item, templateElement) => {
    const clonedElement = templateElement.cloneNode(true);
    clonedElement.__doNotProcessNode__ = true;
    const itemProxy = createProxy(item, clonedElement);
    const allElementsInScope = [
        clonedElement,
        ...Array.from(clonedElement.querySelectorAll("*")),
    ];
    for (const element of allElementsInScope) {
        element.__doNotProcessNode__ = true;
        for (const attr of Array.from(element.attributes)) {
            const parsed = parseAttrToBind(attr, ["mx-item:", "::"]);
            if (!parsed)
                continue;
            const { attrToBind, modifier } = parsed;
            const component = getComponentNameAttr(attr);
            const propName = component.componentAttr;
            const reaction = createReaction(element, attrToBind);
            const reactionMap = itemProxy[reactionsSymbol];
            if (!reactionMap.has(propName)) {
                reactionMap.set(propName, []);
            }
            reactionMap.get(propName)?.push(reaction);
            const value = item[propName] ?? parseAttrValue(element, attrToBind);
            assignValue(itemProxy, propName, value, modifier);
        }
    }
    return itemProxy;
};
const createArrayProxy = (arr) => {
    let templateElement = arr.length > 0 && arr[0].$el
        ? arr[0].$el.cloneNode(true)
        : null;
    let parentElement = arr.length > 0 && arr[0].$el ? arr[0].$el.parentElement : null;
    const proxy = new Proxy(arr, {
        has(target, prop) {
            if (prop === "add" ||
                prop === "prepend" ||
                prop === "unshift" ||
                prop === "delete" ||
                prop === "pop" ||
                prop === "shift" ||
                prop === "clear" ||
                prop === "replace" ||
                prop === "_hydrateAdd") {
                return true;
            }
            return prop in target;
        },
        get(target, prop) {
            if (prop === "_hydrateAdd") {
                return (itemProxy) => {
                    if (!templateElement && itemProxy.$el) {
                        templateElement = itemProxy.$el.cloneNode(true);
                    }
                    if (!parentElement && itemProxy.$el) {
                        parentElement = itemProxy.$el.parentElement;
                    }
                    target.push(itemProxy);
                };
            }
            if (prop === "add" || prop === "push") {
                return (item) => {
                    if (!templateElement) {
                        throw new Error("[CuboMX] Cannot add item: no template available.");
                    }
                    if (!parentElement) {
                        throw new Error("[CuboMX] Cannot add: parent element not found.");
                    }
                    const itemProxy = hydrateItemProxy(item, templateElement);
                    parentElement.appendChild(itemProxy.$el);
                    target.push(itemProxy);
                    return itemProxy;
                };
            }
            if (prop === "prepend" || prop === "unshift") {
                return (item) => {
                    if (!templateElement) {
                        throw new Error("[CuboMX] Cannot add item: no template available.");
                    }
                    if (!parentElement) {
                        throw new Error("[CuboMX] Cannot add: parent element not found.");
                    }
                    const itemProxy = hydrateItemProxy(item, templateElement);
                    parentElement.prepend(itemProxy.$el);
                    target.unshift(itemProxy);
                    return itemProxy;
                };
            }
            if (prop === "delete") {
                return (index) => {
                    if (index < 0 || index >= target.length) {
                        console.error(`[CuboMX] Cannot delete item at index ${index}: out of bounds`);
                        return;
                    }
                    const itemProxy = target[index];
                    itemProxy.$el.remove();
                    target.splice(index, 1);
                };
            }
            if (prop === "pop") {
                return () => {
                    if (target.length === 0) {
                        return;
                    }
                    proxy.delete(target.length - 1);
                };
            }
            if (prop === "shift") {
                return () => {
                    if (target.length === 0) {
                        return;
                    }
                    proxy.delete(0);
                };
            }
            if (prop === "clear") {
                return () => {
                    if (target.length > 0) {
                        if (!templateElement) {
                            templateElement = target[0].$el.cloneNode(true);
                        }
                        if (!parentElement) {
                            parentElement = target[0].$el.parentElement;
                        }
                    }
                    for (const itemProxy of target) {
                        itemProxy.$el.remove();
                    }
                    target.length = 0;
                };
            }
            if (prop === "replace") {
                return (index, item) => {
                    if (index < 0 || index >= target.length) {
                        throw new Error(`[CuboMX] Cannot replace item at index ${index}: out of bounds`);
                    }
                    if (!templateElement) {
                        throw new Error("[CuboMX] Cannot replace item: no template available.");
                    }
                    const oldItemProxy = target[index];
                    const newItemProxy = hydrateItemProxy(item, templateElement);
                    oldItemProxy.$el.parentElement?.insertBefore(newItemProxy.$el, oldItemProxy.$el);
                    oldItemProxy.$el.remove();
                    target[index] = newItemProxy;
                    return newItemProxy;
                };
            }
            return target[prop];
        },
    });
    return proxy;
};
export { createArrayProxy };
