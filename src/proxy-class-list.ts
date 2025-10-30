import { ClassList, MxProxy, MxElProxy } from "./types";

const createClassListProxy = (
    classes: string[],
    parentProxy: MxProxy | MxElProxy,
    propName: string
): ClassList => {
    const triggerReactions = () => {
        parentProxy[propName] = proxy;
    };

    const proxy = new Proxy(classes, {
        has(target, prop) {
            if (
                prop === "add" ||
                prop === "remove" ||
                prop === "toggle" ||
                prop === "contains" ||
                prop === "replace"
            ) {
                return true;
            }
            return prop in target;
        },
        get(target, prop) {
            if (prop === "add") {
                return (...classNames: string[]): void => {
                    for (const className of classNames) {
                        if (className && !target.includes(className)) {
                            target.push(className);
                        }
                    }
                    triggerReactions();
                };
            }

            if (prop === "remove") {
                return (...classNames: string[]): void => {
                    for (const className of classNames) {
                        const index = target.indexOf(className);
                        if (index > -1) {
                            target.splice(index, 1);
                        }
                    }
                    triggerReactions();
                };
            }

            if (prop === "toggle") {
                return (className: string, force?: boolean): boolean => {
                    const hasClass = target.includes(className);

                    if (force !== undefined) {
                        if (force) {
                            // Force add
                            if (!hasClass) {
                                target.push(className);
                                triggerReactions();
                            }
                            return true;
                        } else {
                            // Force remove
                            if (hasClass) {
                                const index = target.indexOf(className);
                                target.splice(index, 1);
                                triggerReactions();
                            }
                            return false;
                        }
                    }

                    // Toggle normal
                    if (hasClass) {
                        const index = target.indexOf(className);
                        target.splice(index, 1);
                        triggerReactions();
                        return false;
                    } else {
                        target.push(className);
                        triggerReactions();
                        return true;
                    }
                };
            }

            if (prop === "contains") {
                return (className: string): boolean => {
                    return target.includes(className);
                };
            }

            if (prop === "replace") {
                return (oldClass: string, newClass: string): boolean => {
                    const index = target.indexOf(oldClass);
                    if (index > -1) {
                        target[index] = newClass;
                        triggerReactions();
                        return true;
                    }
                    return false;
                };
            }

            return target[prop as any];
        },
        set(target, prop, value) {
            target[prop as any] = value;
            // Não dispara reactions no setter - apenas nos métodos públicos
            return true;
        },
    });

    return proxy as ClassList;
};

export { createClassListProxy };
