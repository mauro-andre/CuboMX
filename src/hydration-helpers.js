import { reactionsSymbol } from "./proxy-component";
const parseValue = (value) => {
    if (!value)
        return true; // cases where the attribute has no value
    const num = Number(value);
    const lowerValue = String(value).toLowerCase();
    if (!isNaN(num) && String(value).trim() !== "") {
        return num;
    }
    else if (lowerValue === "true") {
        return true;
    }
    else if (lowerValue === "false") {
        return false;
    }
    else if (lowerValue === "null" || lowerValue === "none") {
        return null;
    }
    else if (value === "undefined") {
        return undefined;
    }
    else {
        return value;
    }
};
const parseAttrToBind = (attr, prefixes) => {
    for (const prefix of prefixes) {
        if (attr.name.startsWith(prefix)) {
            const attrSplit = attr.name.replace(prefix, "").split(".");
            const attrToBind = attrSplit[0];
            const modifier = attrSplit[1];
            return { attrToBind, modifier };
        }
    }
};
const getComponentNameAttr = (attr) => {
    let componentName = null;
    let componentAttr = null;
    if (attr.value.startsWith("$")) {
        const value = attr.value.split(".");
        componentName = value[0].substring(1);
        componentAttr = value[1];
    }
    else {
        componentAttr = attr.value;
    }
    return { componentName, componentAttr };
};
const getProxyInfo = (el, attr, publicAPI) => {
    let componentName = null;
    let componentAttr = null;
    let proxy = null;
    if (attr.value.startsWith("$")) {
        const value = attr.value.split(".");
        componentName = value[0].substring(1);
        componentAttr = value[1];
        proxy = publicAPI[componentName] ?? null;
    }
    else {
        componentAttr = attr.value;
        const mxDataEl = el.closest("[mx-data]");
        proxy = mxDataEl?.__mxProxy__ ?? null;
    }
    return { proxy, componentName, componentAttr };
};
const parseAttrValue = (el, attrToBind) => {
    if (attrToBind == "class") {
        return (el
            .getAttribute(attrToBind)
            ?.split(" ")
            .filter((c) => c.trim() !== "") ?? []);
    }
    else if (attrToBind == "value") {
        if (el instanceof HTMLInputElement ||
            el instanceof HTMLTextAreaElement ||
            el instanceof HTMLSelectElement) {
            return el.value;
        }
        return parseValue(el.getAttribute(attrToBind));
    }
    else if (attrToBind == "checked") {
        return el.checked;
    }
    else if (attrToBind == "text") {
        return parseValue(el.textContent?.trim() ?? "");
    }
    else if (attrToBind == "html") {
        return el.innerHTML;
    }
    else {
        return parseValue(el.getAttribute(attrToBind));
    }
};
const assignValue = (obj, attrToAssign, valueToAssign, modifier) => {
    if (modifier) {
        modifier = modifier.toLowerCase();
        console.error(`[CuboMX] The bind modifier "${modifier}" is unknown`);
    }
    else {
        obj[attrToAssign] = valueToAssign;
    }
};
const createReaction = (el, attrToBind) => {
    return {
        element: el,
        attrName: attrToBind === "text" ||
            attrToBind === "html" ||
            attrToBind === "class" ||
            attrToBind === "mx-show"
            ? undefined
            : attrToBind,
        type: attrToBind === "text"
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
const addReaction = (proxy, propName, reaction) => {
    const reactionMap = proxy[reactionsSymbol];
    if (!reactionMap.has(propName)) {
        reactionMap.set(propName, []);
    }
    reactionMap.get(propName)?.push(reaction);
};
const twoWayBinding = (attrToBind, propName, proxy, el) => {
    if (attrToBind === "value") {
        el.addEventListener("input", () => {
            proxy[propName] = el.value;
        });
    }
    else if (attrToBind === "checked") {
        el.addEventListener("change", () => {
            proxy[propName] = el.checked;
        });
    }
};
export { parseValue, parseAttrToBind, getComponentNameAttr, getProxyInfo, parseAttrValue, assignValue, createReaction, addReaction, twoWayBinding, };
