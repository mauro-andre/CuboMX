import { MxElement, PublicAPI, MxElProxy, MxProxy, Reaction } from "./types";
import { reactionsSymbol } from "./proxy-component";

const parseValue = (value: string | null): any => {
    if (!value) return true; // cases where the attribute has no value
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
        return (
            el
                .getAttribute(attrToBind)
                ?.split(" ")
                .filter((c) => c.trim() !== "") ?? []
        );
    } else if (attrToBind == "value") {
        if (
            el instanceof HTMLInputElement ||
            el instanceof HTMLTextAreaElement ||
            el instanceof HTMLSelectElement
        ) {
            return el.value;
        }
        return parseValue(el.getAttribute(attrToBind));
    } else if (attrToBind == "checked") {
        return (el as any).checked;
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
        console.error(`[CuboMX] The bind modifier "${modifier}" is unknown`);
    } else {
        obj[attrToAssign] = valueToAssign;
    }
};

const createReaction = (el: MxElement, attrToBind: string): Reaction => {
    return {
        element: el,
        attrName:
            attrToBind === "text" ||
            attrToBind === "html" ||
            attrToBind === "class" ||
            attrToBind === "mx-show"
                ? undefined
                : attrToBind,
        type:
            attrToBind === "text"
                ? "text"
                : attrToBind === "html"
                ? "html"
                : attrToBind === "class"
                ? "class"
                : attrToBind === "mx-show"
                ? "mx-show"
                : "attribute",
    };
};

const addReaction = (
    proxy: MxElProxy | MxProxy,
    propName: string,
    reaction: Reaction
) => {
    const reactionMap = proxy[reactionsSymbol as any] as Map<
        string,
        Reaction[]
    >;

    if (!reactionMap.has(propName)) {
        reactionMap.set(propName, []);
    }

    reactionMap.get(propName)?.push(reaction);
};

const twoWayBinding = (
    attrToBind: string,
    propName: string,
    proxy: MxElProxy,
    el: MxElement
) => {
    if (attrToBind === "value") {
        el.addEventListener("input", () => {
            proxy[propName] = (el as any).value;
        });
    } else if (attrToBind === "checked") {
        el.addEventListener("change", () => {
            proxy[propName] = (el as any).checked;
        });
    }
};

export {
    parseValue,
    parseAttrToBind,
    getComponentNameAttr,
    getProxyInfo,
    parseAttrValue,
    assignValue,
    createReaction,
    addReaction,
    twoWayBinding,
};
