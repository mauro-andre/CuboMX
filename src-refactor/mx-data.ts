import { createProxy } from "./proxies";
import { MxElProxy, MxElement } from "./types";

const resolveMXData = (
    el: MxElement,
    registeredComponents: Record<string, object | Function>
) => {
    let componentName = el.getAttribute("mx-data");
    const isFactory = componentName?.endsWith("()");
    if (isFactory && componentName) {
        componentName = componentName.split("()")[0];
    }

    if (!componentName || !registeredComponents[componentName]) {
        console.warn(`[CuboMX] Component "${componentName}" not registered`);
        return;
    }

    const componentDef = registeredComponents[componentName];
    let obj = isFactory ? (componentDef as Function)() : componentDef;
    const proxy = createProxy(obj, el) as MxElProxy;
    el.__mxProxy__ = proxy;
};

export { resolveMXData };
