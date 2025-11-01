import { MxElement, MxElProxy, MxProxy, Reaction, ClassList } from "./types";
import { resolveReactions } from "./reactions";
import { createClassListProxy } from "./proxy-class-list";

const reactionsSymbol = Symbol("reactions");
const watchersSymbol = Symbol("watchers");

type WatchCallback = (newValue: any, oldValue: any) => void;

/**
 * Cria um ClassListProxy se o valor for string ou array
 * Retorna o ClassListProxy criado ou o valor original se não for aplicável
 */
const ensureClassListProxy = (
    value: any,
    proxy: MxElProxy | MxProxy,
    propName: string
): any => {
    if (Array.isArray(value) || typeof value === "string") {
        let classes: string[];
        if (typeof value === "string") {
            classes = value.split(" ").filter((c) => c.trim() !== "");
        } else {
            classes = value.filter(
                (c) => c && typeof c === "string" && c.trim() !== ""
            );
        }

        return createClassListProxy(classes, proxy, propName);
    }
    return value;
};

const createProxy = (obj: any, el: MxElement | null): MxElProxy | MxProxy => {
    obj[reactionsSymbol] = new Map<string, Reaction[]>();
    obj[watchersSymbol] = new Map<string, WatchCallback[]>();
    const proxy = new Proxy(obj, {
        get(target, prop) {
            if (prop === "$el") {
                return el;
            }

            if (prop === "$watch") {
                return (property: string, callback: WatchCallback) => {
                    const watchers = target[watchersSymbol] as Map<
                        string,
                        WatchCallback[]
                    >;

                    if (!watchers.has(property)) {
                        watchers.set(property, []);
                    }
                    watchers.get(property)!.push(callback);
                };
            }

            if (prop === reactionsSymbol) {
                return target[reactionsSymbol];
            }

            if (prop === watchersSymbol) {
                return target[watchersSymbol];
            }
            return target[prop];
        },

        set(target, prop, value) {
            const oldValue = target[prop];

            // Verifica se já existe um ArrayItems proxy
            if (Array.isArray(oldValue) && "_hydrateAdd" in oldValue) {
                // is ArrayItems - não pode ser substituído diretamente
                console.error(
                    `[CuboMX] Cannot set property "${String(
                        prop
                    )}": it is an ArrayItems created by mx-item directive. Use .add(), .delete(), .clear() instead.`
                );
                return true; // Retorna true mas não faz a atribuição
            }

            // Verifica se já existe um ClassListProxy
            if (Array.isArray(oldValue) && "toggle" in oldValue) {
                // is ClassListProxy
                let newClasses: string[];

                if (typeof value === "string") {
                    // Aceita string e converte para array
                    newClasses = value
                        .split(" ")
                        .filter((c) => c.trim() !== "");
                } else if (Array.isArray(value)) {
                    newClasses = value.filter(
                        (c) => c && typeof c === "string" && c.trim() !== ""
                    );
                } else {
                    console.error(
                        `[CuboMX] ${String(
                            prop
                        )} is a ClassList and can only be set to an array or string.`
                    );
                    return false;
                }

                // Substitui o conteúdo do ClassListProxy existente
                oldValue.length = 0;
                oldValue.push(...newClasses);
            } else {
                // Verifica se precisa criar um ClassListProxy
                const reactionMap = target[reactionsSymbol] as Map<
                    string,
                    Reaction[]
                >;
                const reactions = reactionMap.get(prop as string);
                const hasClassReaction = reactions?.some(
                    (r) => r.type === "class"
                );

                if (hasClassReaction) {
                    target[prop] = ensureClassListProxy(
                        value,
                        proxy,
                        prop as string
                    );
                } else {
                    target[prop] = value;
                }
            }

            const reactionMap = target[reactionsSymbol] as Map<
                string,
                Reaction[]
            >;
            const reactions = reactionMap.get(prop as string);

            if (reactions && reactions.length > 0) {
                for (const reaction of reactions) {
                    resolveReactions(reaction, target[prop], oldValue);
                }
            }

            const watchers = target[watchersSymbol] as Map<
                string,
                WatchCallback[]
            >;
            const watcherCallbacks = watchers.get(prop as string);

            if (watcherCallbacks && watcherCallbacks.length > 0) {
                for (const callback of watcherCallbacks) {
                    callback.call(proxy, target[prop], oldValue);
                }
            }

            return true;
        },
    });

    return proxy;
};

export { createProxy, reactionsSymbol, watchersSymbol, ensureClassListProxy };
