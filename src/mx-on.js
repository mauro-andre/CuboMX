const parseEvents = (el, publicAPI) => {
    const parses = [];
    const prefixes = ["mx-on:", "@"];
    for (const attr of Array.from(el.attributes)) {
        for (const prefix of prefixes) {
            if (attr.name.startsWith(prefix)) {
                const data = attr.name.slice(prefix.length).split(".");
                const trigger = data[0];
                const modifier = data[1];
                let callback = null;
                let proxy = null;
                if (attr.value.startsWith("$")) {
                    const value = attr.value.split(".");
                    const componentName = value[0].substring(1);
                    callback = value[1];
                    proxy = publicAPI[componentName] ?? null;
                }
                else {
                    callback = attr.value;
                    const mxDataEl = el.closest("[mx-data]");
                    proxy = mxDataEl?.__mxProxy__ ?? null;
                }
                const itemEl = el.closest("[mx-item]");
                const itemProxy = itemEl?.__itemProxy__ ?? null;
                parses.push({ trigger, modifier, callback, proxy, itemProxy });
            }
        }
    }
    return parses;
};
const listener = (event, modifier, el, callback, proxy, itemProxy) => {
    if (modifier === "prevent") {
        event.preventDefault();
    }
    else if (modifier === "stop") {
        event.stopPropagation();
    }
    else if (modifier === "outside") {
        if (el.contains(event.target)) {
            return;
        }
    }
    try {
        const fn = new Function("$event", "$el", "$item", `with(this) { return ${callback} }`);
        fn.call(proxy, event, el, itemProxy);
    }
    catch (error) {
        console.error(`[mx-on] Error executing callback "${callback}":`, error);
    }
};
const resolveMXOn = (el, publicAPI) => {
    const parses = parseEvents(el, publicAPI);
    for (const parse of parses) {
        const { trigger, modifier, callback, proxy, itemProxy } = parse;
        if (!proxy) {
            console.error(`[CuboMX] mx-on (@) directive failed: Component not found`);
            continue;
        }
        const eventHandler = (event) => {
            listener(event, modifier, el, callback, proxy, itemProxy);
        };
        if (modifier === "outside") {
            document.addEventListener(trigger, eventHandler);
        }
        else {
            el.addEventListener(trigger, eventHandler);
        }
    }
};
export { resolveMXOn };
