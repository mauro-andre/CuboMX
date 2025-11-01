import { MxElement, MxElProxy, Reaction, ArrayItems } from "./types";
import {
    parseAttrToBind,
    getComponentNameAttr,
    parseAttrValue,
    assignValue,
    createReaction,
} from "./hydration-helpers";

import { createProxy, reactionsSymbol } from "./proxy-component";

const hydrateItemProxy = (item: any, templateElement: MxElement): MxElement => {
    const clonedElement = templateElement.cloneNode(true) as MxElement;
    clonedElement.__mxItemProcessed__ = true;

    const itemProxy = createProxy(item, clonedElement) as MxElProxy;
    clonedElement.__itemProxy__ = itemProxy;

    const allElementsInScope = [
        clonedElement,
        ...Array.from(clonedElement.querySelectorAll<MxElement>("*")),
    ];

    for (const element of allElementsInScope) {
        for (const attr of Array.from(element.attributes)) {
            const parsed = parseAttrToBind(attr, ["mx-item:", "::"]);
            if (!parsed) continue;

            const { attrToBind, modifier } = parsed;
            const component = getComponentNameAttr(attr);
            const propName = component.componentAttr;

            const reaction = createReaction(element, attrToBind);
            const reactionMap = clonedElement.__itemProxy__[
                reactionsSymbol as any
            ] as Map<string, Reaction[]>;
            if (!reactionMap.has(propName)) {
                reactionMap.set(propName, []);
            }
            reactionMap.get(propName)?.push(reaction);

            const value = item[propName] ?? parseAttrValue(element, attrToBind);
            assignValue(
                clonedElement.__itemProxy__,
                propName,
                value,
                modifier,
                reaction.type
            );
        }
    }
    return clonedElement;
};

const createArrayProxy = <T = any>(
    arr: Array<any>,
    initialTemplate?: MxElement
): ArrayItems<T> => {
    // Priority: 1. Explicit template, 2. First item's element
    let templateElement: MxElement | null = initialTemplate
        ? (initialTemplate.cloneNode(true) as MxElement)
        : arr.length > 0 && arr[0].$el
        ? (arr[0].$el.cloneNode(true) as MxElement)
        : null;

    // Mark template so clones will inherit the flag
    if (templateElement) {
        templateElement.__mxItemProcessed__ = true;
    }

    let parentElement: MxElement | null =
        arr.length > 0 && arr[0].$el ? arr[0].$el.parentElement : null;

    const proxy = new Proxy(arr, {
        has(target, prop) {
            if (
                prop === "add" ||
                prop === "prepend" ||
                prop === "unshift" ||
                prop === "delete" ||
                prop === "remove" ||
                prop === "pop" ||
                prop === "shift" ||
                prop === "clear" ||
                prop === "replace" ||
                prop === "_hydrateAdd" ||
                prop === "_setTemplate" ||
                prop === "_setParent"
            ) {
                return true;
            }
            return prop in target;
        },
        get(target, prop) {
            if (prop === "_setTemplate") {
                return (template: MxElement): void => {
                    templateElement = template.cloneNode(true) as MxElement;
                    templateElement.__mxItemProcessed__ = true;
                };
            }

            if (prop === "_setParent") {
                return (parent: MxElement): void => {
                    parentElement = parent;
                };
            }

            if (prop === "_hydrateAdd") {
                return (itemProxy: MxElProxy): void => {
                    if (!templateElement && itemProxy.$el) {
                        templateElement = itemProxy.$el.cloneNode(
                            true
                        ) as MxElement;
                    }
                    if (!parentElement && itemProxy.$el) {
                        parentElement = itemProxy.$el.parentElement;
                    }
                    target.push(itemProxy);
                };
            }

            if (prop === "add" || prop === "push") {
                return (item: T): MxElProxy => {
                    if (!templateElement) {
                        throw new Error(
                            "[CuboMX] Cannot add item: no template available."
                        );
                    }

                    if (!parentElement) {
                        throw new Error(
                            "[CuboMX] Cannot add: parent element not found."
                        );
                    }

                    const clonedElement = hydrateItemProxy(
                        item,
                        templateElement as MxElement
                    );

                    parentElement.appendChild(clonedElement);

                    target.push(clonedElement.__itemProxy__);

                    return clonedElement.__itemProxy__ as MxElProxy;
                };
            }

            if (prop === "prepend" || prop === "unshift") {
                return (item: T): MxElProxy => {
                    if (!templateElement) {
                        throw new Error(
                            "[CuboMX] Cannot add item: no template available."
                        );
                    }

                    if (!parentElement) {
                        throw new Error(
                            "[CuboMX] Cannot add: parent element not found."
                        );
                    }

                    const clonedElement = hydrateItemProxy(
                        item,
                        templateElement as MxElement
                    );

                    parentElement.prepend(clonedElement);

                    target.unshift(clonedElement.__itemProxy__);

                    return clonedElement.__itemProxy__ as MxElProxy;
                };
            }

            if (prop === "delete") {
                return (index: number): void => {
                    if (index < 0 || index >= target.length) {
                        console.error(
                            `[CuboMX] Cannot delete item at index ${index}: out of bounds`
                        );
                        return;
                    }

                    const itemProxy = target[index];
                    itemProxy.$el.remove();
                    target.splice(index, 1);
                };
            }

            if (prop === "remove") {
                return (item: MxElProxy): void => {
                    const index = target.indexOf(item);
                    if (index === -1) {
                        console.error(
                            `[CuboMX] Cannot remove item: item not found in array`
                        );
                        return;
                    }
                    (proxy as any).delete(index);
                };
            }

            if (prop === "pop") {
                return (): void => {
                    if (target.length === 0) {
                        return;
                    }
                    (proxy as any).delete(target.length - 1);
                };
            }

            if (prop === "shift") {
                return (): void => {
                    if (target.length === 0) {
                        return;
                    }
                    (proxy as any).delete(0);
                };
            }

            if (prop === "clear") {
                return (): void => {
                    if (target.length > 0) {
                        if (!templateElement) {
                            templateElement = target[0].$el.cloneNode(
                                true
                            ) as MxElement;
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
                return (index: number, item: T): MxElProxy => {
                    if (index < 0 || index >= target.length) {
                        throw new Error(
                            `[CuboMX] Cannot replace item at index ${index}: out of bounds`
                        );
                    }

                    if (!templateElement) {
                        throw new Error(
                            "[CuboMX] Cannot replace item: no template available."
                        );
                    }

                    const oldItemProxy = target[index] as MxElProxy;
                    const clonedElement = hydrateItemProxy(
                        item,
                        templateElement
                    );

                    oldItemProxy.$el.parentElement?.insertBefore(
                        clonedElement,
                        oldItemProxy.$el
                    );

                    oldItemProxy.$el.remove();
                    target[index] = clonedElement.__itemProxy__;

                    return clonedElement.__itemProxy__ as MxElProxy;
                };
            }

            return target[prop as any];
        },
    });

    return proxy as ArrayItems<T>;
};

export { createArrayProxy };
