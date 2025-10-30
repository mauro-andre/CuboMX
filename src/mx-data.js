import { createProxy } from "./proxy-component";
const resolveMXData = (el, registeredComponents) => {
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
    let obj = isFactory ? componentDef() : componentDef;
    const proxy = createProxy(obj, el);
    el.__mxProxy__ = proxy;
    return el.__mxProxy__;
};
export { resolveMXData };
