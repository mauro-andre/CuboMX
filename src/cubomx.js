import { MxComponent, } from "./types";
import { createProxy } from "./proxy-component";
import { resolveMXData } from "./mx-data";
import { resolveMXBind, resolveMXItem } from "./mx-bind-and-mx-item";
import { resolveMXOn } from "./mx-on";
import { resolveMXShow } from "./mx-show";
import { swap } from "./swap";
import { restoreState } from "./history";
import { request } from "./request";
const CuboMX = (() => {
    let registeredComponents = {};
    let registeredStores = {};
    let activeStoreProxies = {};
    let observer = null;
    let publicAPIProxy;
    let popstateListener = null;
    const reset = () => {
        registeredComponents = {};
        registeredStores = {};
        activeStoreProxies = {};
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (popstateListener) {
            window.removeEventListener("popstate", popstateListener);
            popstateListener = null;
        }
    };
    const bindDirectives = (node) => {
        const allElements = [
            node,
            ...Array.from(node.querySelectorAll("*")),
        ];
        const mxData = allElements.filter((el) => el.hasAttribute("mx-data"));
        const proxies = [];
        for (const el of mxData) {
            const proxy = resolveMXData(el, registeredComponents);
            if (proxy)
                proxies.push(proxy);
        }
        const mxBind = allElements.filter((el) => Array.from(el.attributes).some((attr) => attr.name.startsWith("mx-bind:") ||
            (attr.name.startsWith(":") && !attr.name.startsWith("::"))));
        for (const el of mxBind) {
            resolveMXBind(el, publicAPIProxy);
        }
        const mxItem = allElements.filter((el) => Array.from(el.attributes).some((attr) => attr.name === "mx-item"));
        for (const el of mxItem) {
            resolveMXItem(el, publicAPIProxy);
        }
        const mxOn = allElements.filter((el) => Array.from(el.attributes).some((attr) => attr.name.startsWith("mx-on") || attr.name.startsWith("@")));
        for (const el of mxOn) {
            resolveMXOn(el, publicAPIProxy);
        }
        const mxShow = allElements.filter((el) => Array.from(el.attributes).some((attr) => attr.name.startsWith("mx-show")));
        for (const el of mxShow) {
            resolveMXShow(el, publicAPIProxy);
        }
        return proxies;
    };
    const processInit = (proxies) => {
        for (const proxy of proxies) {
            if (typeof proxy.init === "function") {
                proxy.init();
            }
        }
    };
    const processDestroy = (proxies) => {
        for (const proxy of proxies) {
            if (typeof proxy.destroy === "function") {
                proxy.destroy();
            }
        }
    };
    const resolveRemovedNode = (node) => {
        const mxData = [
            node,
            ...Array.from(node.querySelectorAll("[mx-data]")),
        ];
        const proxies = [];
        for (const el of mxData) {
            const proxy = el.__mxProxy__;
            if (proxy)
                proxies.push(proxy);
        }
        processDestroy(proxies);
    };
    const resolveNode = (node) => {
        const proxies = bindDirectives(node);
        // processInit(proxies);
        return proxies;
    };
    const resolveStores = () => {
        const proxies = [];
        for (const [name, obj] of Object.entries(registeredStores)) {
            activeStoreProxies[name] = createProxy(obj, null);
            proxies.push(activeStoreProxies[name]);
        }
        // processInit(proxies);
        return proxies;
    };
    const start = () => {
        const storeProxies = resolveStores();
        const componentProxies = resolveNode(document.body);
        processInit([...storeProxies, ...componentProxies]);
        observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of Array.from(mutation.addedNodes)) {
                    if (node.nodeType === 1) {
                        if (node.__doNotProcessNode__) {
                            continue;
                        }
                        const componentProxies = resolveNode(node);
                        processInit(componentProxies);
                    }
                }
                for (const node of Array.from(mutation.removedNodes)) {
                    if (node.nodeType === 1) {
                        resolveRemovedNode(node);
                        // Node.ELEMENT_NODE
                        // console.log("REMOVE NODE")
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        popstateListener = (event) => {
            restoreState(event.state);
        };
        window.addEventListener("popstate", popstateListener);
    };
    const component = (name, def) => {
        registeredComponents[name] = def;
    };
    const store = (name, def) => {
        registeredStores[name] = def;
    };
    const publicAPI = {
        reset,
        start,
        component,
        store,
        swap,
        request,
    };
    publicAPIProxy = new Proxy(publicAPI, {
        get(target, prop) {
            if (prop in target)
                return Reflect.get(target, prop);
            if (prop in activeStoreProxies) {
                return activeStoreProxies[prop];
            }
            const el = document.querySelector(`[mx-data="${prop}"], [mx-ref="${prop}"]`);
            return el?.__mxProxy__;
        },
    });
    return publicAPIProxy;
})();
// Export developer-friendly types with clean names
export { CuboMX, MxComponent };
