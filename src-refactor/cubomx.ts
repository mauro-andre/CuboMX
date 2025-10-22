type MxProxy = Record<string, any> & {
    $watch?: Function
}

type MxElProxy = MxProxy & {
    $el: HTMLElement
}

type PublicAPI = {
    reset: () => void
    start: () => void
    component: (name: string, def: object | Function) => void
    store: (name: string, def: object) => void
}


interface MxElement extends HTMLElement {
    __doNotProcessNode__?: boolean
    __mxProxy__?: MxElProxy
}

const CuboMX = (() => {
    let registeredComponents: Record<string, object | Function> = {};
    let registeredStores: Record<string, object> = {}
    let activeMxProxies: Record<string, MxProxy> = {};
    let observer: MutationObserver | null = null

    const reset = () => {
        registeredComponents = {};
        registeredStores = {};
        activeMxProxies = {};
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    };

    const createProxy = (obj: any, el: MxElement | null): MxElProxy | MxProxy => new Proxy(obj, {
        get(target, prop) {
            if (prop === "$el") {
                return el
            }
            return target[prop]
        },

        set(target, prop, value) {
            target[prop] = value
            return true
        }
    })

    const bindMxData = (el: MxElement) => {
        let componentName = el.getAttribute("mx-data")
        const isFactory = componentName?.endsWith("()")
        if (isFactory && componentName) {
            componentName = componentName.split("()")[0]
        }

        if (!componentName || !registeredComponents[componentName]) {
            console.warn(`[CuboMX] Component "${componentName}" not registered`)
            return
        }

        const componentDef = registeredComponents[componentName]
        let obj = isFactory ? (componentDef as Function)() : componentDef
        const proxy = createProxy(obj, el) as MxElProxy
        el.__mxProxy__ = proxy
    }

    const bindDirectives = (node: MxElement) => {
        const mxData = Array.from(node.querySelectorAll<MxElement>("[mx-data]"))
        for (const el of mxData) {
            bindMxData(el)
        }
    }

    const resolveNode = (node: MxElement) => {
        bindDirectives(node)
    }

    const resolveStores = () => {
        for (const [name, obj] of Object.entries(registeredStores)) {
            activeMxProxies[name] = createProxy(obj, null) as MxProxy
        }
    }

    const start = () => {
        resolveStores()
        resolveNode(document.body)
        observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of Array.from(mutation.addedNodes)) {
                    if (node.nodeType === 1) {
                        if ((node as MxElement).__doNotProcessNode__) {
                            continue
                        }
                        resolveNode(node as MxElement)
                    }
                }

                for (const node of Array.from(mutation.removedNodes)) {
                    if (node.nodeType === 1) { // Node.ELEMENT_NODE
                        // console.log("REMOVE NODE")
                    }
                }
            }
        })
        observer.observe(document.body, { childList: true, subtree: true });
    }

    const component = (name: string, def: object | Function) => {
        registeredComponents[name] = def
    };

    const store = (name: string, def: object) => {
        registeredStores[name] = def
    }

    const publicAPI: PublicAPI = {
        reset,
        start,
        component,
        store
    }

    return new Proxy(publicAPI, {
        get(target, prop) {
            if (prop in target) return Reflect.get(target, prop)

            if (prop in activeMxProxies) {
                return activeMxProxies[prop as string]
            }

            const el = document.querySelector<MxElement>(`[mx-data="${prop as string}"], [mx-ref="${prop as string}"]`)
            return el?.__mxProxy__
        }
    }) as PublicAPI & Record<string, any>
})();

export { CuboMX, MxElement };
