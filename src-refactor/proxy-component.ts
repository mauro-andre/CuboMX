import { MxElement, MxElProxy, MxProxy, Reaction, ClassList } from "./types";
import { resolveReactions } from "./reactions";
import { createClassListProxy } from "./proxy-class-list";

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

            // Verifica se já existe um ClassListProxy
            if (Array.isArray(oldValue) && "toggle" in oldValue) {
                // is ClassListProxy
                let newClasses: string[];

                if (typeof value === "string") {
                    // Aceita string e converte para array
                    newClasses = value.split(" ").filter((c) => c.trim() !== "");
                } else if (Array.isArray(value)) {
                    newClasses = value.filter((c) => c && typeof c === "string" && c.trim() !== "");
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
                const hasClassReaction = reactions?.some((r) => r.type === "class");

                if (hasClassReaction && (Array.isArray(value) || typeof value === "string")) {
                    // Cria ClassListProxy
                    let classes: string[];
                    if (typeof value === "string") {
                        classes = value.split(" ").filter((c) => c.trim() !== "");
                    } else {
                        classes = value.filter((c) => c && typeof c === "string" && c.trim() !== "");
                    }

                    target[prop] = createClassListProxy(
                        classes,
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
            return true;
        },
    });

    return proxy;
};

export { createProxy, reactionsSymbol };
