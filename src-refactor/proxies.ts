import { MxElement, MxElProxy, MxProxy, Reaction } from "./types";

const reactionsSymbol = Symbol("reactions");

const createProxy = (obj: any, el: MxElement | null): MxElProxy | MxProxy => {
    obj[reactionsSymbol] = new Map<string, Array<Reaction>>();
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
            // console.log(target);
            const reactionMap = target[reactionsSymbol] as Map<
                string,
                Array<Reaction>
            >;
            const reactions = reactionMap.get(prop as string);

            if (reactions && reactions.length > 0) {
                for (const reaction of reactions) {
                    console.log("EXECUTAR REAÇÃO");
                    console.log(reaction);
                }
            }

            target[prop] = value;
            return true;
        },
    });

    return proxy;
};

export { createProxy, reactionsSymbol };
