import { MxElement, MxElProxy, MxProxy, Reaction } from "./types";
import { resolveReactions } from "./reactions";

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

export { createProxy, reactionsSymbol };
