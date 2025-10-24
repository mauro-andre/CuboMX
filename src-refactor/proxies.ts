import { MxElement, MxElProxy, MxProxy, Reaction, ArrayItems } from "./types";
import { resolveReactions } from "./reactions";
import {
    parseAttrToBind,
    getComponentNameAttr,
    parseAttrValue,
    assignValue,
    createReaction,
} from "./hydration-helpers";

const reactionsSymbol = Symbol("reactions");

const createProxy = (obj: any, el: MxElement | null): MxElProxy | MxProxy => {
    obj[reactionsSymbol] = new Map<string, Reaction[]>();
    const proxy = new Proxy(obj, {
        get(target, prop) {
            if (prop === "$el") {
                return el;
            }
            if (prop === reactionsSymbol) {
                return target[reactionsSymbol];
            }
            return target[prop];
        },

        set(target, prop, value) {
            const oldValue = target[prop];
            target[prop] = value;

            const reactionMap = target[reactionsSymbol] as Map<
                string,
                Reaction[]
            >;
            const reactions = reactionMap.get(prop as string);

            if (reactions && reactions.length > 0) {
                for (const reaction of reactions) {
                    resolveReactions(reaction, value, oldValue);
                }
            }
            return true;
        },
    });

    return proxy;
};

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
    const proxy = new Proxy(arr, {
        has(target, prop) {
            if (
                prop === "add" ||
                prop === "prepend" ||
                prop === "unshift" ||
                prop === "delete" ||
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
                    target.push(itemProxy);
                };
            }

            if (prop === "add" || prop === "push") {
                return (item: T): MxElProxy => {
                    if (target.length === 0) {
                        throw new Error(
                            "[CuboMX] Cannot add item: no template available."
                        );
                    }

                    const templateElement = target[0].$el as MxElement;
                    const itemProxy = hydrateItemProxy(item, templateElement);

                    const parentElement: MxElement =
                        target[0].$el.parentElement;
                    parentElement.appendChild(itemProxy.$el);

                    target.push(itemProxy);

                    return itemProxy;
                };
            }

            if (prop === "prepend" || prop === "unshift") {
                return (item: T): MxElProxy => {
                    if (target.length === 0) {
                        console.error(
                            "[CuboMX] Cannot add item: no template available."
                        );
                    }

                    const templateElement = target[0].$el as MxElement;
                    const itemProxy = hydrateItemProxy(item, templateElement);

                    const parentElement: MxElement =
                        target[0].$el.parentElement;
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

            return target[prop as any];
        },
    });

    return proxy as ArrayItems<T>;
};

export { createProxy, reactionsSymbol, createArrayProxy };
