import { MxElement, MxElProxy, Reaction, ArrayItems } from "./types";
import {
    parseAttrToBind,
    getComponentNameAttr,
    parseAttrValue,
    assignValue,
    createReaction,
} from "./hydration-helpers";

import { createProxy, reactionsSymbol } from "./proxy-component";
import { preprocessBindings } from "./rendering-helpers";

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
                prop === "asyncAdd" ||
                prop === "asyncPrepend" ||
                prop === "asyncDelete" ||
                prop === "asyncRemove" ||
                prop === "asyncPop" ||
                prop === "asyncShift" ||
                prop === "asyncClear" ||
                prop === "asyncReplace" ||
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
                return (itemProxy: MxElProxy, index?: number): void => {
                    if (!templateElement && itemProxy.$el) {
                        templateElement = itemProxy.$el.cloneNode(
                            true
                        ) as MxElement;
                    }
                    if (!parentElement && itemProxy.$el) {
                        parentElement = itemProxy.$el.parentElement;
                    }

                    // Insert at specific index if provided, otherwise push to end
                    if (index !== undefined && index >= 0 && index <= target.length) {
                        target.splice(index, 0, itemProxy);
                    } else {
                        target.push(itemProxy);
                    }
                };
            }

            if (prop === "asyncAdd") {
                return async (item: T): Promise<T & MxElProxy> => {
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

                    // 1. Clone the template
                    const clonedElement = templateElement.cloneNode(
                        true
                    ) as MxElement;

                    // 2. Preprocess bindings (replace bound values with actual data)
                    preprocessBindings(
                        clonedElement,
                        item as Record<string, any>,
                        ["mx-item:", "::"]
                    );

                    // 3. Create Promise with resolve callback stored in element
                    const hydrationPromise = new Promise<MxElProxy>(
                        (resolve) => {
                            clonedElement.__resolveHydration__ = resolve;
                        }
                    );

                    // 4. Add to DOM (MutationObserver will detect and hydrate)
                    parentElement.appendChild(clonedElement);

                    // 5. Await hydration to complete
                    // MutationObserver will process the element, create proxy,
                    // add to array, and resolve the promise
                    const itemProxy = await hydrationPromise;

                    return itemProxy as T & MxElProxy;
                };
            }

            if (prop === "asyncPrepend") {
                return async (item: T): Promise<T & MxElProxy> => {
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

                    // 1. Clone the template
                    const clonedElement = templateElement.cloneNode(
                        true
                    ) as MxElement;

                    // 2. Preprocess bindings (replace bound values with actual data)
                    preprocessBindings(
                        clonedElement,
                        item as Record<string, any>,
                        ["mx-item:", "::"]
                    );

                    // 3. Create Promise with resolve callback stored in element
                    const hydrationPromise = new Promise<MxElProxy>(
                        (resolve) => {
                            clonedElement.__resolveHydration__ = resolve;
                        }
                    );

                    // 4. Add to DOM at the beginning (MutationObserver will detect and hydrate)
                    parentElement.prepend(clonedElement);

                    // 5. Await hydration to complete
                    // MutationObserver will process the element, create proxy,
                    // add to array, and resolve the promise
                    const itemProxy = await hydrationPromise;

                    return itemProxy as T & MxElProxy;
                };
            }

            if (prop === "asyncDelete") {
                return async (index: number): Promise<void> => {
                    if (index < 0 || index >= target.length) {
                        throw new Error(
                            `[CuboMX] Cannot delete item at index ${index}: out of bounds`
                        );
                    }

                    const itemProxy = target[index];

                    // 1. Create Promise to await deletion completion
                    const deletionPromise = new Promise<void>((resolve) => {
                        itemProxy.$el.__resolveDelete__ = resolve;
                    });

                    // 2. Remove from array first (prevents index issues)
                    target.splice(index, 1);

                    // 3. Remove from DOM (MutationObserver will detect and process)
                    itemProxy.$el.remove();

                    // 4. Await deletion processing (destroy lifecycle, cleanup, etc)
                    await deletionPromise;
                };
            }

            if (prop === "asyncRemove") {
                return async (item: T): Promise<void> => {
                    const index = target.indexOf(item as any);
                    if (index === -1) {
                        throw new Error(
                            `[CuboMX] Cannot remove item: item not found in array`
                        );
                    }
                    await (proxy as any).asyncDelete(index);
                };
            }

            if (prop === "asyncPop") {
                return async (): Promise<void> => {
                    if (target.length === 0) {
                        return;
                    }
                    await (proxy as any).asyncDelete(target.length - 1);
                };
            }

            if (prop === "asyncShift") {
                return async (): Promise<void> => {
                    if (target.length === 0) {
                        return;
                    }
                    await (proxy as any).asyncDelete(0);
                };
            }

            if (prop === "asyncClear") {
                return async (): Promise<void> => {
                    if (target.length === 0) {
                        return;
                    }

                    // 1. Preserve template and parent for future use
                    if (!templateElement && target[0].$el) {
                        templateElement = target[0].$el.cloneNode(
                            true
                        ) as MxElement;
                    }
                    if (!parentElement && target[0].$el) {
                        parentElement = target[0].$el.parentElement;
                    }

                    // 2. Create deletion Promises for all items
                    const deletionPromises: Promise<void>[] = [];
                    for (const itemProxy of target) {
                        const promise = new Promise<void>((resolve) => {
                            itemProxy.$el.__resolveDelete__ = resolve;
                        });
                        deletionPromises.push(promise);
                    }

                    // 3. Remove all items from DOM
                    for (const itemProxy of target) {
                        itemProxy.$el.remove();
                    }

                    // 4. Clear the array
                    target.length = 0;

                    // 5. Await all deletion processing (destroy lifecycle, cleanup, etc)
                    await Promise.all(deletionPromises);
                };
            }

            if (prop === "asyncReplace") {
                return async (index: number, item: T): Promise<T & MxElProxy> => {
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

                    // 1. Clone the template
                    const clonedElement = templateElement.cloneNode(
                        true
                    ) as MxElement;

                    // 2. Preprocess bindings (replace bound values with actual data)
                    preprocessBindings(
                        clonedElement,
                        item as Record<string, any>,
                        ["mx-item:", "::"]
                    );

                    // 3. Create Promise with resolve callback for hydration
                    const hydrationPromise = new Promise<MxElProxy>(
                        (resolve) => {
                            clonedElement.__resolveHydration__ = resolve;
                        }
                    );

                    // 4. Create Promise with resolve callback for deletion
                    const deletionPromise = new Promise<void>((resolve) => {
                        (oldItemProxy.$el as MxElement).__resolveDelete__ = resolve;
                    });

                    // 5. Insert new element in DOM (before old element)
                    oldItemProxy.$el.parentElement?.insertBefore(
                        clonedElement,
                        oldItemProxy.$el
                    );

                    // 6. Remove old element from array
                    target.splice(index, 1);

                    // 7. Remove old element from DOM (MutationObserver will detect)
                    oldItemProxy.$el.remove();

                    // 8. Await both hydration and deletion
                    // MutationObserver will:
                    //   - Detect new element
                    //   - Call resolveMXItem
                    //   - Calculate index based on DOM position
                    //   - Call _hydrateAdd(proxy, calculatedIndex)
                    //   - _hydrateAdd will insert proxy at correct position in array
                    const [newItemProxy] = await Promise.all([
                        hydrationPromise,
                        deletionPromise,
                    ]);

                    return newItemProxy as T & MxElProxy;
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
