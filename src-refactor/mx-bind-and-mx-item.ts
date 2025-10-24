import { MxElement, MxElProxy, MxProxy } from "./types";
import { PublicAPI, Reaction } from "./types";
import { reactionsSymbol } from "./proxies";

const parseValue = (value: string | null): any => {
    const num = Number(value);
    const lowerValue = String(value).toLowerCase();
    if (!isNaN(num) && String(value).trim() !== "") {
        return num;
    } else if (lowerValue === "true") {
        return true;
    } else if (lowerValue === "false") {
        return false;
    } else if (lowerValue === "null" || lowerValue === "none") {
        return null;
    } else if (value === "undefined") {
        return undefined;
    } else {
        return value;
    }
};

const parseAttrToBind = (attr: Attr, prefixes: Array<string>) => {
    for (const prefix of prefixes) {
        if (attr.name.startsWith(prefix)) {
            const attrSplit = attr.name.replace(prefix, "").split(".");
            const attrToBind = attrSplit[0];
            const modifier = attrSplit[1];
            return { attrToBind, modifier };
        }
    }
};

const getComponentNameAttr = (attr: Attr) => {
    let componentName: string | null = null;
    let componentAttr: string | null = null;
    if (attr.value.startsWith("$")) {
        const value = attr.value.split(".");
        componentName = value[0].substring(1);
        componentAttr = value[1];
    } else {
        componentAttr = attr.value;
    }
    return { componentName, componentAttr };
};

const getProxyInfo = (el: MxElement, attr: Attr, publicAPI: PublicAPI) => {
    let componentName: string | null = null;
    let componentAttr: string | null = null;
    let proxy: MxElProxy | MxProxy | null = null;

    if (attr.value.startsWith("$")) {
        const value = attr.value.split(".");
        componentName = value[0].substring(1);
        componentAttr = value[1];
        proxy = publicAPI[componentName] ?? null;
    } else {
        componentAttr = attr.value;
        const mxDataEl: MxElement | null = el.closest("[mx-data]");
        proxy = mxDataEl?.__mxProxy__ ?? null;
    }
    return { proxy, componentName, componentAttr };
};

const parseAttrValue = (el: MxElement, attrToBind: string) => {
    if (attrToBind == "class") {
        return el.getAttribute(attrToBind)?.split(" ");
    } else if (attrToBind == "text") {
        return parseValue(el.textContent?.trim() ?? "");
    } else if (attrToBind == "html") {
        return el.innerHTML;
    } else {
        return parseValue(el.getAttribute(attrToBind));
    }
};

const assignValue = (
    obj: any,
    attrToAssign: string,
    valueToAssign: any,
    modifier: string | undefined | null
) => {
    if (modifier) {
        modifier = modifier.toLowerCase();
        if (modifier === "array") {
            if (!obj[attrToAssign]) {
                obj[attrToAssign] = [valueToAssign];
            } else {
                obj[attrToAssign].push(valueToAssign);
            }
        } else {
            console.error(
                `[CuboMX] The bind modifier "${modifier}" is unknown`
            );
        }
    } else {
        obj[attrToAssign] = valueToAssign;
    }
};

const addReaction = (
    proxy: MxElProxy | MxProxy,
    propName: string,
    reaction: Reaction
) => {
    const reactionMap = proxy[reactionsSymbol as any] as Map<
        string,
        Array<Reaction>
    >;

    if (!reactionMap.has(propName)) {
        reactionMap.set(propName, []);
    }

    reactionMap.get(propName)?.push(reaction);
};

const resolveMXBind = (el: MxElement, publicAPI: PublicAPI) => {
    for (const attr of Array.from(el.attributes)) {
        const parsed = parseAttrToBind(attr, ["mx-bind:", ":"]);
        if (!parsed) continue;
        const { attrToBind, modifier } = parsed;
        if (!attrToBind || attrToBind.startsWith(":")) continue;
        const { proxy, componentName, componentAttr } = getProxyInfo(
            el,
            attr,
            publicAPI
        );
        if (!proxy) {
            if (componentName) {
                console.error(
                    `[CuboMX] mx-bind directive failed: Component "${componentName}" not found`
                );
            } else {
                console.error(
                    `[CuboMX] mx-bind directive failed: No mx-data component found in element or ancestors`
                );
            }
            continue;
        }

        const value = parseAttrValue(el, attrToBind);
        assignValue(proxy, componentAttr, value, modifier);

        const reaction: Reaction = {
            element: el,
            attrName:
                attrToBind === "text" || attrToBind === "html"
                    ? undefined
                    : attrToBind,
            type:
                attrToBind === "text"
                    ? "text"
                    : attrToBind === "html"
                    ? "html"
                    : "attribute",
        };
        addReaction(proxy, componentAttr, reaction);
    }
};

const resolveMXItem = (el: MxElement, publicAPI: PublicAPI) => {
    const mainAttr = el.getAttributeNode("mx-item");
    if (!mainAttr) return;
    const { proxy, componentName, componentAttr } = getProxyInfo(
        el,
        mainAttr,
        publicAPI
    );

    if (!proxy) {
        if (componentName) {
            console.error(
                `[CuboMX] mx-item directive failed: Component "${componentName}" not found`
            );
        } else {
            console.error(
                `[CuboMX] mx-item directive failed: No mx-data component found in element or ancestors`
            );
        }
        return;
    }

    const newItem = {};

    const allElementsInScope = [
        el,
        ...Array.from(el.querySelectorAll<MxElement>("*")),
    ];

    for (const element of allElementsInScope) {
        for (const attr of Array.from(element.attributes)) {
            const parsed = parseAttrToBind(attr, ["mx-item:", "::"]);
            if (!parsed) continue;
            const { attrToBind, modifier } = parsed;
            const component = getComponentNameAttr(attr);
            const value = parseAttrValue(element, attrToBind);
            assignValue(newItem, component.componentAttr, value, modifier);
        }
    }

    assignValue(proxy, componentAttr, newItem, "array");
};

export { resolveMXBind, resolveMXItem };
