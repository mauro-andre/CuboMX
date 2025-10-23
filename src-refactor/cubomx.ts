import { MxProxy, MxComponent, PublicAPI, MxElement } from "./types";
import { createProxy } from "./proxies";
import { resolveMXData } from "./mx-data";
import { resolveMXBind, resolveMXItem } from "./mx-bind-and-mx-item";

const CuboMX = (() => {
    let registeredComponents: Record<string, object | Function> = {};
    let registeredStores: Record<string, object> = {};
    let activeMxProxies: Record<string, MxProxy> = {};
    let observer: MutationObserver | null = null;
    let publicAPIProxy: PublicAPI & Record<string, any>;

    const reset = () => {
        registeredComponents = {};
        registeredStores = {};
        activeMxProxies = {};
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    };

    const bindDirectives = (node: MxElement) => {
        const allElements = Array.from(node.querySelectorAll<MxElement>("*"));

        const mxData = allElements.filter((el) => el.hasAttribute("mx-data"));
        for (const el of mxData) {
            resolveMXData(el, registeredComponents);
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
    };

    const resolveNode = (node: MxElement) => {
        bindDirectives(node);
    };

    const resolveStores = () => {
        for (const [name, obj] of Object.entries(registeredStores)) {
            activeMxProxies[name] = createProxy(obj, null) as MxProxy;
        }
    };

    const start = () => {
        resolveStores();
        resolveNode(document.body);
        observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of Array.from(mutation.addedNodes)) {
                    if (node.nodeType === 1) {
                        if ((node as MxElement).__doNotProcessNode__) {
                            continue;
                        }
                        resolveNode(node as MxElement);
                    }
                }

                for (const node of Array.from(mutation.removedNodes)) {
                    if (node.nodeType === 1) {
                        // Node.ELEMENT_NODE
                        // console.log("REMOVE NODE")
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
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
    };

    publicAPIProxy = new Proxy(publicAPI, {
        get(target, prop) {
            if (prop in target) return Reflect.get(target, prop);

            if (prop in activeMxProxies) {
                return activeMxProxies[prop as string];
            }

            const el = document.querySelector<MxElement>(
                `[mx-data="${prop as string}"], [mx-ref="${prop as string}"]`
            );
            return el?.__mxProxy__;
        },
    }) as PublicAPI & Record<string, any>;

    return publicAPIProxy;
})();

export { CuboMX, MxElement, MxComponent };
