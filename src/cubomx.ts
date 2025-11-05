import {
    MxProxy,
    MxElProxy,
    MxComponent,
    PublicAPI,
    MxElement,
    ArrayItems,
    ClassList,
    RequestResponse,
} from "./types";
import { createProxy } from "./proxy-component";
import { resolveMXData } from "./mx-data";
import { resolveMXBind, resolveMXItem } from "./mx-bind-and-mx-item";
import { resolveMXOn } from "./mx-on";
import { resolveMXShow } from "./mx-show";
import { resolveMXLink } from "./mx-link";
import { resolveMXLoad } from "./mx-load";
import { swap } from "./swap";
import { restoreState } from "./history";
import { request } from "./request";

const CuboMX = (() => {
    let registeredComponents: Record<string, object | Function> = {};
    let registeredStores: Record<string, object> = {};
    let activeStoreProxies: Record<string, MxProxy> = {};
    let observer: MutationObserver | null = null;
    let publicAPIProxy: PublicAPI & Record<string, any>;
    let popstateListener: ((this: Window, ev: PopStateEvent) => any) | null =
        null;

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

    const bindDirectives = (node: MxElement): MxElProxy[] => {
        const allElements = [
            node,
            ...Array.from(node.querySelectorAll<MxElement>("*")),
        ];

        const mxData = allElements.filter((el) => el.hasAttribute("mx-data"));
        const proxies: MxElProxy[] = [];
        for (const el of mxData) {
            const proxy = resolveMXData(el, registeredComponents);
            if (proxy) proxies.push(proxy);
        }

        const mxBind = allElements.filter((el) =>
            Array.from(el.attributes).some(
                (attr) =>
                    attr.name.startsWith("mx-bind:") ||
                    (attr.name.startsWith(":") && !attr.name.startsWith("::"))
            )
        );
        for (const el of mxBind) {
            resolveMXBind(el, publicAPIProxy);
        }

        const mxItem = allElements.filter((el) =>
            Array.from(el.attributes).some((attr) => attr.name === "mx-item")
        );
        for (const el of mxItem) {
            resolveMXItem(el, publicAPIProxy);
        }

        const mxOn = allElements.filter((el) =>
            Array.from(el.attributes).some(
                (attr) =>
                    attr.name.startsWith("mx-on") || attr.name.startsWith("@")
            )
        );
        for (const el of mxOn) {
            resolveMXOn(el, publicAPIProxy);
        }

        const mxShow = allElements.filter((el) =>
            Array.from(el.attributes).some((attr) =>
                attr.name.startsWith("mx-show")
            )
        );
        for (const el of mxShow) {
            resolveMXShow(el, publicAPIProxy);
        }

        const mxLink = allElements.filter((el) =>
            Array.from(el.attributes).some((attr) =>
                attr.name.startsWith("mx-link")
            )
        );
        for (const el of mxLink) {
            resolveMXLink(el, publicAPIProxy);
        }

        const mxLoad = allElements.filter((el) =>
            Array.from(el.attributes).some((attr) =>
                attr.name.startsWith("mx-load")
            )
        );
        for (const el of mxLoad) {
            resolveMXLoad(el, publicAPIProxy);
        }

        return proxies;
    };

    const processInit = (proxies: Array<MxElProxy | MxProxy>) => {
        for (const proxy of proxies) {
            if (typeof proxy.init === "function") {
                proxy.init();
            }
        }
    };

    const processOnDOMUpdate = (proxies: Array<MxElProxy | MxProxy>) => {
        for (const proxy of proxies) {
            if (typeof proxy.onDOMUpdate === "function") {
                proxy.onDOMUpdate();
            }
        }
    };

    const processDestroy = (proxies: MxElProxy[]) => {
        for (const proxy of proxies) {
            if (typeof proxy.destroy === "function") {
                proxy.destroy();
            }
        }
    };

    const resolveRemovedNode = (node: MxElement) => {
        const mxData = [
            node,
            ...Array.from(node.querySelectorAll<MxElement>("[mx-data]")),
        ];

        const proxies: MxElProxy[] = [];
        for (const el of mxData) {
            const proxy = el.__mxProxy__;
            if (proxy) proxies.push(proxy as MxElProxy);
        }

        processDestroy(proxies);
    };

    const resolveNode = (node: MxElement): MxProxy[] => {
        const proxies: MxProxy[] = bindDirectives(node);
        // processInit(proxies);
        return proxies;
    };

    const resolveStores = (): MxProxy[] => {
        const proxies: MxProxy[] = [];
        for (const [name, obj] of Object.entries(registeredStores)) {
            activeStoreProxies[name] = createProxy(obj, null) as MxProxy;
            proxies.push(activeStoreProxies[name]);
        }
        // processInit(proxies);
        return proxies;
    };

    const getAllActiveProxies = (): Array<MxElProxy | MxProxy> => {
        const allProxies: Array<MxElProxy | MxProxy> = [];

        // Add all store proxies
        for (const storeProxy of Object.values(activeStoreProxies)) {
            allProxies.push(storeProxy);
        }

        // Add all component proxies from DOM
        const allMxDataElements =
            document.querySelectorAll<MxElement>("[mx-data]");
        for (const el of Array.from(allMxDataElements)) {
            if (el.__mxProxy__) {
                allProxies.push(el.__mxProxy__);
            }
        }

        return allProxies;
    };

    const start = () => {
        const storeProxies = resolveStores();
        const componentProxies = resolveNode(document.documentElement);
        processInit([...storeProxies, ...componentProxies]);
        observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of Array.from(mutation.addedNodes)) {
                    if (node.nodeType === 1) {
                        const element = node as MxElement;
                        const componentProxies = resolveNode(element);
                        processInit(componentProxies);
                        // Call onDOMUpdate on ALL active proxies
                        processOnDOMUpdate(getAllActiveProxies());

                        // Resolve async hydration promises
                        if (
                            typeof element.__resolveHydration__ === "function"
                        ) {
                            const proxy =
                                element.__itemProxy__ || element.__mxProxy__;
                            element.__resolveHydration__(proxy);
                            delete element.__resolveHydration__;
                        }
                    }
                }

                for (const node of Array.from(mutation.removedNodes)) {
                    if (node.nodeType === 1) {
                        const element = node as MxElement;
                        resolveRemovedNode(element);

                        // Resolve async deletion promises
                        if (typeof element.__resolveDelete__ === "function") {
                            element.__resolveDelete__();
                            delete element.__resolveDelete__;
                        }
                    }
                }
            }
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
        popstateListener = (event: PopStateEvent) => {
            restoreState(event.state);
        };
        window.addEventListener("popstate", popstateListener);
    };

    const component = (name: string, def: object | Function) => {
        registeredComponents[name] = def;
    };

    const store = (name: string, def: object) => {
        registeredStores[name] = def;
    };

    const publicAPI: PublicAPI = {
        reset,
        start,
        component,
        store,
        swap,
        request,
    };

    publicAPIProxy = new Proxy(publicAPI, {
        get(target, prop) {
            if (prop in target) return Reflect.get(target, prop);

            if (prop in activeStoreProxies) {
                return activeStoreProxies[prop as string];
            }

            const el = document.querySelector<MxElement>(
                `[mx-data="${prop as string}"], [mx-ref="${prop as string}"]`
            );
            return el?.__mxProxy__;
        },
    }) as PublicAPI & Record<string, any>;

    return publicAPIProxy;
})();

// Export developer-friendly types with clean names
export { CuboMX, MxComponent };
export type { ArrayItems, ClassList, RequestResponse };
