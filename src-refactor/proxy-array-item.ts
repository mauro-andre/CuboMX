import {
    MxElement,
    MxElProxy,
    MxProxy,
    Reaction,
    ArrayItems,
    ClassList,
} from "./types";
import { resolveReactions } from "./reactions";
import {
    parseAttrToBind,
    getComponentNameAttr,
    parseAttrValue,
    assignValue,
    createReaction,
} from "./hydration-helpers";

import { createProxy, reactionsSymbol } from "./proxy-component";

const hydrateItemProxy = (item: any, templateElement: MxElement): MxElProxy => {
    const clonedElement = templateElement.cloneNode(true) as MxElement;
    clonedElement.__doNotProcessNode__ = true;

    const itemProxy = createProxy(item, clonedElement) as MxElProxy;

    const allElementsInScope = [
        clonedElement,
        ...Array.from(clonedElement.querySelectorAll<MxElement>("*")),
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
            const reactionMap = itemProxy[reactionsSymbol as any] as Map<
                string,
                Reaction[]
            >;
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

const createArrayProxy = <T = any>(arr: Array<any>): ArrayItems<T> => {
    let templateElement: MxElement | null =
        arr.length > 0 && arr[0].$el
            ? (arr[0].$el.cloneNode(true) as MxElement)
            : null;

    let parentElement: MxElement | null =
        arr.length > 0 && arr[0].$el ? arr[0].$el.parentElement : null;

    const proxy = new Proxy(arr, {
        has(target, prop) {
            if (
                prop === "add" ||
                prop === "prepend" ||
                prop === "unshift" ||
                prop === "delete" ||
                prop === "pop" ||
                prop === "shift" ||
                prop === "clear" ||
                prop === "replace" ||
                prop === "_hydrateAdd"
            ) {
                return true;
            }
            return prop in target;
        },
        get(target, prop) {
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

                    const itemProxy = hydrateItemProxy(
                        item,
                        templateElement as MxElement
                    );

                    parentElement.appendChild(itemProxy.$el);

                    target.push(itemProxy);

                    return itemProxy;
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

                    const itemProxy = hydrateItemProxy(
                        item,
                        templateElement as MxElement
                    );

                    parentElement.prepend(itemProxy.$el);

                    target.unshift(itemProxy);

                    return itemProxy;
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
                    const newItemProxy = hydrateItemProxy(
                        item,
                        templateElement
                    ) as MxElProxy;

                    oldItemProxy.$el.parentElement?.insertBefore(
                        newItemProxy.$el,
                        oldItemProxy.$el
                    );

                    oldItemProxy.$el.remove();
                    target[index] = newItemProxy;

                    return newItemProxy;
                };
            }

            return target[prop as any];
        },
    });

    return proxy as ArrayItems<T>;
};

export { createArrayProxy };
