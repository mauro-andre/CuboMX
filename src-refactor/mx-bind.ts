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

const resolveMXBind = (el: MxElement, publicAPI: PublicAPI) => {
    // mx-bind:attrToBind="componentAttr"
    // :attrToBind="componentAttr"
    // mx-bind:attrToBind="$componentName.componentAttr"
    // :attrToBind="$componentName.componentAttr"
    for (const attr of Array.from(el.attributes)) {
        let attrToBind: string | null = null;
        let componentName: string | null = null;
        let componentAttr: string | null = null;
        let mxDataEl: MxElement | null = null;
        let proxy: MxElProxy | MxProxy | null = null;
        let value: any | null = null;

        if (attr.name.startsWith("mx-bind:")) {
            attrToBind = attr.name.replace("mx-bind:", "");
        } else if (attr.name.startsWith(":") && !attr.name.startsWith("::")) {
            attrToBind = attr.name.substring(1);
        }
        if (!attrToBind) continue;
        if (attr.value.startsWith("$")) {
            const value = attr.value.split(".");
            componentName = value[0].substring(1);
            componentAttr = value[1];
            proxy = publicAPI[componentName] ?? null;
        } else {
            componentAttr = attr.value;
            mxDataEl = el.closest("[mx-data]");
            proxy = mxDataEl?.__mxProxy__ ?? null;
        }
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
        if (attrToBind == "class") {
            value = el.getAttribute(attrToBind)?.split(" ");
        } else if (attrToBind == "text") {
            value = el.innerHTML;
        } else if (attrToBind == "html") {
            value = el.innerHTML;
        } else {
            value = parseValue(el.getAttribute(attrToBind));
        }
        proxy[componentAttr] = value;
    }
};

export { resolveMXBind };
