import { MxElement, MxElProxy, MxProxy } from "./types";
import { PublicAPI } from "./types";

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
            return attr.name.replace(prefix, "");
        }
    }
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
        return el.innerHTML;
    } else if (attrToBind == "html") {
        return el.innerHTML;
    } else {
        return parseValue(el.getAttribute(attrToBind));
    }
};

const resolveMXBind = (el: MxElement, publicAPI: PublicAPI) => {
    for (const attr of Array.from(el.attributes)) {
        const attrToBind = parseAttrToBind(attr, ["mx-bind:", ":"]);
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
        proxy[componentAttr] = value;
    }
};

export { resolveMXBind };
