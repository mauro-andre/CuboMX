import { MxElement, PublicAPI } from "./types";
import { MxElProxy, MxProxy } from "./types";

interface ParseEvent {
    trigger: string;
    modifier: string | undefined;
    callbackName: string;
    proxy: MxElProxy | MxProxy | null;
    itemProxy: MxElProxy | null;
}

const parseEvents = (el: MxElement, publicAPI: PublicAPI): ParseEvent[] => {
    const parses = [];
    const prefixes = ["mx-on:", "@"];
    for (const attr of Array.from(el.attributes)) {
        for (const prefix of prefixes) {
            if (attr.name.startsWith(prefix)) {
                const data = attr.name.slice(prefix.length).split(".");
                const trigger = data[0];
                const modifier = data[1];
                let callbackName = null;
                let proxy = null;
                if (attr.value.startsWith("$")) {
                    const value = attr.value.split(".");
                    const componentName = value[0].substring(1);
                    callbackName = value[1];
                    proxy = publicAPI[componentName] ?? null;
                } else {
                    callbackName = attr.value;
                    const mxDataEl: MxElement | null = el.closest("[mx-data]");
                    proxy = mxDataEl?.__mxProxy__ ?? null;
                }
                const itemEl: MxElement | null = el.closest("[mx-item]");
                const itemProxy = itemEl?.__itemProxy__ ?? null;
                parses.push({
                    trigger,
                    modifier,
                    callbackName,
                    proxy,
                    itemProxy,
                });
            }
        }
    }
    return parses;
};

const listener = (
    event: Event,
    modifier: string | undefined,
    el: MxElement,
    callbackName: string,
    proxy: MxElProxy | MxProxy,
    itemProxy: MxElProxy | null
) => {
    if (modifier === "prevent") {
        event.preventDefault();
    } else if (modifier === "stop") {
        event.stopPropagation();
    } else if (modifier === "outside") {
        if (el.contains(event.target as Node)) {
            return;
        }
    }

    try {
        const fn = new Function(
            "$event",
            "$el",
            "$item",
            `with(this) { return ${callbackName} }`
        );
        fn.call(proxy, event, el, itemProxy);
    } catch (error) {
        console.error(
            `[mx-on] Error executing callback "${callbackName}":`,
            error
        );
    }
};

const appearListener = (
    el: MxElement,
    callbackName: string,
    proxy: MxElProxy | MxProxy,
    itemProxy: MxElProxy | null
) => {
    setTimeout(() => {
        try {
            const fn = new Function(
                "$el",
                "$item",
                `with(this) { return ${callbackName} }`
            );
            fn.call(proxy, el, itemProxy);
        } catch (error) {
            console.error(
                `[mx-on] Error executing callback "${callbackName}":`,
                error
            );
        }
    }, 0);
};

const resolveMXOn = (el: MxElement, publicAPI: PublicAPI) => {
    const parses = parseEvents(el, publicAPI);

    for (const parse of parses) {
        const { trigger, modifier, callbackName, proxy, itemProxy } = parse;
        if (!proxy) {
            console.error(
                `[CuboMX] mx-on (@) directive failed: Component not found`
            );
            continue;
        }

        if (trigger === "appear") {
            appearListener(el, callbackName, proxy, itemProxy);
        } else {
            const eventHandler = (event: Event) =>
                listener(event, modifier, el, callbackName, proxy, itemProxy);

            if (modifier === "outside") {
                document.addEventListener(trigger, eventHandler);
            } else {
                el.addEventListener(trigger, eventHandler);
            }
        }
    }
};

export { resolveMXOn };
