const createClassListProxy = (classes, parentProxy, propName) => {
    const triggerReactions = () => {
        parentProxy[propName] = proxy;
    };
    const proxy = new Proxy(classes, {
        has(target, prop) {
            if (prop === "add" ||
                prop === "remove" ||
                prop === "toggle" ||
                prop === "contains" ||
                prop === "replace") {
                return true;
            }
            return prop in target;
        },
        get(target, prop) {
            if (prop === "add") {
                return (...classNames) => {
                    for (const className of classNames) {
                        if (className && !target.includes(className)) {
                            target.push(className);
                        }
                    }
                    triggerReactions();
                };
            }
            if (prop === "remove") {
                return (...classNames) => {
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
                return (className, force) => {
                    const hasClass = target.includes(className);
                    if (force !== undefined) {
                        if (force) {
                            // Force add
                            if (!hasClass) {
                                target.push(className);
                                triggerReactions();
                            }
                            return true;
                        }
                        else {
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
                    }
                    else {
                        target.push(className);
                        triggerReactions();
                        return true;
                    }
                };
            }
            if (prop === "contains") {
                return (className) => {
                    return target.includes(className);
                };
            }
            if (prop === "replace") {
                return (oldClass, newClass) => {
                    const index = target.indexOf(oldClass);
                    if (index > -1) {
                        target[index] = newClass;
                        triggerReactions();
                        return true;
                    }
                    return false;
                };
            }
            return target[prop];
        },
        set(target, prop, value) {
            target[prop] = value;
            // Não dispara reactions no setter - apenas nos métodos públicos
            return true;
        },
    });
    return proxy;
};
export { createClassListProxy };
