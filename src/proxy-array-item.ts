import { MxElement, MxElProxy, Reaction, ArrayItems } from "./types";
import { preprocessBindings } from "./rendering-helpers";

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
                    if (
                        index !== undefined &&
                        index >= 0 &&
                        index <= target.length
                    ) {
                        target.splice(index, 0, itemProxy);
                    } else {
                        target.push(itemProxy);
                    }
                };
            }

            if (prop === "add" || prop === "push") {
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

            if (prop === "prepend" || prop === "unshift") {
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

            if (prop === "delete") {
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

            if (prop === "remove") {
                return async (item: T): Promise<void> => {
                    const index = target.indexOf(item as any);
                    if (index === -1) {
                        throw new Error(
                            `[CuboMX] Cannot remove item: item not found in array`
                        );
                    }
                    await (proxy as any).delete(index);
                };
            }

            if (prop === "pop") {
                return async (): Promise<void> => {
                    if (target.length === 0) {
                        return;
                    }
                    await (proxy as any).delete(target.length - 1);
                };
            }

            if (prop === "shift") {
                return async (): Promise<void> => {
                    if (target.length === 0) {
                        return;
                    }
                    await (proxy as any).delete(0);
                };
            }

            if (prop === "clear") {
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

            if (prop === "replace") {
                return async (
                    index: number,
                    item: T
                ): Promise<T & MxElProxy> => {
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
                        (oldItemProxy.$el as MxElement).__resolveDelete__ =
                            resolve;
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

            return target[prop as any];
        },
    });

    return proxy as ArrayItems<T>;
};

export { createArrayProxy };
