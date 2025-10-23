import { MxElement, MxElProxy, MxProxy } from "./types";

const createProxy = (obj: any, el: MxElement | null): MxElProxy | MxProxy =>
    new Proxy(obj, {
        get(target, prop) {
            if (prop === "$el") {
                return el;
            }
            return target[prop];
        },

        set(target, prop, value) {
            target[prop] = value;
            return true;
        },
    });

export { createProxy };
